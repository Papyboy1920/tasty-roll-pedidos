// ============================================================
// CATÁLOGO SEMILLA — Tasty Roll
// Precios REALES del menú en tienda (RD$), tomados del
// pizarrón del local en Plaza Andalucía II, Piantini.
// Se ajustan desde la pestaña Catálogo de /tienda.
// ============================================================

const CATALOG_VERSION = 1;

const SEED_CATALOG = {
  version: CATALOG_VERSION,
  departments: [
    {
      id: "rolls",
      name: "Rolls",
      icon: "🌀",
      categories: [
        {
          id: "rolls-todos",
          name: "Rolls de canela",
          items: [
            { id: "roll-clasico", name: "Roll Clásico", price: 300, unit: "roll", active: true, image: "roll-clasico.jpg", desc: "Nuestro roll de canela clásico: esponjoso, tibio y con glaseado de vainilla. Amor a primera mordida." },
            { id: "rolls-variados", name: "Rolls Variados", price: 400, unit: "roll", active: true, image: "rolls-variados.jpg", desc: "Nuestro roll con los toppings más pedidos: Pistacho, Chocolate, Fresa, Caramelo y más. Pregunta por los sabores de hoy." },
            { id: "caja-3", name: "Caja de 3", price: 1190, unit: "caja", active: true, image: "caja-3.jpg", desc: "Caja surtida con 3 rolls variados en nuestra cajita rosada. Perfecta para regalar… o no compartir." },
            { id: "caja-6", name: "Caja de 6", price: 2350, unit: "caja", active: true, image: "caja-6.jpg", desc: "Caja surtida con 6 rolls variados en nuestra cajita rosada. Ideal para la familia o la oficina." }
          ]
        }
      ]
    },
    {
      id: "bebidas",
      name: "Bebidas",
      icon: "🥤",
      categories: [
        {
          id: "bebidas-todas",
          name: "Bebidas",
          items: [
            { id: "pistacho-lovers", name: "Pistacho Lovers", price: 390, unit: "vaso", active: true, image: "pistacho-lovers.jpg", desc: "Bebida cremosa de pistacho con crema batida: la favorita de la casa." },
            { id: "caramel-coffee", name: "Caramel Coffee", price: 290, unit: "vaso", active: true, image: "caramel-coffee.jpg", desc: "Café frío con caramelo: el compañero perfecto de tu roll." },
            { id: "limonada-fresa", name: "Limonada Fresa", price: 290, unit: "vaso", active: true, image: "limonada-fresa.jpg", desc: "Limonada fresca con fresa natural, bien fría." }
          ]
        }
      ]
    }
  ]
};

module.exports = { SEED_CATALOG, CATALOG_VERSION };
