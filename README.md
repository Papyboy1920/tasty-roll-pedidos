# Tasty Roll — Pedidos 🌀💕

Sistema de pedidos para **Tasty Roll** (Plaza Andalucía II, Piantini, Santo Domingo, RD).
Los clientes piden rolls de canela y bebidas desde su teléfono,
y el pedido llega al instante a la pantalla de la tienda (`/tienda`).

## Cómo correrlo

```bash
cd ~/workspace/tasty-roll-pedidos
npm install
node server.js
```

- **App del cliente:** http://localhost:3000/
- **Pantalla de la tienda:** http://localhost:3000/tienda (pestañas: 📦 Pedidos, 📝 Catálogo, 📊 Historial)
- Puerto configurable: `PORT=8080 node server.js`

### Variables de entorno

| Variable | Efecto |
|---|---|
| `DATABASE_URL` | Si existe → usa **Postgres**. Si no → **SQLite local** (`tasty-roll.db`). |
| `STORE_KEY` | Clave compartida para `/tienda` y las APIs de tienda. Si no se define, modo desarrollo (abierto, con aviso en consola). |
| `PORT` | Puerto (default 3000). |

Ejemplo local con clave:

```bash
STORE_KEY=TASTYROLL-2026-PIANTINI node server.js
```

## Catálogo de arranque (precios reales del menú en tienda)

| Pestaña | Producto | Precio RD$ |
|---|---|---|
| 🌀 Rolls | Roll Clásico | 300 |
| 🌀 Rolls | Rolls Variados | 400 |
| 🌀 Rolls | Caja de 3 | 1190 |
| 🌀 Rolls | Caja de 6 | 2350 |
| 🥤 Bebidas | Pistacho Lovers | 390 |
| 🥤 Bebidas | Caramel Coffee | 290 |
| 🥤 Bebidas | Limonada Fresa | 290 |

Precios y productos se editan desde la pestaña 📝 Catálogo en `/tienda`.

## Despliegue en Render (demo)

`render.yaml` es un Blueprint listo: servicio web gratuito con **SQLite en disco
efímero** (SOLO para demo/arranque — la base puede reiniciarse en redespliegues).
Para un lanzamiento real con datos duraderos, conectar Postgres pago y definir
`DATABASE_URL` + `STORE_KEY` en el Environment del dashboard.

Pasos en el dashboard de Render (los hace Portal):
1. **New → Blueprint**, conectar el repo `tasty-roll-pedidos`, aplicar.
2. Esperar el deploy; el Blueprint genera `STORE_KEY` automáticamente.
3. Copiar el valor de `STORE_KEY` desde **Environment** y pegarlo en la pantalla
   `/tienda` del sitio ya desplegado para desbloquearla.
