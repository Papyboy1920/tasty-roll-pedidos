// ============================================================
// Tasty Roll — capa de base de datos
// Dos backends: Postgres (si existe DATABASE_URL) o SQLite
// local (node:sqlite, sin dependencias nativas) como respaldo.
// Toda la app usa esta API async; server.js no toca SQL directo.
// ============================================================

const path = require("path");
const { SEED_CATALOG, CATALOG_VERSION } = require("./seed");

let kind = null;   // "pg" | "sqlite"
let pool = null;   // pg Pool
let sdb = null;    // node:sqlite DatabaseSync

const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    items TEXT NOT NULL,
    customer TEXT NOT NULL,
    payment TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'nuevo',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );
`;

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    items TEXT NOT NULL,
    customer TEXT NOT NULL,
    payment TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'nuevo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`;

// ---------- Fusión de catálogo (nunca destructiva) ----------
// Fusiona la semilla con el catálogo vivo SIN borrar ni sobrescribir
// lo que el dueño editó en /tienda:
// - Conserva intactos los departamentos/categorías/ítems agregados por el dueño.
// - Agrega los departamentos/categorías/ítems nuevos que trae la semilla.
// - Rellena solo campos vacíos (desc, img, image) desde la semilla.
// - Jamás toca name, price, unit, active ni ningún valor que ya exista.
function mergeCatalog(live, seed) {
  const base =
    live && Array.isArray(live.departments)
      ? JSON.parse(JSON.stringify(live))
      : { departments: [] };
  if (!Array.isArray(base.departments)) base.departments = [];
  let added = 0;
  let filled = 0;
  const byId = (arr, id) => (arr || []).find((x) => x && x.id === id);
  for (const sDept of (seed && seed.departments) || []) {
    let d = byId(base.departments, sDept.id);
    if (!d) {
      base.departments.push(JSON.parse(JSON.stringify(sDept)));
      added++;
      continue;
    }
    d.categories = d.categories || [];
    for (const sCat of sDept.categories || []) {
      let c = byId(d.categories, sCat.id);
      if (!c) {
        d.categories.push(JSON.parse(JSON.stringify(sCat)));
        added++;
        continue;
      }
      c.items = c.items || [];
      for (const sItem of sCat.items || []) {
        const it = byId(c.items, sItem.id);
        if (!it) {
          c.items.push(JSON.parse(JSON.stringify(sItem)));
          added++;
        } else {
          for (const f of ["desc", "img", "image"]) {
            if ((it[f] === undefined || it[f] === null || it[f] === "") && sItem[f]) {
              it[f] = sItem[f];
              filled++;
            }
          }
        }
      }
    }
  }
  return { catalog: base, added, filled };
}

// ---------- Correcciones de valores dirigidas por Portal (idempotentes) ----------
// Solo se aplican si el valor actual coincide EXACTAMENTE con el esperado;
// si el dueño ya lo cambió en /tienda, no se toca.
const VALUE_FIXES = [
  // v2 (2026-09-27, Portal): menú ampliado según sus diseños —
  // fotos, nombres y precios nuevos para los ítems existentes.
  { match: { name: "Roll Clásico", price: 300 },
    set: { name: "Cinnamon Roll Clásico", price: 320, image: "roll-clasico.jpg",
      desc: "Nuestro roll de canela clásico: esponjoso, tibio y con glaseado de queso crema. La tradición que nunca falla." } },
  { match: { name: "Caja de 3", price: 1190 },
    set: { name: "Caja de 3 Rolls Variados", price: 1290, image: "caja-3.jpg", badge: "Popular",
      desc: "3 Cinnamon Rolls con el sabor y topping de tu preferencia, en nuestra cajita rosada." } },
  { match: { name: "Caja de 6", price: 2350 },
    set: { name: "Caja de 6 Rolls Variados", price: 2490, image: "caja-6.jpg", badge: "25% DTO",
      desc: "6 cinnamon rolls rellenos con el sabor y topping de tu preferencia. Ideal para la familia o la oficina." } },
];

function applyValueFixes(catalog) {
  let fixed = 0;
  const norm = (s) => String(s || "").trim().toLowerCase();
  for (const dep of catalog.departments || [])
    for (const cat of dep.categories || [])
      for (const it of cat.items || []) {
        for (const fx of VALUE_FIXES) {
          const nameOk =
            !fx.match.name || norm(it.name) === norm(fx.match.name);
          const priceOk =
            fx.match.price === undefined || it.price === fx.match.price;
          if (nameOk && priceOk) {
            for (const [k, v] of Object.entries(fx.set)) it[k] = v;
            fixed++;
          }
        }
      }
  return fixed;
}

// ---------- Correcciones de departamentos dirigidas por Portal (idempotentes) ----------
// Solo se aplican si el valor actual coincide EXACTAMENTE con el esperado;
// si el dueño ya lo cambió en /tienda, no se toca.
const DEPT_FIXES = [
  // v3 (2026-09-27, Portal): el 🌀 parecía un huracán — ahora es una rosa 🌹
  { match: { id: "rolls", icon: "🌀" }, set: { icon: "🌹" } },
];

function applyDeptFixes(catalog) {
  let fixed = 0;
  for (const d of catalog.departments || []) {
    for (const fx of DEPT_FIXES) {
      if (fx.match.id && d.id !== fx.match.id) continue;
      if (fx.match.icon !== undefined && d.icon !== fx.match.icon) continue;
      for (const [k, v] of Object.entries(fx.set)) d[k] = v;
      fixed++;
    }
  }
  return fixed;
}

async function init() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require("pg");
    const url = process.env.DATABASE_URL;
    // Render/Supabase/etc. exigen SSL; local no.
    const local = /localhost|127\.0\.0\.1/.test(url);
    pool = new Pool({
      connectionString: url,
      ssl: local ? false : { rejectUnauthorized: false }
    });
    await pool.query(PG_SCHEMA);
    kind = "pg";
    console.log("[tastyroll] DB: Postgres");
  } else {
    const { DatabaseSync } = require("node:sqlite");
    sdb = new DatabaseSync(path.join(__dirname, "tasty-roll.db"));
    sdb.exec(SQLITE_SCHEMA);
    kind = "sqlite";
    console.log("[tastyroll] DB: SQLite local (tasty-roll.db)");
  }

  // Semilla solo si no existe; al subir CATALOG_VERSION se FUSIONA (nunca se borra).
  if (!(await kvGet("catalog"))) {
    await kvSet("catalog", JSON.stringify(SEED_CATALOG));
    await kvSet("catalog_version", String(CATALOG_VERSION));
    console.log("[tastyroll] Catálogo semilla cargado.");
  } else {
    const v = await kvGet("catalog_version");
    if (v !== String(CATALOG_VERSION)) {
      let live = null;
      try { live = JSON.parse(await kvGet("catalog")); } catch { live = null; }
      const m = mergeCatalog(live, SEED_CATALOG);
      const fixed = applyValueFixes(m.catalog);
      const dfixed = applyDeptFixes(m.catalog);
      await kvSet("catalog", JSON.stringify(m.catalog));
      await kvSet("catalog_version", String(CATALOG_VERSION));
      console.log(`[tastyroll] Catálogo fusionado (v${v} → v${CATALOG_VERSION}): +${m.added} nuevos, ${m.filled} campos rellenados, ${fixed} valores corregidos, ${dfixed} deptos corregidos. Lo del dueño intacto.`);
    }
  }
  if (!(await kvGet("order_seq"))) await kvSet("order_seq", "0");
  return kind;
}

function dbKind() { return kind; }

// ---------- kv ----------
async function kvGet(key) {
  if (kind === "pg") {
    const r = await pool.query("SELECT value FROM kv WHERE key = $1", [key]);
    return r.rows.length ? r.rows[0].value : null;
  }
  const row = sdb.prepare("SELECT value FROM kv WHERE key = ?").get(key);
  return row ? row.value : null;
}

async function kvSet(key, value) {
  if (kind === "pg") {
    await pool.query(
      "INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value]
    );
    return;
  }
  sdb.prepare(
    "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
}

// ---------- catálogo ----------
async function getCatalog() {
  return JSON.parse(await kvGet("catalog"));
}
async function setCatalog(cat) {
  await kvSet("catalog", JSON.stringify(cat));
}

// ---------- pedidos ----------
function mapOrder(row) {
  return {
    id: row.id,
    number: row.number,
    type: row.type,
    items: JSON.parse(row.items),
    customer: JSON.parse(row.customer),
    payment: row.payment,
    notes: row.notes || "",
    status: row.status,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

// Número de pedido secuencial, atómico en ambos backends.
async function nextOrderNumber() {
  let seq;
  if (kind === "pg") {
    const r = await pool.query(
      `INSERT INTO kv (key, value) VALUES ('order_seq', '1')
       ON CONFLICT(key) DO UPDATE SET value = ((kv.value)::int + 1)::text
       RETURNING value`
    );
    seq = Number(r.rows[0].value);
  } else {
    seq = Number(await kvGet("order_seq")) + 1;
    await kvSet("order_seq", String(seq));
  }
  return "#" + String(seq).padStart(3, "0");
}

async function createOrder({ number, type, items, customer, payment, notes }) {
  if (kind === "pg") {
    const r = await pool.query(
      `INSERT INTO orders (number, type, items, customer, payment, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,'nuevo') RETURNING *`,
      [number, type, JSON.stringify(items), JSON.stringify(customer), payment, notes || null]
    );
    return mapOrder(r.rows[0]);
  }
  const info = sdb.prepare(
    "INSERT INTO orders (number, type, items, customer, payment, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'nuevo')"
  ).run(number, type, JSON.stringify(items), JSON.stringify(customer), payment, notes || null);
  const row = sdb.prepare("SELECT * FROM orders WHERE id = ?").get(info.lastInsertRowid);
  return mapOrder(row);
}

async function listOrders() {
  if (kind === "pg") {
    const r = await pool.query("SELECT * FROM orders ORDER BY id DESC LIMIT 200");
    return r.rows.map(mapOrder);
  }
  return sdb.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all().map(mapOrder);
}

async function getOrder(id) {
  if (kind === "pg") {
    const r = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    return r.rows.length ? mapOrder(r.rows[0]) : null;
  }
  const row = sdb.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  return row ? mapOrder(row) : null;
}

async function updateOrderStatus(id, status) {
  if (kind === "pg") {
    const r = await pool.query("UPDATE orders SET status = $1 WHERE id = $2 RETURNING *", [status, id]);
    return r.rows.length ? mapOrder(r.rows[0]) : null;
  }
  const row = sdb.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!row) return null;
  sdb.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  return mapOrder(sdb.prepare("SELECT * FROM orders WHERE id = ?").get(id));
}

// Solo para limpieza de pruebas (no se expone en la API).
async function deleteOrder(id) {
  if (kind === "pg") {
    await pool.query("DELETE FROM orders WHERE id = $1", [id]);
  } else {
    sdb.prepare("DELETE FROM orders WHERE id = ?").run(id);
  }
}

// Limpieza total del historial desde /tienda (boton "Limpiar historial").
async function deleteAllOrders() {
  if (kind === "pg") {
    await pool.query("DELETE FROM orders");
    await pool.query("UPDATE kv SET value = '0' WHERE key = 'order_seq'");
  } else {
    sdb.prepare("DELETE FROM orders").run();
    sdb.prepare("UPDATE kv SET value = '0' WHERE key = 'order_seq'").run();
  }
}

module.exports = {
  init,
  dbKind,
  kvGet,
  kvSet,
  getCatalog,
  setCatalog,
  nextOrderNumber,
  createOrder,
  listOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  deleteAllOrders
};
