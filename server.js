// ============================================================
// Tasty Roll — servidor
// Node.js + Express. DB: Postgres (DATABASE_URL) o SQLite local.
// Ejecutar: npm install && node server.js
// Env vars:
//   PORT          puerto (default 3000)
//   DATABASE_URL  si existe -> Postgres; si no -> SQLite local
//   STORE_KEY     clave compartida para /tienda y APIs de tienda.
//                 Si no se define, modo desarrollo (abierto, con aviso).
// ============================================================

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const db = require("./db");
const suspend = require("./suspend");

const PORT = process.env.PORT || 3000;
const STORE_KEY = process.env.STORE_KEY || "";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Interruptor de suspensión del dueño (Portal) — antes de static y rutas
app.use(suspend.middleware);
suspend.registerAdmin(app);

// ---------------- Auth de tienda ----------------
if (!STORE_KEY) {
  console.warn("[tastyroll] ⚠️  STORE_KEY no configurado — /tienda abierto (modo desarrollo). Define STORE_KEY en producción.");
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Protege las APIs de tienda. Acepta header x-store-key (página)
// o ?key= (EventSource no puede enviar headers).
function requireStore(req, res, next) {
  if (!STORE_KEY) return next(); // modo desarrollo
  const k = req.headers["x-store-key"] || req.query.key || "";
  if (k && safeEqual(k, STORE_KEY)) return next();
  return res.status(401).json({ error: "No autorizado." });
}

// ---------------- SSE (eventos en vivo) ----------------
const sseClients = [];
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(payload);
    } catch (e) {
      sseClients.splice(i, 1);
    }
  }
}

app.get("/api/events", requireStore, (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
  sseClients.push(res);
  const heartbeat = setInterval(() => {
    try { res.write(`event: ping\ndata: {}\n\n`); } catch (e) { clearInterval(heartbeat); }
  }, 25000);
  req.on("close", () => {
    clearInterval(heartbeat);
    const i = sseClients.indexOf(res);
    if (i >= 0) sseClients.splice(i, 1);
  });
});

// ---------------- API: catálogo ----------------
app.get("/api/catalog", async (req, res) => {
  res.json(await db.getCatalog());
});

app.put("/api/catalog", requireStore, async (req, res) => {
  const cat = req.body;
  if (!cat || !Array.isArray(cat.departments)) {
    return res.status(400).json({ error: "Formato de catálogo inválido." });
  }
  await db.setCatalog(cat);
  broadcast("catalog-updated", { at: new Date().toISOString() });
  res.json({ ok: true });
});

// ---------------- API: pedidos ----------------
const VALID_STATUS = ["nuevo", "preparando", "listo", "entregado", "cancelado"];

function findItem(catalog, itemId) {
  for (const d of catalog.departments || []) {
    for (const c of d.categories || []) {
      for (const it of c.items || []) {
        if (it.id === itemId) return it;
      }
    }
  }
  return null;
}

// Público: los clientes crean pedidos sin clave.
app.post("/api/orders", async (req, res) => {
  const { type, items, customer, payment, notes } = req.body || {};

  if (type !== "delivery" && type !== "pickup") {
    return res.status(400).json({ error: "Tipo de pedido inválido." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "El pedido no tiene artículos." });
  }
  if (!customer || !String(customer.name || "").trim() || !String(customer.phone || "").trim()) {
    return res.status(400).json({ error: "Nombre y teléfono son obligatorios." });
  }
  if (type === "delivery" && !String(customer.address || "").trim()) {
    return res.status(400).json({ error: "La dirección es obligatoria para delivery." });
  }
  if (payment !== "cash" && payment !== "transfer") {
    return res.status(400).json({ error: "Método de pago inválido." });
  }

  // Resolver artículos contra el catálogo (precio al momento del pedido)
  const catalog = await db.getCatalog();
  const resolved = [];
  for (const line of items) {
    const item = findItem(catalog, line.itemId);
    if (!item || !item.active) {
      return res.status(400).json({ error: `Artículo no disponible: ${line.itemId}` });
    }
    const qty = Number(line.qty);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: "Cantidad inválida." });
    }
    resolved.push({
      itemId: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
      qty,
      note: String(line.note || "").slice(0, 200),
      subtotal: Math.round(item.price * qty * 100) / 100
    });
  }

  const number = await db.nextOrderNumber();
  const total = Math.round(resolved.reduce((s, l) => s + l.subtotal, 0) * 100) / 100;

  const order = await db.createOrder({
    number,
    type,
    items: resolved,
    customer: {
      name: String(customer.name).trim().slice(0, 80),
      phone: String(customer.phone).trim().slice(0, 30),
      address: String(customer.address || "").trim().slice(0, 200)
    },
    payment,
    notes: String(notes || "").slice(0, 500)
  });
  order.total = total;

  broadcast("new-order", order);
  res.status(201).json(order);
});

// Solo tienda:
// Limpieza total del historial (boton "Limpiar historial" en /tienda).
app.delete("/api/orders", requireStore, async (req, res) => {
  await db.deleteAllOrders();
  broadcast("orders-cleared", {});
  res.json({ ok: true });
});

app.get("/api/orders", requireStore, async (req, res) => {
  res.json(await db.listOrders());
});

app.patch("/api/orders/:id", requireStore, async (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUS.includes(status)) {
    return res.status(400).json({ error: "Estado inválido." });
  }
  const updated = await db.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: "Pedido no encontrado." });
  broadcast("order-status", updated);
  res.json(updated);
});

// ---------------- Páginas ----------------
app.use(express.static(path.join(__dirname, "public")));
app.get("/tienda", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "tienda.html"));
});

// ---------------- Arranque ----------------
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`[tastyroll] Servidor corriendo en http://localhost:${PORT}`);
    console.log(`[tastyroll] Clientes: http://localhost:${PORT}/`);
    console.log(`[tastyroll] Tienda:   http://localhost:${PORT}/tienda`);
  });
}).catch((err) => {
  console.error("[tastyroll] ❌ No se pudo inicializar la base de datos:", err.message);
  console.error("[tastyroll] Revisa DATABASE_URL (Postgres) o los permisos del archivo tasty-roll.db (SQLite).");
  process.exit(1);
});
