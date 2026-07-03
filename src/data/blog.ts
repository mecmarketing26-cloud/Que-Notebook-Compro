/**
 * Blog/SEO topics. Each is a keyword-rich listicle ("Las mejores notebooks para
 * X") whose ranking is computed LIVE from the same engine + index, so it's always
 * fresh, with real prices/discounts and affiliate links. Add topics freely.
 *
 * Cada tema lleva además contenido editorial PROPIO (guide + faq): texto único
 * que es lo que realmente posiciona en Google. El ranking aporta frescura y
 * precios; la guía aporta las 300-500 palabras únicas que un listado solo de
 * cards no tiene.
 */
import type { NotebookFilters, NotebookProduct } from '../lib/types';

/** Sección editorial del artículo (H2 + párrafos). */
export interface BlogSection {
  h2: string;
  paragraphs: string[];
}

/** Pregunta frecuente del artículo (render + JSON-LD FAQPage). */
export interface BlogFaqItem {
  q: string;
  a: string;
}

export interface BlogTopic {
  slug: string;
  title: string; // <title> / SEO
  h1: string;
  description: string; // meta description
  intro: string; // opening paragraph (keyword-rich)
  /** Fecha REAL de publicación (fija). Nunca usar `new Date()`: Google ignora fechas que cambian en cada visita. */
  datePublished: string;
  filters: NotebookFilters;
  max?: number;
  /** Optional extra predicate (brand/keyword) applied to candidates. */
  match?: (p: NotebookProduct) => boolean;
  keywords?: string[];
  /** Guía de compra editorial (contenido único del artículo). */
  guide?: BlogSection[];
  /** FAQ del tema (acordeón + rich snippet FAQPage). */
  faq?: BlogFaqItem[];
}

const hasApple = (p: NotebookProduct) => /apple|macbook/i.test(p.title) || /apple/i.test(p.specs.brand ?? '');
const isChromebook = (p: NotebookProduct) => /chromebook/i.test(p.title) || /chrome/i.test(p.specs.os ?? '');
const hasBrand = (re: RegExp) => (p: NotebookProduct) => re.test(p.title) || re.test(p.specs.brand ?? '');

export const BLOG_TOPICS: BlogTopic[] = [
  {
    slug: 'mejores-notebooks-gamer',
    title: 'Las mejores notebooks gamer 2026 en Argentina (con placa dedicada)',
    h1: 'Las mejores notebooks gamer 2026',
    description: 'Ranking de las mejores notebooks gamer en Mercado Libre Argentina: placa de video dedicada, 16GB+ y buen procesador, con precio actualizado.',
    intro: 'Si buscás una notebook para jugar, lo que más importa es la placa de video dedicada, 16 GB de RAM o más y un buen procesador. Armamos este ranking en vivo con las mejores notebooks gamer disponibles en Mercado Libre Argentina, ordenadas de mejor a peor y con el precio más barato de cada modelo.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 16, gpuDedicated: 'required', processorMinTier: 5, priceMin: 1_000_000 },
    keywords: ['notebook gamer', 'notebook para jugar', 'mejor notebook gamer 2026'],
    guide: [
      {
        h2: 'Qué mirar en una notebook gamer',
        paragraphs: [
          'La placa de video dedicada es el componente que define cuánto y cómo vas a poder jugar: una RTX 4050 o RTX 4060 con 6-8 GB de VRAM es hoy el punto dulce para jugar en 1080p con detalles altos. El procesador acompaña: apuntá a un Intel Core i5 HX / i7 H o un Ryzen 5/7 de las últimas generaciones, que no le hagan cuello de botella a la GPU.',
          'La RAM mínima real para gaming en 2026 es 16 GB: con 8 GB los títulos actuales tironean incluso en calidad media. Y no subestimes la pantalla: un panel de 144 Hz se nota muchísimo más que pasar de 100 a 120 FPS, sobre todo en shooters. SSD de 512 GB como piso, porque los juegos AAA pesan entre 60 y 150 GB cada uno.',
        ],
      },
      {
        h2: 'Los errores más comunes al comprar una gamer',
        paragraphs: [
          'El clásico: comprar una notebook "gamer" por el diseño con luces RGB pero con gráficos integrados. Si no dice explícitamente RTX, GTX o Radeon RX en la ficha, no es una notebook para jugar títulos pesados. Otro error frecuente es priorizar un i9 con una GPU chica: en juegos, casi siempre conviene invertir esa diferencia en una mejor placa de video.',
          'También revisá el refresco de pantalla (60 Hz en una gamer es un desperdicio de GPU) y desconfiá de equipos muy finitos con GPU potente: sin buena refrigeración, la placa baja su rendimiento por temperatura (thermal throttling) a los 20 minutos de juego.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuánta VRAM necesito para jugar en 2026?',
        a: 'Para 1080p, 6 GB de VRAM es el mínimo cómodo y 8 GB lo ideal (RTX 4060 o superior). Con menos de 6 GB vas a tener que bajar texturas en los títulos más nuevos.',
      },
      {
        q: '¿Se puede jugar en una notebook sin placa dedicada?',
        a: 'Títulos livianos y esports (LoL, CS2, Valorant, Fortnite en bajo) corren aceptablemente en gráficos integrados modernos como Radeon 780M o Intel Arc. Para AAA (Cyberpunk, Elden Ring, GTA) necesitás sí o sí una GPU dedicada.',
      },
      {
        q: '¿Qué conviene más: mejor GPU o más RAM?',
        a: 'Mejor GPU. La RAM casi siempre se puede ampliar después por relativamente poca plata; la placa de video de una notebook no se cambia nunca. Partí de 16 GB y priorizá el mejor chip gráfico que entre en tu presupuesto.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-para-estudiar',
    title: 'Las mejores notebooks para estudiar y oficina 2026',
    h1: 'Mejores notebooks para estudiar y oficina',
    description: 'Las mejores notebooks para estudiar, facultad y oficina: livianas, con SSD y buena autonomía, al mejor precio en Mercado Libre Argentina.',
    intro: 'Para estudiar y trabajar en la oficina no necesitás la notebook más cara: con 8 GB de RAM, SSD y un procesador decente alcanza y sobra. Estas son las mejores opciones para estudio y oficina, elegidas en vivo por precio y specs.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 8, storageMinGb: 256, priceMin: 450_000, sort: 'price_asc' },
    keywords: ['notebook para estudiar', 'notebook para la facultad', 'notebook oficina'],
    guide: [
      {
        h2: 'Qué necesita de verdad una notebook para estudiar',
        paragraphs: [
          'Tres cosas no negociables: 8 GB de RAM (para tener el navegador con muchas pestañas, Word y Zoom abiertos a la vez), disco SSD (que la máquina prenda en segundos y no en minutos) y un procesador al menos nivel Intel Core i3 de generación reciente o Ryzen 3. Con eso, todo lo que es apuntes, campus virtual, videollamadas y Office vuela.',
          'Después vienen las comodidades que hacen la diferencia en el día a día: que pese menos de 1,8 kg si la llevás a cursar, una batería que aguante una jornada de clases (6+ horas reales) y una pantalla Full HD, porque las HD (1366x768) que todavía se venden se ven notablemente peor para leer texto.',
        ],
      },
      {
        h2: 'En qué NO conviene gastar de más',
        paragraphs: [
          'Para estudiar no hace falta placa de video dedicada (salvo carreras de diseño o arquitectura), ni 32 GB de RAM, ni un i7. Esa plata rinde más en un mejor SSD, más batería o directamente en tu bolsillo. Un i5/Ryzen 5 con 8 GB es el techo razonable para uso académico general; más que eso es pagar por rendimiento que no vas a usar.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Alcanza con 8 GB de RAM para la facultad?',
        a: 'Sí, para el 90% de las carreras: navegador, PDF, Office, campus virtual y videollamadas funcionan perfecto. Si tu carrera usa software pesado (AutoCAD, Matlab, máquinas virtuales), andá a 16 GB.',
      },
      {
        q: '¿Sirven las notebooks con Celeron o 4 GB de RAM?',
        a: 'Las evitamos en este ranking: un Celeron con 4 GB se arrastra hasta con muchas pestañas de Chrome. La diferencia de precio contra un equipo con 8 GB y SSD es chica y el salto de experiencia, enorme.',
      },
      {
        q: '¿Cuánto hay que gastar en una notebook para estudiar en Argentina?',
        a: 'El rango con mejor relación precio-experiencia suele estar entre $600.000 y $900.000: ahí ya conseguís 8 GB, SSD de 256/512 GB y pantalla Full HD de marcas conocidas. El ranking de arriba se actualiza con lo mejor disponible en cada rango.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-para-programar',
    title: 'Las mejores notebooks para programar 2026',
    h1: 'Mejores notebooks para programar',
    description: 'Las mejores notebooks para programación: 16GB de RAM, SSD rápido y buen procesador para compilar y correr todo sin trabarse.',
    intro: 'Programar pide RAM (16 GB como piso), un SSD rápido y un procesador que aguante compilar y correr varios entornos a la vez. Estas son las mejores notebooks para programadores disponibles ahora.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 16, storageMinGb: 512, processorMinTier: 5, priceMin: 800_000 },
    keywords: ['notebook para programar', 'notebook para programación', 'notebook desarrollo'],
    guide: [
      {
        h2: 'Las specs mínimas para programar cómodo',
        paragraphs: [
          'La RAM es el recurso que más rápido se agota programando: el editor (VS Code come lo suyo), el navegador con documentación, Docker, la base de datos local y el servidor de desarrollo corriendo a la vez superan los 8 GB sin esfuerzo. Por eso el piso serio es 16 GB. El SSD importa tanto como la RAM: uno NVMe de 512 GB hace que instalar dependencias, indexar proyectos y compilar sea otra vida.',
          'En procesador, un i5/Ryzen 5 moderno con 8+ núcleos compila la mayoría de los proyectos sin drama. Subí a i7/Ryzen 7 si trabajás con proyectos grandes, Android Studio o varias máquinas virtuales: los núcleos extra ahí sí se sienten.',
        ],
      },
      {
        h2: '¿Importa la placa de video para programar?',
        paragraphs: [
          'Para desarrollo web, backend, móvil o data engineering: no, los gráficos integrados sobran. Solo necesitás GPU dedicada si trabajás en machine learning con entrenamiento local (ahí buscá NVIDIA con 8+ GB de VRAM por CUDA) o en desarrollo de videojuegos. Si no es tu caso, invertí esa diferencia en 32 GB de RAM o un mejor SSD.',
          'Un extra subestimado: la pantalla. Vas a leer código 8 horas por día, así que Full HD es el mínimo y un panel de 15,6" o más con buen brillo te cuida la vista. Y si podés, probá el teclado antes: es tu herramienta principal.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Se puede programar con 8 GB de RAM?',
        a: 'Se puede, pero incómodo: con Docker, el IDE y el navegador abiertos vas a estar al límite y el sistema empieza a swapear. 16 GB es el estándar cómodo en 2026; 32 GB si usás muchas VMs o contenedores pesados.',
      },
      {
        q: '¿Mejor Windows, Linux o Mac para programar?',
        a: 'Los tres sirven. Windows con WSL2 te da un Linux completo adentro; cualquier notebook de este ranking lo corre bien. Si tu stack es iOS/macOS necesitás una Mac sí o sí. Linux nativo corre perfecto en la mayoría de estos modelos.',
      },
      {
        q: '¿Cuánto almacenamiento necesito para desarrollo?',
        a: '512 GB es el piso cómodo: entre node_modules, imágenes de Docker, SDKs y un par de proyectos grandes, 256 GB se llenan en meses. 1 TB si trabajás con varios entornos o datasets.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-para-diseno-y-edicion',
    title: 'Las mejores notebooks para diseño y edición de video 2026',
    h1: 'Mejores notebooks para diseño y edición de video',
    description: 'Notebooks potentes para diseño gráfico, edición de video y 3D: procesador i7/Ryzen 7, 16GB+ y placa de video.',
    intro: 'El diseño y la edición de video piden potencia: procesador i7/Ryzen 7 o superior, 16 GB de RAM como mínimo y, ojalá, placa de video dedicada. Acá están las mejores para creativos.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, gpuDedicated: 'preferred', priceMin: 1_200_000 },
    keywords: ['notebook para diseño', 'notebook edición de video', 'notebook para 3D'],
    guide: [
      {
        h2: 'CPU, RAM y GPU: qué pesa en cada programa',
        paragraphs: [
          'Photoshop e Illustrator dependen sobre todo del procesador y la RAM: un i7/Ryzen 7 con 16 GB los mueve con soltura. Premiere, DaVinci Resolve y After Effects son otra historia: ahí la placa de video dedicada acelera los efectos, la reproducción en el timeline y sobre todo la exportación — una RTX puede exportar en la mitad del tiempo que los gráficos integrados.',
          'Para 3D (Blender, 3ds Max, Cinema 4D) la GPU pasa de recomendable a obligatoria: los renders con NVIDIA (CUDA/OptiX) son varias veces más rápidos. Y si editás video 4K, considerá 32 GB de RAM: con 16 GB Premiere funciona, pero con proyectos largos y muchas capas empieza a tironear.',
        ],
      },
      {
        h2: 'La pantalla: el factor que los rankings ignoran',
        paragraphs: [
          'De poco sirve la potencia si el color que ves no es el que exportás. Buscá pantallas IPS con al menos 100% sRGB (las fichas a veces lo listan como "45% NTSC" — eso es bajo para diseño). Resolución: Full HD es el piso; si el presupuesto da, un panel 2K/2.8K en 15-16 pulgadas hace la diferencia trabajando con tipografía y detalle fino.',
        ],
      },
    ],
    faq: [
      {
        q: '¿16 o 32 GB de RAM para editar video?',
        a: 'Para Full HD, 16 GB alcanzan bien. Para 4K, multicámara o motion graphics pesado, 32 GB se notan mucho: menos renders de previsualización y timeline más fluido.',
      },
      {
        q: '¿Puedo diseñar con gráficos integrados?',
        a: 'Para Photoshop, Illustrator, Figma y Canva sí, con un buen procesador y 16 GB de RAM. Para edición de video seria o 3D, la GPU dedicada deja de ser opcional: acelera renders y exportación de forma drástica.',
      },
      {
        q: '¿Qué procesador conviene para Premiere y DaVinci?',
        a: 'Un i7/Ryzen 7 moderno de la serie H (alto rendimiento) como mínimo. Los códecs actuales aprovechan muchos núcleos, y la aceleración por hardware de Intel Quick Sync o las RTX ayudan muchísimo en la exportación.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-baratas',
    title: 'Las mejores notebooks baratas 2026 (buenas y económicas)',
    h1: 'Las mejores notebooks baratas',
    description: 'Notebooks baratas que valen la pena: las opciones más económicas con buen rendimiento para uso diario, al mejor precio.',
    intro: 'Si el presupuesto manda, estas son las notebooks más económicas que igual cumplen para navegar, estudiar y el día a día. Ordenadas de menor a mayor precio.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 8, sort: 'price_asc' },
    keywords: ['notebook barata', 'notebook económica', 'notebook precio bajo'],
    guide: [
      {
        h2: 'Cómo detectar una barata que vale la pena',
        paragraphs: [
          'La regla de oro en gama baja: SSD y 8 GB de RAM, innegociables. Una notebook barata con disco mecánico o 4 GB de RAM se siente lenta desde el primer día, y esa diferencia de precio suele ser mínima. Con SSD + 8 GB, hasta un procesador modesto se siente ágil para navegar, Office y videollamadas — por eso este ranking filtra todo lo que no cumpla ese piso.',
          'El segundo filtro es el procesador: un Intel N100/N200, i3 o Ryzen 3 de generaciones recientes rinden sorprendentemente bien; un Celeron viejo o un AMD serie E, no. Si el modelo tiene más de 4 años de antigüedad de lanzamiento, sospechá.',
        ],
      },
      {
        h2: 'Las trampas típicas de la gama económica',
        paragraphs: [
          'Pantallas HD (1366x768) con panel TN: se ven lavadas y con ángulos de visión malos — buscá Full HD IPS incluso en gama baja, que ya existe a estos precios. Almacenamiento eMMC de 64/128 GB: es lento y se llena con dos actualizaciones de Windows; 256 GB SSD es el mínimo útil. Y ojo con las "ofertas" de modelos discontinuados a precio de nuevo: compará siempre contra lo que muestra el ranking de arriba, que se actualiza con el precio real más bajo.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuál es el precio mínimo razonable para una notebook nueva?',
        a: 'En Argentina, el piso donde ya conseguís 8 GB + SSD + pantalla utilizable suele rondar los $500.000-$650.000. Por debajo de eso casi siempre hay un sacrificio grave (4 GB de RAM, eMMC o un procesador de hace 6 años).',
      },
      {
        q: '¿Conviene una barata nueva o una usada mejor?',
        a: 'Para la mayoría, nueva: garantía oficial, batería sin desgaste y Windows 11 con soporte. La usada solo gana si viene de gama alta empresarial (ThinkPad, Latitude) con origen confiable — pero es una lotería que esta guía no puede rankear.',
      },
      {
        q: '¿Después puedo mejorar una notebook económica?',
        a: 'Muchas permiten sumar RAM o cambiar el SSD por uno más grande — es la mejora con mejor costo-beneficio. Revisá en la ficha del fabricante si la RAM viene soldada antes de comprar, sobre todo en los modelos más finitos.',
      },
    ],
  },
  {
    slug: 'mejores-macbook',
    title: 'Las mejores MacBook 2026: cuál comprar en Argentina',
    h1: 'Las mejores MacBook 2026',
    description: 'Comparativa de las MacBook disponibles en Mercado Libre Argentina (Air y Pro), con specs y el mejor precio de cada una.',
    intro: 'Si querés una Mac, repasamos las MacBook disponibles en Mercado Libre Argentina ordenadas por relación specs/precio, con el valor más bajo de cada modelo.',
    datePublished: '2026-06-25',
    filters: {},
    match: hasApple,
    keywords: ['macbook', 'mejor macbook', 'macbook air', 'macbook pro'],
    guide: [
      {
        h2: 'Air o Pro: cuál te conviene',
        paragraphs: [
          'La MacBook Air es la respuesta correcta para el 80% de la gente: silenciosa (no tiene ventilador), liviana (~1,24 kg) y con batería para todo el día. Con chip M2 o M3 mueve sin despeinarse ofimática, programación, diseño en Figma y hasta edición de video liviana. La Pro se justifica cuando el trabajo es sostenido y pesado: exportar video largo, compilar proyectos enormes o 3D — su ventilación activa le permite mantener el rendimiento sin bajar revoluciones.',
          'En Argentina la variable decisiva suele ser el precio del momento: una Air M3 cerca del precio de una Air M2 es compra fácil; una Pro de generación anterior puede quedar más barata que una Air nueva con specs similares. Por eso el ranking de arriba ordena por relación specs/precio en vivo.',
        ],
      },
      {
        h2: 'Qué configuración buscar',
        paragraphs: [
          'Memoria unificada: 8 GB alcanzan para uso general, pero si pensás tenerla 5+ años o trabajás con muchas apps a la vez, 16 GB es la compra inteligente — en Mac la RAM no se amplía jamás. Almacenamiento: 256 GB se quedan cortos rápido con fotos y proyectos; 512 GB es el punto justo. Y entre generaciones de chip (M2 → M3 → M4) la mejora es real pero incremental: conviene la generación anterior si la diferencia de precio supera el 20%.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Vale la pena una MacBook para estudiar?',
        a: 'Si tu carrera no depende de software solo-Windows (algunos programas de ingeniería o contabilidad), sí: la batería de 15+ horas, el peso y la duración a largo plazo son imbatibles. Verificá antes que el software de tu facultad corra en macOS.',
      },
      {
        q: '¿Se puede jugar en una MacBook?',
        a: 'Cada vez más títulos corren nativos con los chips M (Resident Evil, Death Stranding, Baldur\'s Gate 3), pero el catálogo sigue siendo mucho menor que en Windows. Si el gaming es prioridad, una notebook con RTX rinde más por peso invertido.',
      },
      {
        q: '¿MacBook con 8 GB alcanza en 2026?',
        a: 'Para navegar, Office, clases y hasta desarrollo liviano, sí — la gestión de memoria de macOS es muy eficiente. Para edición de video, máquinas virtuales o multitarea intensa, andá directo a 16 GB porque no hay upgrade posible después.',
      },
    ],
  },
  {
    slug: 'mejores-chromebooks',
    title: 'Las mejores Chromebooks 2026 en Argentina',
    h1: 'Las mejores Chromebooks',
    description: 'Chromebooks baratas y livianas para navegar, estudiar y la nube, con precios actualizados de Mercado Libre Argentina.',
    intro: 'Las Chromebooks son livianas, baratas y rendidoras para todo lo que sea web, estudio y la nube. Estas son las mejores disponibles.',
    datePublished: '2026-06-25',
    filters: { sort: 'price_asc' },
    match: isChromebook,
    keywords: ['chromebook', 'mejor chromebook', 'chromebook barata'],
    guide: [
      {
        h2: 'Qué es ChromeOS y para quién tiene sentido',
        paragraphs: [
          'Una Chromebook corre ChromeOS, el sistema de Google centrado en el navegador: Gmail, Docs, Meet, YouTube, Netflix y cualquier web funcionan perfecto, más las apps de Android del Play Store. La gracia es que el hardware modesto rinde muchísimo: prenden en segundos, no se enlentecen con el tiempo y la batería suele superar las 10 horas.',
          'Es la elección ideal para estudiantes de primaria/secundaria, como segunda notebook o para alguien que vive en el navegador. No es para vos si necesitás programas de escritorio de Windows (AutoCAD, Photoshop completo, software de facturación local) o juegos pesados.',
        ],
      },
      {
        h2: 'Qué specs importan en una Chromebook',
        paragraphs: [
          'Como el sistema es liviano, con 4 GB de RAM funciona — pero 8 GB la hacen mucho más cómoda con pestañas y apps de Android. Buscá pantalla Full HD (hay muchas HD en esta gama, y se nota), y revisá la fecha de fin de actualizaciones automáticas (AUE) del modelo en el sitio de Google: los modelos nuevos reciben 10 años de updates, pero uno viejo de oferta puede estar cerca del final.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Una Chromebook sirve sin internet?',
        a: 'Más de lo que se cree: Docs, Sheets, Gmail y Drive tienen modo offline, y las apps de Android instaladas funcionan igual. Pero la experiencia está pensada para estar conectada la mayor parte del tiempo.',
      },
      {
        q: '¿Puedo usar Office en una Chromebook?',
        a: 'Sí: Office web (gratis con cuenta Microsoft) y las apps de Android de Word/Excel funcionan bien. Si tu trabajo depende de macros complejas de Excel de escritorio, ahí necesitás Windows.',
      },
      {
        q: '¿Chromebook o notebook Windows barata?',
        a: 'A igual precio, la Chromebook suele sentirse más rápida y con más batería; la Windows es más versátil en programas. Si tu vida pasa por el navegador, Chromebook; si necesitás instalar programas específicos, Windows.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-16gb-ram',
    title: 'Las mejores notebooks con 16GB de RAM 2026',
    h1: 'Mejores notebooks con 16GB de RAM',
    description: 'Notebooks con 16GB de RAM para multitarea pesada, al mejor precio en Mercado Libre Argentina.',
    intro: '16 GB de RAM es el punto justo para multitarea sin trabarse. Estas son las mejores notebooks con 16 GB (o más) disponibles ahora.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 16 },
    keywords: ['notebook 16gb', 'notebook 16gb ram'],
    guide: [
      {
        h2: 'Por qué 16 GB es el punto justo hoy',
        paragraphs: [
          'Windows 11 más un navegador con 15 pestañas ya consumen 7-8 GB: con 8 GB de RAM estás siempre al borde, y el sistema empieza a mover datos al disco (mucho más lento). Con 16 GB hay aire para todo el uso real: multitarea pesada, videollamadas grabando, Photoshop, programar con Docker o jugar. Es la spec que más alarga la vida útil de una notebook: un equipo con 16 GB comprado hoy sigue siendo cómodo dentro de 5 años.',
          '¿Cuándo tiene sentido 32 GB? Edición de video 4K, máquinas virtuales, datasets grandes o workstation de trabajo serio. Para todo lo demás, es plata que rinde más en un mejor procesador o SSD.',
        ],
      },
      {
        h2: 'Soldada o expandible: el detalle que nadie revisa',
        paragraphs: [
          'Cada vez más notebooks (sobre todo las finitas) traen la RAM soldada a la placa: lo que comprás es lo que tenés para siempre. Si el modelo tiene zócalos SODIMM libres, podés arrancar con 16 GB y ampliar más adelante. El tipo también importa: DDR5 y LPDDR5X son notablemente más rápidas que DDR4, algo que se siente sobre todo en gráficos integrados, que usan la RAM del sistema como memoria de video.',
        ],
      },
    ],
    faq: [
      {
        q: '¿16 GB alcanzan para jugar?',
        a: 'Sí, es el estándar actual para gaming: prácticamente ningún juego pide más de 16 GB. Lo crítico para jugar sigue siendo la placa de video; la RAM en 16 GB ya no es cuello de botella.',
      },
      {
        q: '¿Se nota la diferencia entre 8 y 16 GB en el uso diario?',
        a: 'Muchísimo, y cada vez más: con 8 GB el sistema recurre al disco cuando abrís varias apps y todo se siente pesado. Es la mejora de experiencia más grande por peso invertido en una notebook.',
      },
      {
        q: '¿Mejor 16 GB DDR4 o esperar DDR5?',
        a: 'Si el precio es similar, DDR5. Pero un buen equipo DDR4 con descuento sigue siendo gran compra: la diferencia de velocidad se nota poco fuera de gráficos integrados y cargas muy pesadas.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-i7',
    title: 'Las mejores notebooks con procesador i7 / Ryzen 7 (2026)',
    h1: 'Mejores notebooks i7 / Ryzen 7',
    description: 'Notebooks potentes con Intel Core i7 o AMD Ryzen 7, para trabajo pesado, edición y gaming.',
    intro: 'Un i7 o Ryzen 7 te da potencia de sobra para trabajo exigente, edición y juegos. Acá están las mejores con ese nivel de procesador.',
    datePublished: '2026-06-25',
    filters: { processorMinTier: 7, ramMinGb: 16 },
    keywords: ['notebook i7', 'notebook ryzen 7', 'notebook potente'],
    guide: [
      {
        h2: 'No todos los i7 son iguales: mirá la generación',
        paragraphs: [
          'Un "i7" solo dice la categoría, no la potencia real: un i7 de 13ª/14ª generación (o Core Ultra 7) casi duplica en rendimiento a un i7 de 10ª que todavía circula en ofertas. Regla práctica: en Intel buscá 12ª generación como mínimo (i7-12xxx en adelante) y en AMD, Ryzen 7 serie 5000 en adelante (7xxx/8xxx ideal). Un i5 moderno le gana cómodo a un i7 viejo — y suele ser más barato.',
          'También importa la letra final: U (bajo consumo, más batería, menos potencia sostenida), H/HX (alto rendimiento, para gaming y trabajo pesado). Para edición o juegos buscá serie H; para portabilidad con potencia, los P o U modernos rinden muy bien.',
        ],
      },
      {
        h2: 'i7 vs Ryzen 7: ¿cuál elegir?',
        paragraphs: [
          'En 2026 están parejos: los Ryzen 7 suelen ganar en eficiencia y en gráficos integrados (Radeon 780M es el mejor iGPU para jugar sin placa dedicada), mientras los Intel ofrecen Quick Sync — un plus real si editás video. En la práctica, conviene decidir por el paquete completo (pantalla, RAM, GPU, precio) antes que por la marca del procesador: por eso el ranking mezcla ambos y los ordena por specs/precio.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Conviene un i7 con gráficos integrados o un i5 con placa dedicada?',
        a: 'Depende del uso: para jugar o editar video, i5 + RTX gana siempre. Para compilar, muchas pestañas y multitarea sin gráficos pesados, el i7 solo alcanza y la batería lo agradece.',
      },
      {
        q: '¿Qué generación de i7 es el mínimo razonable en 2026?',
        a: '12ª generación (i7-1255U, 12700H, etc.). Por debajo de eso estás comprando tecnología de 4+ años al precio de nueva. En AMD, Ryzen 7 5000 en adelante.',
      },
      {
        q: '¿El Ryzen 7 es equivalente al i7?',
        a: 'Sí, compiten en el mismo segmento y en la mayoría de las tareas rinden parejo. Los Ryzen destacan en autonomía y gráficos integrados; los Intel en aceleración de video. Ninguno es error.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-livianas',
    title: 'Las mejores notebooks livianas y portátiles 2026',
    h1: 'Mejores notebooks livianas (13–14")',
    description: 'Notebooks livianas y compactas de 13 a 14 pulgadas, ideales para llevar a todos lados.',
    intro: 'Si la llevás a todos lados, conviene una de 13–14" y poco peso. Estas son las más cómodas para transportar sin resignar rendimiento.',
    datePublished: '2026-06-25',
    filters: { screenMin: 13, screenMax: 14.5, ramMinGb: 8 },
    keywords: ['notebook liviana', 'notebook portátil', 'ultrabook'],
    guide: [
      {
        h2: 'Qué define a una buena notebook para llevar',
        paragraphs: [
          'Tres números: menos de 1,5 kg de peso, 14 pulgadas o menos de pantalla, y 8+ horas de batería real. Con eso entra en cualquier mochila y aguanta una jornada de cursada o trabajo sin cargador. Los procesadores modernos de bajo consumo (Intel serie U/P, Ryzen U) rinden hoy tanto que ya no hay que resignar velocidad para ganar portabilidad en uso general.',
          'Detalles que se agradecen a diario: carga por USB-C (usás el mismo cargador del teléfono o uno GaN chiquito), chasis de aluminio que aguanta el traqueteo, y bisagra que abre con una mano. Una pantalla con buen brillo (300+ nits) también importa si trabajás cerca de ventanas o al aire libre.',
        ],
      },
      {
        h2: 'A qué renunciás (y a qué no)',
        paragraphs: [
          'Lo que perdés contra una de 15,6": teclado numérico, algo de superficie de pantalla y, en general, placa de video dedicada — las gamer livianas existen pero cuestan caro. Lo que NO tenés que resignar: 16 GB de RAM si trabajás en serio, pantalla Full HD IPS, y un SSD rápido. La portabilidad no debería costarte la comodidad de uso.',
        ],
      },
    ],
    faq: [
      {
        q: '¿13 o 14 pulgadas?',
        a: '14" es el punto dulce: apenas más grande de mochila pero mucho más cómoda para trabajar horas. 13" gana solo si el peso mínimo es tu prioridad absoluta o viajás constantemente.',
      },
      {
        q: '¿Las livianas rinden igual que las grandes?',
        a: 'En uso general (oficina, estudio, programación liviana), sí. En cargas sostenidas largas (renders, compilaciones enormes, gaming), un chasis grande disipa mejor y mantiene más rendimiento. Para el 90% del uso diario no vas a notar diferencia.',
      },
      {
        q: '¿Cuánta batería real tiene una ultraliviana?',
        a: 'Las buenas logran 7-10 horas de uso mixto real (las "18 horas" del marketing son reproducción de video con brillo bajo). Revisá la capacidad en Wh: 50+ Wh en una 14" es buena señal.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-alta-gama',
    title: 'Las mejores notebooks de alta gama 2026',
    h1: 'Las mejores notebooks de alta gama',
    description: 'Lo más potente: notebooks premium con i7+/Ryzen 7+, 16GB+ y la mejor relación de specs, ordenadas de mayor a menor.',
    intro: 'Para quienes quieren lo mejor sin mirar tanto el precio: notebooks de alta gama con procesadores tope, mucha RAM y placa dedicada.',
    datePublished: '2026-06-25',
    filters: { ramMinGb: 16, processorMinTier: 7, priceMin: 1_500_000, sort: 'price_desc' },
    keywords: ['notebook alta gama', 'notebook premium', 'mejor notebook'],
    guide: [
      {
        h2: 'Qué separa a una alta gama del resto',
        paragraphs: [
          'No es solo el procesador: la gama alta se nota en el conjunto. Pantallas 2K/4K u OLED con 100% DCI-P3, chasis de aluminio o magnesio, teclados con mejor recorrido, refrigeración que sostiene el rendimiento por horas, parlantes decentes y conectividad completa (Thunderbolt/USB4, Wi-Fi 6E/7). Es la diferencia entre una máquina que rinde en el benchmark y una que da gusto usar 8 horas por día.',
          'En specs, el estándar 2026 de este segmento: i7/i9 o Ryzen 7/9 de última generación, 16-32 GB de RAM (idealmente DDR5), SSD NVMe de 1 TB y, según el perfil, RTX 4060 o superior para gaming/creación.',
        ],
      },
      {
        h2: '¿Vale la pena pagar el premium?',
        paragraphs: [
          'La cuenta que conviene hacer es por año de uso: una alta gama bien elegida dura 6-7 años vigente, contra 3-4 de una gama media exigida. Si la notebook es tu herramienta de trabajo diaria, el costo por día es marginal y la diferencia de calidad, constante. Si tu uso es liviano, el premium se desperdicia: una gama media de este mismo sitio te sobra.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuánto dura una notebook de alta gama?',
        a: 'Bien cuidada, 6-7 años siendo perfectamente usable — el hardware tope de hoy es el estándar de dentro de 4 años. Por eso a largo plazo el costo anual termina siendo similar al de renovar gama media más seguido.',
      },
      {
        q: '¿Alta gama del año pasado o gama media nueva?',
        a: 'Casi siempre la alta gama anterior: mejor pantalla, chasis y refrigeración no caducan, y su procesador "viejo" suele seguir ganándole al medio nuevo. Solo revisá que el descuento sea real (el ranking de arriba muestra el precio vivo).',
      },
      {
        q: '¿Necesito i9 o Ryzen 9?',
        a: 'Solo para cargas extremas sostenidas (render 3D profesional, compilación masiva, simulación). Para todo lo demás — incluido gaming — un i7/Ryzen 7 moderno rinde casi igual y calienta menos.',
      },
    ],
  },

  /* ── Nuevos artículos (julio 2026) ─────────────────────────────── */
  {
    slug: 'mejores-notebooks-calidad-precio',
    title: 'Las mejores notebooks calidad-precio 2026 en Argentina',
    h1: 'Mejores notebooks relación precio-calidad',
    description: 'Las notebooks con mejor relación precio-calidad de Mercado Libre Argentina: 16GB, SSD y buen procesador pagando lo justo. Ranking actualizado.',
    intro: 'Ni la más barata ni la más potente: la mejor compra es la que te da más specs por peso invertido. Este ranking busca ese punto dulce — equipos con 16 GB, SSD y procesadores modernos al menor precio disponible hoy.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 16, storageMinGb: 256, sort: 'price_asc' },
    keywords: ['notebook calidad precio', 'mejor notebook precio calidad', 'notebook relación precio calidad'],
    guide: [
      {
        h2: 'Cómo se calcula la relación precio-calidad',
        paragraphs: [
          'Nuestra fórmula es simple: specs que importan (RAM, procesador, SSD, pantalla, GPU) divididas por el precio en vivo. El truco está en qué specs pesan: 16 GB de RAM valen más que un logo, un SSD NVMe más que 100 GB extra de disco, y un procesador de generación reciente más que un "i7" viejo. El ranking de arriba aplica exactamente ese criterio sobre todo el catálogo disponible.',
          'El punto dulce del mercado argentino suele estar en la gama media: equipos con Ryzen 5/i5 moderno, 16 GB y SSD de 512 GB. Ahí es donde cada peso extra compra rendimiento real, antes de que la curva se aplane y empieces a pagar por marca, diseño o specs que no usás.',
        ],
      },
      {
        h2: 'Señales de buena (y mala) compra',
        paragraphs: [
          'Buena señal: descuento real sobre un modelo de la generación actual — pasa cuando sale el reemplazo y los vendedores liquidan stock. Mala señal: "ofertas" de procesadores de hace 4+ generaciones, RAM de 8 GB soldada sin expansión, o pantallas HD en 2026. Otra trampa común: pagar gama alta por un equipo con GPU dedicada de entrada (RTX 3050 4GB) que no rinde ni para gaming serio ni justifica su sobreprecio.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuál es el rango de precio con mejor relación en Argentina?',
        a: 'Históricamente la franja media — hoy entre $900.000 y $1.500.000 — donde conseguís 16 GB, SSD 512 y procesadores actuales. Debajo de eso resignás specs clave; arriba, empezás a pagar por diferenciales de nicho.',
      },
      {
        q: '¿Conviene esperar ofertas o comprar ya?',
        a: 'Los precios de notebooks en Mercado Libre cambian todos los días y este ranking se refresca con ellos. Si el equipo que necesitás está en su precio más bajo del ranking, esperar suele costar más que ahorrar.',
      },
      {
        q: '¿Marca conocida o specs mejores?',
        a: 'A igual precio, specs — la diferencia de calidad entre marcas grandes (Lenovo, HP, ASUS, Acer, Dell) es menor de lo que era. Sí evitá marcas sin servicio técnico en Argentina, porque la garantía la vas a querer tener cerca.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-lenovo',
    title: 'Las mejores notebooks Lenovo 2026 en Argentina',
    h1: 'Las mejores notebooks Lenovo',
    description: 'Ranking de las mejores notebooks Lenovo en Mercado Libre Argentina: IdeaPad, ThinkPad, LOQ y Legion comparadas con precio actualizado.',
    intro: 'Lenovo es la marca que más notebooks vende en el mundo, y en Argentina tiene línea para cada bolsillo: de la IdeaPad económica a la Legion gamer. Acá están las mejores Lenovo disponibles hoy, ordenadas por relación specs/precio.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 8 },
    match: hasBrand(/lenovo|ideapad|thinkpad|legion|\bloq\b|yoga/i),
    keywords: ['notebook lenovo', 'mejor notebook lenovo', 'lenovo ideapad', 'lenovo thinkpad'],
    guide: [
      {
        h2: 'Las líneas de Lenovo, explicadas en 1 minuto',
        paragraphs: [
          'IdeaPad es la línea de entrada y media: la mejor relación precio-specs del catálogo Lenovo, ideal para estudio y oficina. ThinkPad es la línea empresarial: teclados legendarios, construcción de tanque y mejor soporte — cuestan más a igual spec, pero duran años de uso rudo. Yoga son las premium convertibles/finas, con mejores pantallas.',
          'Para jugar: LOQ es la gamer de entrada (la forma más barata de conseguir una RTX en Lenovo) y Legion la gamer seria, con refrigeración y pantallas de otro nivel. Si el presupuesto lo permite, Legion es consistentemente una de las líneas gamer mejor valoradas del mercado.',
        ],
      },
      {
        h2: 'Qué mirar al comprar una Lenovo en Argentina',
        paragraphs: [
          'El mismo nombre de línea cubre configuraciones muy distintas: una IdeaPad puede venir con Ryzen 3 y 8 GB o con Ryzen 7 y 16 GB. Mirá siempre procesador exacto, RAM y si es expandible (los ThinkPad casi siempre lo son; las Yoga finas, no). Lenovo tiene servicio técnico oficial en el país, lo que hace válida la garantía local — un plus real contra importados grises.',
        ],
      },
    ],
    faq: [
      {
        q: '¿ThinkPad vale lo que cuesta?',
        a: 'Si la notebook es tu herramienta de trabajo diaria, sí: teclado, bisagras y chasis están construidos para años de uso intensivo, y suelen ser fáciles de reparar y ampliar. Para uso liviano, una IdeaPad da más specs por menos plata.',
      },
      {
        q: '¿Las IdeaPad son buenas o "demasiado baratas"?',
        a: 'Son de lo mejor en precio-calidad de entrada: hardware actual sin lujos de chasis. El cuidado es elegir configuración correcta — 8 GB mínimo y SSD — porque las versiones más peladas existen.',
      },
      {
        q: '¿LOQ o Legion para gaming?',
        a: 'LOQ si buscás la puerta de entrada más barata a una RTX; Legion si podés estirar: mejor pantalla (más Hz y brillo), refrigeración superior que sostiene el rendimiento y mejor construcción.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-hp',
    title: 'Las mejores notebooks HP 2026 en Argentina',
    h1: 'Las mejores notebooks HP',
    description: 'Ranking de las mejores notebooks HP en Mercado Libre Argentina: HP 15, Pavilion, Victus, Envy y Omen con precio actualizado.',
    intro: 'HP tiene una de las gamas más amplias del mercado argentino: desde la serie 15 económica hasta las Omen para gaming. Este ranking ordena las mejores HP disponibles hoy por relación specs/precio, con el valor más bajo de cada una.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 8 },
    match: hasBrand(/\bhp\b|hewlett|pavilion|victus|\bomen\b|probook|elitebook/i),
    keywords: ['notebook hp', 'mejor notebook hp', 'hp pavilion', 'hp victus'],
    guide: [
      {
        h2: 'Las líneas de HP, de entrada a gamer',
        paragraphs: [
          'HP 15 (o "HP 250") es la línea de volumen: básica, correcta y casi siempre de las más baratas con specs decentes — ideal primer equipo o estudio. Pavilion sube un escalón en construcción y pantalla para uso familiar/oficina. Envy es la premium fina (rival de Yoga/Zenbook), con pantallas y materiales notablemente mejores.',
          'Para jugar, Victus es la gamer accesible — suele tener muy buen precio por RTX en Argentina — y Omen la línea entusiasta con más refrigeración y pantallas rápidas. En empresas, ProBook/EliteBook son las equivalentes al ThinkPad: robustas, sobrias y fáciles de mantener.',
        ],
      },
      {
        h2: 'Qué revisar antes de comprar una HP',
        paragraphs: [
          'En la gama de entrada conviven configuraciones muy distintas bajo nombres parecidos: verificá procesador exacto y que tenga SSD (algunas 15 viejas de stock traen configuraciones flojas). Las Victus en oferta suelen ser el mejor peso-por-FPS del catálogo HP, pero compará el modelo de GPU: una RTX 4050 nueva le gana a una 3050 "en oferta". HP tiene red de servicio oficial en Argentina, así que priorizá versiones con garantía local.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Las HP 15 baratas valen la pena?',
        a: 'Como equipo de estudio/oficina, sí — siempre que la config tenga 8 GB y SSD. Es hardware sin lujos pero actual, y suele estar entre lo más barato de marca grande con garantía local.',
      },
      {
        q: '¿Victus u Omen para gaming?',
        a: 'Victus para presupuesto ajustado: misma GPU que equipos más caros, recortando en chasis y pantalla. Omen para jugar en serio: sostiene mejor el rendimiento térmico y sus pantallas de 144+ Hz son notablemente superiores.',
      },
      {
        q: '¿Pavilion o Envy?',
        a: 'Pavilion es la familiar equilibrada; Envy compite en la gama premium con mejor pantalla (a veces OLED), chasis de aluminio y parlantes. Si trabajás muchas horas frente al equipo, la Envy se justifica.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-asus',
    title: 'Las mejores notebooks ASUS 2026 en Argentina',
    h1: 'Las mejores notebooks ASUS',
    description: 'Ranking de las mejores notebooks ASUS en Mercado Libre Argentina: Vivobook, Zenbook, TUF y ROG comparadas con precio en vivo.',
    intro: 'ASUS creció fuerte en Argentina con una gama que va del Vivobook económico a las ROG de gaming tope. Acá están las mejores ASUS disponibles ahora, ordenadas por relación specs/precio con el valor más bajo de cada modelo.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 8 },
    match: hasBrand(/asus|vivobook|zenbook|\btuf\b|\brog\b|strix/i),
    keywords: ['notebook asus', 'mejor notebook asus', 'asus vivobook', 'asus tuf'],
    guide: [
      {
        h2: 'Vivobook, Zenbook, TUF y ROG: cuál es cuál',
        paragraphs: [
          'Vivobook es la línea de volumen: mucha spec por el precio, ideal estudio y trabajo — ojo que abarca desde configs muy básicas hasta Vivobook Pro con OLED y GPU. Zenbook es la premium ultraliviana: pantallas OLED excelentes, poco peso y gran batería; de lo mejor para quien trabaja en movimiento.',
          'En gaming, TUF es la línea "resistente" de entrada-media: buena refrigeración y precio por RTX, chasis más tosco. ROG (Strix, Zephyrus) es el tope: pantallas rapidísimas, la mejor relación potencia/peso del mercado en los Zephyrus, y precio acorde. Si ves una TUF con RTX 4060 al precio de la competencia con 4050, es de las mejores compras gamer.',
        ],
      },
      {
        h2: 'El diferencial ASUS: pantallas OLED',
        paragraphs: [
          'ASUS es la marca que más popularizó OLED en notebooks: negros perfectos, colores que ningún IPS de gama media iguala y excelente para consumir contenido o diseñar. Dos consideraciones: consume algo más de batería con contenido claro, y conviene usar las protecciones anti burn-in que trae de fábrica. Si editás foto/video con presupuesto medio, un Vivobook Pro OLED es difícil de igualar.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Los Vivobook son de buena calidad?',
        a: 'Sí para su segmento: hardware actual y buen precio, con chasis plástico correcto. Revisá la config exacta — la línea va desde entrada muy básica hasta versiones Pro con OLED y RTX que compiten dos gamas más arriba.',
      },
      {
        q: '¿TUF o ROG para gaming?',
        a: 'TUF da el mejor precio por FPS; ROG suma pantalla superior, menos peso y mejor refrigeración. Si es tu primera gamer o el presupuesto manda, TUF; si jugás competitivo o la movés mucho, ROG.',
      },
      {
        q: '¿Vale la pena la pantalla OLED en una notebook?',
        a: 'Para contenido, diseño y edición: rotundamente sí, la diferencia visual es enorme. Para ofimática pura al máximo brillo todo el día, un buen IPS cumple igual y gasta menos batería.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-acer',
    title: 'Las mejores notebooks Acer 2026 en Argentina',
    h1: 'Las mejores notebooks Acer',
    description: 'Ranking de las mejores notebooks Acer en Mercado Libre Argentina: Aspire, Swift y Nitro con specs reales y precio actualizado.',
    intro: 'Acer pelea el segmento precio-calidad como pocas: las Aspire suelen estar entre lo más barato con specs decentes y las Nitro entre las gamer más accesibles. Estas son las mejores Acer disponibles hoy, ordenadas por relación specs/precio.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 8 },
    match: hasBrand(/acer|aspire|swift|nitro|predator|travelmate/i),
    keywords: ['notebook acer', 'mejor notebook acer', 'acer aspire', 'acer nitro'],
    guide: [
      {
        h2: 'Aspire, Swift, Nitro y Predator: la gama Acer',
        paragraphs: [
          'Aspire es la línea de entrada y media, la especialidad histórica de Acer: pocas marcas dan tanta spec por tan poco. Swift es la línea fina y liviana, con muy buenos precios para ultrabooks. En gaming, Nitro es sinónimo de "RTX más barata del mercado" — chasis sencillo, hardware correcto — y Predator la línea entusiasta con refrigeración y pantallas serias.',
          'La estrategia Acer es clara: recortar en materiales y marketing para dar mejor hardware al precio. Por eso brillan cuando el presupuesto es ajustado y las specs mandan, y por eso aparecen seguido arriba en nuestro ranking de precio-calidad.',
        ],
      },
      {
        h2: 'Qué revisar en una Acer antes de comprar',
        paragraphs: [
          'Como el fuerte es el precio, el catálogo incluye configs muy peladas: confirmá 8 GB mínimo (ideal 16), SSD NVMe y pantalla Full HD IPS — las variantes existen y el nombre "Aspire" no lo garantiza. En las Nitro, compará la GPU exacta y el refresco de pantalla entre versiones: a veces por poca diferencia pasás de RTX 4050/144 Hz a 4060/165 Hz, y esa sí es plata bien puesta.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Acer es una marca confiable?',
        a: 'Sí: es uno de los cinco fabricantes más grandes del mundo y tiene servicio técnico en Argentina. Su propuesta es más hardware por menos plata, recortando en chasis y detalles premium, no en componentes.',
      },
      {
        q: '¿La Nitro es buena primera notebook gamer?',
        a: 'Es probablemente LA primera gamer: la forma más barata de conseguir una RTX con refrigeración decente. No esperes chasis premium ni la mejor pantalla, pero los FPS por peso invertido son difíciles de superar.',
      },
      {
        q: '¿Aspire para estudiar: cuál config?',
        a: 'Ryzen 5 o i5 con 16 GB (o 8 ampliables) y SSD de 512: esa config suele costar como los equipos básicos de otras marcas y rinde una gama más arriba. Evitá las versiones con 4 GB u 8 soldados sin slot libre.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-dell',
    title: 'Las mejores notebooks Dell 2026 en Argentina',
    h1: 'Las mejores notebooks Dell',
    description: 'Ranking de las mejores notebooks Dell en Mercado Libre Argentina: Inspiron, Vostro, Latitude y XPS con precio actualizado.',
    intro: 'Dell es sinónimo de construcción sobria y soporte serio: Inspiron para el día a día, Vostro/Latitude para trabajo y XPS en la gama premium. Estas son las mejores Dell disponibles hoy en Mercado Libre Argentina.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 8 },
    match: hasBrand(/dell|inspiron|vostro|latitude|\bxps\b|alienware/i),
    keywords: ['notebook dell', 'mejor notebook dell', 'dell inspiron', 'dell xps'],
    guide: [
      {
        h2: 'Inspiron, Vostro, Latitude y XPS: para quién es cada una',
        paragraphs: [
          'Inspiron es la línea hogareña: equilibrada, sin estridencias, buena candidata para estudio y familia. Vostro es su gemela para pymes (misma base, foco en trabajo). Latitude es la corporativa seria — el rival directo del ThinkPad: chasis reforzado, teclados excelentes y facilidad de reparación; las Latitude usadas de flota son un clásico del mercado. XPS es la vidriera premium: pantallas espectaculares casi sin marco y construcción de aluminio tallado.',
          'Para gaming, Dell juega con la línea G y con Alienware en el tope absoluto — esta última con precios acordes a su chasis y refrigeración de otra categoría.',
        ],
      },
      {
        h2: 'El diferencial Dell: durabilidad y repuestos',
        paragraphs: [
          'Dell publica manuales de servicio de cada modelo y mantiene repuestos disponibles por años: si pensás tener la notebook mucho tiempo o repararla vos, es la marca más amigable. La contra en Argentina suele ser el precio: a igual spec suelen costar algo más que Acer o Lenovo de entrada — pagás construcción y soporte. Por eso en el ranking brillan cuando aparecen con descuento real.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Inspiron o Vostro?',
        a: 'Son casi el mismo equipo con foco distinto: Vostro apunta a pymes (a veces con pequeños extras de seguridad). Elegí por precio y config concreta, no por el nombre.',
      },
      {
        q: '¿Vale la pena una XPS?',
        a: 'Si valorás pantalla y construcción tope — es de lo mejor construido en Windows, con paneles que compiten con MacBook. Si solo mirás rendimiento por peso, una Inspiron potente da specs similares por bastante menos.',
      },
      {
        q: '¿Las Dell son caras de mantener?',
        a: 'Al revés: es de las marcas más reparables, con manuales oficiales públicos y repuestos disponibles años después del lanzamiento. RAM y SSD suelen ser accesibles en Inspiron/Latitude.',
      },
    ],
  },
  {
    slug: 'mejores-notebooks-para-arquitectura',
    title: 'Las mejores notebooks para arquitectura y AutoCAD 2026',
    h1: 'Mejores notebooks para arquitectura y AutoCAD',
    description: 'Notebooks para arquitectura: correr AutoCAD, Revit, SketchUp y renders sin trabas. Specs recomendadas y ranking con precio actualizado.',
    intro: 'Arquitectura es de los usos más exigentes: AutoCAD y SketchUp piden buen procesador, Revit devora RAM y los renders quieren placa de video. Este ranking reúne las notebooks disponibles hoy que mueven ese combo, ordenadas por relación specs/precio.',
    datePublished: '2026-07-03',
    filters: { ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, gpuDedicated: 'preferred', priceMin: 1_000_000 },
    keywords: ['notebook para arquitectura', 'notebook autocad', 'notebook revit', 'notebook para render'],
    guide: [
      {
        h2: 'Qué pide cada programa de arquitectura',
        paragraphs: [
          'AutoCAD 2D es más liviano de lo que se cree: un i5/Ryzen 5 moderno con 16 GB lo corre perfecto — la fluidez depende sobre todo de un buen procesador de núcleo rápido. Revit es otra cosa: los modelos BIM medianos superan fácil los 16 GB de RAM, por eso para la carrera o el estudio conviene apuntar a 16 GB ampliables (o 32 directo si el presupuesto da).',
          'Para renders (Lumion, Twinmotion, V-Ray, Enscape) la placa de video dedicada manda: una RTX 4050/4060 con 6-8 GB de VRAM baja los tiempos de horas a minutos y habilita visualización en tiempo real. SketchUp y el modelado 3D en general también agradecen GPU, aunque con menos exigencia.',
        ],
      },
      {
        h2: 'La config recomendada por etapa',
        paragraphs: [
          'Para cursar los primeros años (AutoCAD, Photoshop, entregas): i5/Ryzen 5 + 16 GB + SSD 512, con o sin GPU dedicada. Para los años de proyecto y trabajo profesional (Revit + renders): i7/Ryzen 7 serie H, 16-32 GB y RTX sí o sí. Pantalla: 15,6" Full HD como piso — y ojalá 100% sRGB, porque las láminas que imprimís deberían verse como en pantalla.',
        ],
      },
    ],
    faq: [
      {
        q: '¿AutoCAD corre sin placa de video dedicada?',
        a: 'Sí — 2D y modelos 3D chicos funcionan bien con gráficos integrados modernos y 16 GB de RAM. La GPU dedicada se vuelve necesaria para renders, Lumion/Twinmotion y modelos 3D grandes.',
      },
      {
        q: '¿Cuánta RAM para Revit?',
        a: '16 GB es el mínimo real para proyectos de facultad; los modelos profesionales medianos piden 32. Si tu equipo permite ampliar RAM más adelante, arrancar con 16 es razonable.',
      },
      {
        q: '¿Notebook o PC de escritorio para arquitectura?',
        a: 'Si cursás o trabajás en estudio ajeno, notebook: la necesitás portátil para correcciones y presentaciones. El escritorio rinde más por peso para render puro — el combo ideal a largo plazo suele ser notebook capaz + escritorio para renders pesados.',
      },
    ],
  },
];

export function getTopic(slug: string): BlogTopic | undefined {
  return BLOG_TOPICS.find((t) => t.slug === slug);
}

/** Etiqueta de categoría (chip del índice + hero del artículo). */
const CATEGORY: Record<string, string> = {
  'mejores-notebooks-gamer': 'Gaming',
  'mejores-notebooks-para-estudiar': 'Estudio',
  'mejores-notebooks-para-programar': 'Programación',
  'mejores-notebooks-para-diseno-y-edicion': 'Diseño',
  'mejores-notebooks-baratas': 'Precio',
  'mejores-macbook': 'Apple',
  'mejores-chromebooks': 'Chromebooks',
  'mejores-notebooks-16gb-ram': 'Memoria',
  'mejores-notebooks-i7': 'Potencia',
  'mejores-notebooks-livianas': 'Portátiles',
  'mejores-notebooks-alta-gama': 'Alta gama',
  'mejores-notebooks-calidad-precio': 'Precio',
  'mejores-notebooks-lenovo': 'Lenovo',
  'mejores-notebooks-hp': 'HP',
  'mejores-notebooks-asus': 'ASUS',
  'mejores-notebooks-acer': 'Acer',
  'mejores-notebooks-dell': 'Dell',
  'mejores-notebooks-para-arquitectura': 'Arquitectura',
};

export function categoryFor(slug: string): string {
  return CATEGORY[slug] ?? 'Guía';
}
