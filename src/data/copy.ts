/**
 * Todo el copy visible del sitio (español rioplatense). El código va en inglés;
 * esto es lo único que ve el usuario. Centralizado para A/B testing.
 */

export const SITE = {
  name: '¿Qué Notebook Comprar?',
  domain: 'quenotebookcomprar.com',
  description:
    'Encontrá la notebook ideal en Mercado Libre Argentina. Respondé un quiz corto o filtrá por specs y te recomendamos modelos concretos con precio y stock en vivo.',
  ogImage: '/og-image.png',
} as const;

/**
 * CTA único hacia el quiz. El MISMO texto en header, home, blog y footer:
 * un solo mensaje = menos fricción y ningún usuario confundido entre
 * "test", "quiz" y "encontrar equipo".
 */
export const CTA_QUIZ = { label: 'Encontrar mi notebook', href: '/quiz' } as const;

export const HOME = {
  hero: {
    badge: 'Comparador de notebooks · Argentina',
    title: '¿Qué notebook comprar?',
    subtitle: 'Decinos para qué la querés y te recomendamos modelos concretos de Mercado Libre, con precio y stock en vivo. Sin vueltas, sin chamuyo.',
    ctaPrimary: { label: '🚀 Ayudame a elegir', href: '/quiz?modo=guiado' },
    ctaSecondary: { label: 'Sé lo que busco', href: '/quiz?modo=tecnico' },
  },
  valueProps: [
    { icon: '⚡', text: 'Precio y stock en vivo' },
    { icon: '🔎', text: 'Comparamos por specs reales' },
    { icon: '🇦🇷', text: 'Solo con envío local' },
  ],
  quickPicks: {
    title: '¿Para qué la necesitás?',
    subtitle: 'Tocá una y te muestro las mejores opciones al toque.',
  },
  branchQuestion: '¿Cuánto sabés de notebooks?',
  branchA: { label: 'Sé lo que busco', desc: 'Filtrá vos por RAM, procesador, SSD, pantalla y placa de video.', href: '/quiz?modo=tecnico' },
  branchB: { label: 'No tengo idea, ayudame', desc: 'Contanos para qué la querés y traducimos todo a specs.', href: '/quiz?modo=guiado' },
  how: {
    title: '¿Cómo funciona?',
    steps: [
      { icon: '📝', label: 'Respondé el quiz', desc: 'Dos caminos: técnico o en criollo. Los dos llegan al mismo lugar.' },
      { icon: '⚡', label: 'Filtramos en vivo', desc: 'Traemos precio, stock y specs reales de Mercado Libre en el momento.' },
      { icon: '🛒', label: 'Comprás en ML', desc: 'Click directo al producto. Precio real, vendedor real, stock real.' },
    ],
  },
  featuredTitle: 'Notebooks destacadas',
} as const;

/** Atajos del home → resultados ya filtrados (deep-link al motor). */
export const QUICK_PICKS = [
  { key: 'gaming', emoji: '🎮', label: 'Gaming', hint: 'Con placa dedicada, desde $1M' },
  { key: 'estudio', emoji: '📚', label: 'Estudio / Oficina', hint: '8GB+, SSD, liviana' },
  { key: 'diseno', emoji: '🎨', label: 'Diseño / Edición', hint: 'i7+, 16GB, GPU' },
  { key: 'programacion', emoji: '💻', label: 'Programación', hint: '16GB, SSD 512+' },
  { key: 'basico', emoji: '🌐', label: 'Uso básico', hint: 'Navegar, Netflix, barata' },
  { key: 'premium', emoji: '💎', label: 'Alta gama', hint: 'Lo más potente' },
] as const;

export const BRANCH_LABELS = { A: 'Sé lo que busco', B: 'No tengo idea' } as const;

/** Branch A — preguntas técnicas. Los `valor` deben coincidir con src/shared/quiz-map.mjs. */
export const QUIZ_A = {
  branch: 'A' as const,
  intro: 'Sé lo que busco',
  steps: [
    {
      id: 'presupuesto',
      pregunta: '¿Cuánto querés gastar?',
      opciones: [
        { valor: 'hasta_400k', label: '🪙 Hasta $400.000' },
        { valor: '400k_700k', label: '💵 $400.000 – $700.000' },
        { valor: '700k_1200k', label: '💰 $700.000 – $1.200.000' },
        { valor: '1200k_2000k', label: '💎 $1.200.000 – $2.000.000' },
        { valor: 'mas_2000k', label: '🤑 Más de $2.000.000' },
      ],
    },
    {
      id: 'ram',
      pregunta: '¿Cuánta memoria RAM?',
      opciones: [
        { valor: '8', label: '8 GB — uso normal' },
        { valor: '16', label: '16 GB — multitarea cómoda' },
        { valor: '32', label: '32 GB o más — bestia' },
      ],
    },
    {
      id: 'procesador',
      pregunta: '¿Qué procesador?',
      opciones: [
        { valor: 'i3', label: 'i3 / Ryzen 3 — básico' },
        { valor: 'i5', label: 'i5 / Ryzen 5 — equilibrado' },
        { valor: 'i7', label: 'i7 / Ryzen 7 — potente' },
        { valor: 'i9', label: 'i9 / Ryzen 9 — tope de gama' },
      ],
    },
    {
      id: 'almacenamiento',
      pregunta: '¿Cuánto almacenamiento SSD?',
      opciones: [
        { valor: '256', label: '256 GB' },
        { valor: '512', label: '512 GB' },
        { valor: '1024', label: '1 TB o más' },
      ],
    },
    {
      id: 'pantalla',
      pregunta: '¿Qué tamaño de pantalla?',
      opciones: [
        { valor: '13_14', label: '13–14" — portátil' },
        { valor: '15_16', label: '15–16" — estándar' },
        { valor: '17', label: '17"+ — pantallón' },
      ],
    },
    {
      id: 'gpu',
      pregunta: '¿Placa de video dedicada?',
      opciones: [
        { valor: 'si', label: '🎮 Sí, la necesito' },
        { valor: 'no', label: 'No hace falta' },
        { valor: 'igual', label: 'Me da igual' },
      ],
    },
  ],
} as const;

/** Branch B — preguntas en criollo. Se traducen a las mismas specs (§9). */
export const QUIZ_B = {
  branch: 'B' as const,
  intro: 'No tengo idea, ayudame',
  steps: [
    {
      id: 'uso',
      pregunta: '¿Para qué la vas a usar?',
      opciones: [
        { valor: 'estudio', label: '📚 Estudio / oficina' },
        { valor: 'diseno', label: '🎨 Diseño o edición de video' },
        { valor: 'gaming', label: '🎮 Gaming' },
        { valor: 'programacion', label: '💻 Programación' },
        { valor: 'basico', label: '🌐 Uso básico (navegar, Netflix)' },
      ],
    },
    {
      id: 'movilidad',
      pregunta: '¿La movés mucho?',
      opciones: [
        { valor: 'viaja', label: '🎒 La llevo a todos lados' },
        { valor: 'casa', label: '🏠 Queda en casa' },
        { valor: 'igual', label: '🤷 Me da igual' },
      ],
    },
    {
      id: 'potencia',
      pregunta: '¿Querés que vuele o algo que cumpla?',
      opciones: [
        { valor: 'vuele', label: '🚀 Que vuele' },
        { valor: 'equilibrado', label: '⚖️ Equilibrado' },
        { valor: 'economico', label: '💸 Lo más económico que ande' },
      ],
    },
    {
      id: 'juegos',
      pregunta: '¿Vas a jugar?',
      opciones: [
        { valor: 'pesados', label: '🔥 Sí, juegos pesados' },
        { valor: 'livianos', label: '🕹️ Algún juego liviano' },
        { valor: 'no', label: '🚫 No' },
      ],
    },
    {
      id: 'presupuesto',
      pregunta: '¿Cuánto querés gastar?',
      opciones: [
        { valor: 'hasta_400k', label: '🪙 Hasta $400.000' },
        { valor: '400k_700k', label: '💵 $400.000 – $700.000' },
        { valor: '700k_1200k', label: '💰 $700.000 – $1.200.000' },
        { valor: '1200k_2000k', label: '💎 $1.200.000 – $2.000.000' },
        { valor: 'mas_2000k', label: '🤑 Más de $2.000.000' },
      ],
    },
  ],
} as const;

export const QUIZ_UI = {
  cta_siguiente: 'Siguiente',
  cta_anterior: 'Atrás',
  cta_ver: 'Ver mis notebooks',
  barra_label: (paso: number, total: number) => `Paso ${paso} de ${total}`,
} as const;

export const PRODUCTO = {
  cta_comprar: 'Ver en Mercado Libre',
  precio_desde: 'desde',
  precio_ref: 'precio de referencia',
  precio_nota: 'Precio de referencia (oferta más barata) — puede variar en Mercado Libre.',
  sin_precio: 'Ver precio en ML',
  sin_stock: 'Sin stock',
  disclosure: 'Link de afiliado — si comprás, me llevo una comisión sin costo extra para vos.',
} as const;

/**
 * Preguntas frecuentes (home + JSON-LD FAQPage para rich snippets).
 * Respuestas editables — cambialas cuando quieras; ya indexan como están.
 */
export const FAQ = [
  {
    q: '¿Cómo seleccionamos las notebooks?',
    a: 'Analizamos las notebooks con oferta y stock real en Mercado Libre Argentina y las ordenamos por specs y relación precio-calidad (RAM, procesador, SSD, placa de video y precio). No hay ranking pago: el orden sale de los datos.',
  },
  {
    q: '¿Los precios se actualizan automáticamente?',
    a: 'Sí. Refrescamos el catálogo de forma automática varias veces al día y, cuando mostramos un equipo, verificamos su precio y stock en vivo. De todas formas son precios de referencia: el valor final lo confirmás en Mercado Libre.',
  },
  {
    q: '¿Qué notebook necesito para estudiar?',
    a: 'Para estudiar y oficina, con 8 GB de RAM, un SSD y un procesador tipo i5/Ryzen 5 alcanza de sobra. Si programás o editás, conviene 16 GB. Hacé el test y te recomendamos modelos concretos según tu uso y presupuesto.',
  },
  {
    q: '¿Cuánta memoria RAM debería tener?',
    a: '8 GB es el mínimo para uso general y estudio; 16 GB es el punto ideal para multitarea, programación y diseño; 32 GB o más solo si trabajás con video 4K, 3D o varias máquinas virtuales.',
  },
  {
    q: '¿Puedo comparar modelos de distintas marcas?',
    a: 'Sí. Elegís 2 modelos de cualquier marca y los comparás lado a lado: specs, precio y un veredicto por tipo de uso. Entrá a "Comparar", buscá los modelos en nuestra base y listo.',
  },
  {
    q: '¿La página vende directamente las notebooks?',
    a: 'No. Somos un comparador independiente: no vendemos ni tenemos stock. Te ayudamos a elegir y te llevamos al producto en Mercado Libre con un enlace de afiliado (si comprás, ganamos una comisión sin costo extra para vos).',
  },
] as const;

export const RESULT = {
  title: 'Tus notebooks',
  subtitle: 'Las que mejor matchean lo que buscás. Precio y stock en vivo.',
  relaxed: 'No había match exacto, así que aflojamos algunos filtros. Igual están buenas.',
  empty_no_creds: 'Todavía no hay catálogo cargado. Configurá las credenciales y corré el job de minteo (ver README).',
  empty_no_match: 'No encontramos notebooks con esos filtros ahora mismo. Probá aflojar algún requisito.',
  cta_again: 'Cambiar mis respuestas',
} as const;

export const FOOTER = {
  disclosure:
    'Los links de compra de este sitio son de afiliado de Mercado Libre. Si comprás a través de ellos, recibo una pequeña comisión sin costo extra para vos. Los precios son de referencia y pueden variar.',
  links: [
    { label: 'Inicio', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Comparar notebooks', href: '/comparar' },
    { label: 'Encontrar mi notebook', href: '/quiz' },
  ],
  legal: [
    { label: 'Términos y privacidad', href: '/terminos' },
  ],
} as const;

/**
 * Datos legales centralizados. Cambiá el email / titular acá y se actualiza en
 * la página legal combinada (/terminos).
 */
export const LEGAL = {
  contactEmail: 'contacto@quenotebookcomprar.com',
  // Titular del sitio. Reemplazá por tu nombre o razón social real.
  owner: '¿Qué Notebook Comprar?',
  jurisdiction: 'la República Argentina',
  lastUpdated: '25 de junio de 2026',
} as const;

export const NOT_FOUND = {
  titulo: 'Esta página no existe',
  mensaje: 'Pero seguro hay una notebook esperándote. Arrancá de nuevo.',
  cta: 'Volver al inicio',
} as const;
