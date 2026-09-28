// ============================================================
// CATÁLOGO SEMILLA — Tasty Roll
// v2 (2026-09-27): menú ampliado con los diseños de Portal —
// fotos extraídas de sus flyers, precios y nombres según sus
// diseños ("úsalo todo"). Ajustable en /tienda → Catálogo.
// ============================================================

const CATALOG_VERSION = 3;

const SEED_CATALOG = {
  version: CATALOG_VERSION,
  departments: [
    {
      id: "rolls",
      name: "Rolls",
      icon: "🌹",
      categories: [
        {
          id: "rolls-todos",
          name: "Rolls de canela",
          items: [
            { id: "roll-clasico", name: "Cinnamon Roll Clásico", price: 320, unit: "roll", active: true, image: "roll-clasico.jpg", desc: "Nuestro roll de canela clásico: esponjoso, tibio y con glaseado de queso crema. La tradición que nunca falla." },
            { id: "roll-fresa-nutella", name: "Fresa Nutella Cinnamon Roll", price: 440, unit: "roll", active: true, image: "roll-fresa-nutella.jpg", badge: "Más vendido", desc: "Nutella, fresas frescas y crema batida: la combinación que nunca falla." },
            { id: "roll-dulce-leche", name: "Dulce de leche y fresas", price: 440, unit: "roll", active: true, image: "roll-dulce-leche.jpg", desc: "Dulce de leche cremoso coronado con fresas frescas." },
            { id: "roll-pistacho", name: "Pistacho Cinnamon Roll", price: 345, unit: "roll", active: true, image: "roll-pistacho.jpg", badge: "22% DTO", desc: "Nuestro roll bañado en crema de pistacho con crocante de pistacho por encima. El favorito de los que saben." },
            { id: "roll-ferrero", name: "Ferrero Rocher", price: 440, unit: "roll", active: true, image: "roll-ferrero.jpg", desc: "Roll con chocolate, avellanas crocantes y un Ferrero Rocher coronándolo. Puro exceso." },
            { id: "roll-biscoff", name: "Biscoff Cinnamon Roll", price: 440, unit: "roll", active: true, image: "roll-biscoff.jpg", desc: "Con galleta Lotus Biscoff, caramelo y crumble crujiente: adictivo." },
            { id: "roll-fresa-crema", name: "Fresa con Crema", price: 360, unit: "roll", active: true, image: "roll-fresa-crema.jpg", badge: "20% DTO", desc: "Fresas frescas con chocolate y crema." },
            { id: "roll-dubai", name: "Dubai roll", price: 440, unit: "roll", active: true, image: "roll-dubai.jpg", desc: "Crema de pistacho con hilos de chocolate, estilo Dubai." },
            { id: "roll-apple-pie", name: "Apple pie cinnamon roll", price: 440, unit: "roll", active: true, image: "roll-apple-pie.jpg", desc: "Relleno de manzana caramelizada estilo apple pie con glaseado." },
            { id: "roll-kinder", name: "Kinder bueno cinnamon roll", price: 440, unit: "roll", active: true, image: "roll-kinder.jpg", desc: "Chocolate con leche, avellanas y barrita Kinder: para los dulceros de verdad." },
            { id: "roll-guava", name: "Guava cinnamon roll", price: 440, unit: "roll", active: true, image: "roll-guava.jpg", desc: "Dulce de guayaba con glaseado de queso crema: sabor tropical." },
            { id: "roll-blueberry", name: "Blueberry lemon", price: 440, unit: "roll", active: true, image: "roll-blueberry.jpg", desc: "Arándanos frescos con toque de limón y glaseado." },
            { id: "rolls-variados", name: "Rolls Variados", price: 400, unit: "roll", active: true, image: "rolls-variados.jpg", desc: "Nuestro roll con los toppings más pedidos: Pistacho, Chocolate, Fresa, Caramelo y más. Pregunta por los sabores de hoy." },
            { id: "caja-3", name: "Caja de 3 Rolls Variados", price: 1290, unit: "caja", active: true, image: "caja-3.jpg", badge: "Popular", desc: "3 Cinnamon Rolls con el sabor y topping de tu preferencia, en nuestra cajita rosada." },
            { id: "caja-6", name: "Caja de 6 Rolls Variados", price: 2490, unit: "caja", active: true, image: "caja-6.jpg", badge: "25% DTO", desc: "6 cinnamon rolls rellenos con el sabor y topping de tu preferencia. Ideal para la familia o la oficina." }
          ]
        }
      ]
    },
    {
      id: "mas-vendidos",
      name: "Más vendidos",
      icon: "⭐",
      categories: [
        {
          id: "favoritos",
          name: "Los favoritos",
          items: [
            { id: "roll-fresa-nutella", name: "Fresa Nutella Cinnamon Roll", price: 440, unit: "roll", active: true, image: "roll-fresa-nutella.jpg", badge: "Más vendido", desc: "Nutella, fresas frescas y crema batida: la combinación que nunca falla." },
            { id: "roll-pistacho", name: "Pistacho Cinnamon Roll", price: 345, unit: "roll", active: true, image: "roll-pistacho.jpg", badge: "22% DTO", desc: "Nuestro roll bañado en crema de pistacho con crocante de pistacho por encima. El favorito de los que saben." },
            { id: "roll-dulce-leche", name: "Dulce de leche y fresas", price: 440, unit: "roll", active: true, image: "roll-dulce-leche.jpg", desc: "Dulce de leche cremoso coronado con fresas frescas." },
            { id: "roll-clasico", name: "Cinnamon Roll Clásico", price: 320, unit: "roll", active: true, image: "roll-clasico.jpg", desc: "Nuestro roll de canela clásico: esponjoso, tibio y con glaseado de queso crema. La tradición que nunca falla." },
            { id: "caja-3", name: "Caja de 3 Rolls Variados", price: 1290, unit: "caja", active: true, image: "caja-3.jpg", badge: "Popular", desc: "3 Cinnamon Rolls con el sabor y topping de tu preferencia, en nuestra cajita rosada." },
            { id: "caja-6", name: "Caja de 6 Rolls Variados", price: 2490, unit: "caja", active: true, image: "caja-6.jpg", badge: "25% DTO", desc: "6 cinnamon rolls rellenos con el sabor y topping de tu preferencia. Ideal para la familia o la oficina." }
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
