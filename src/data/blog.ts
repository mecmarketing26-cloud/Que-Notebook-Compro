/**
 * Blog/SEO topics. Each is a keyword-rich listicle ("Las mejores notebooks para
 * X") whose ranking is computed LIVE from the same engine + index, so it's always
 * fresh, with real prices/discounts and affiliate links. Add topics freely.
 */
import type { NotebookFilters, NotebookProduct } from '../lib/types';

export interface BlogTopic {
  slug: string;
  title: string; // <title> / SEO
  h1: string;
  description: string; // meta description
  intro: string; // opening paragraph (keyword-rich)
  filters: NotebookFilters;
  max?: number;
  /** Optional extra predicate (brand/keyword) applied to candidates. */
  match?: (p: NotebookProduct) => boolean;
  keywords?: string[];
}

const hasApple = (p: NotebookProduct) => /apple|macbook/i.test(p.title) || /apple/i.test(p.specs.brand ?? '');
const isChromebook = (p: NotebookProduct) => /chromebook/i.test(p.title) || /chrome/i.test(p.specs.os ?? '');

export const BLOG_TOPICS: BlogTopic[] = [
  {
    slug: 'mejores-notebooks-gamer',
    title: 'Las mejores notebooks gamer 2026 en Argentina (con placa dedicada)',
    h1: 'Las mejores notebooks gamer 2026',
    description: 'Ranking de las mejores notebooks gamer en Mercado Libre Argentina: placa de video dedicada, 16GB+ y buen procesador, con precio actualizado.',
    intro: 'Si buscás una notebook para jugar, lo que más importa es la placa de video dedicada, 16 GB de RAM o más y un buen procesador. Armamos este ranking en vivo con las mejores notebooks gamer disponibles en Mercado Libre Argentina, ordenadas de mejor a peor y con el precio más barato de cada modelo.',
    filters: { ramMinGb: 16, gpuDedicated: 'required', processorMinTier: 5, priceMin: 1_000_000 },
    keywords: ['notebook gamer', 'notebook para jugar', 'mejor notebook gamer 2026'],
  },
  {
    slug: 'mejores-notebooks-para-estudiar',
    title: 'Las mejores notebooks para estudiar y oficina 2026',
    h1: 'Mejores notebooks para estudiar y oficina',
    description: 'Las mejores notebooks para estudiar, facultad y oficina: livianas, con SSD y buena autonomía, al mejor precio en Mercado Libre Argentina.',
    intro: 'Para estudiar y trabajar en la oficina no necesitás la notebook más cara: con 8 GB de RAM, SSD y un procesador decente alcanza y sobra. Estas son las mejores opciones para estudio y oficina, elegidas en vivo por precio y specs.',
    filters: { ramMinGb: 8, storageMinGb: 256, priceMin: 450_000, sort: 'price_asc' },
    keywords: ['notebook para estudiar', 'notebook para la facultad', 'notebook oficina'],
  },
  {
    slug: 'mejores-notebooks-para-programar',
    title: 'Las mejores notebooks para programar 2026',
    h1: 'Mejores notebooks para programar',
    description: 'Las mejores notebooks para programación: 16GB de RAM, SSD rápido y buen procesador para compilar y correr todo sin trabarse.',
    intro: 'Programar pide RAM (16 GB como piso), un SSD rápido y un procesador que aguante compilar y correr varios entornos a la vez. Estas son las mejores notebooks para programadores disponibles ahora.',
    filters: { ramMinGb: 16, storageMinGb: 512, processorMinTier: 5, priceMin: 800_000 },
    keywords: ['notebook para programar', 'notebook para programación', 'notebook desarrollo'],
  },
  {
    slug: 'mejores-notebooks-para-diseno-y-edicion',
    title: 'Las mejores notebooks para diseño y edición de video 2026',
    h1: 'Mejores notebooks para diseño y edición de video',
    description: 'Notebooks potentes para diseño gráfico, edición de video y 3D: procesador i7/Ryzen 7, 16GB+ y placa de video.',
    intro: 'El diseño y la edición de video piden potencia: procesador i7/Ryzen 7 o superior, 16 GB de RAM como mínimo y, ojalá, placa de video dedicada. Acá están las mejores para creativos.',
    filters: { ramMinGb: 16, processorMinTier: 7, storageMinGb: 512, gpuDedicated: 'preferred', priceMin: 1_200_000 },
    keywords: ['notebook para diseño', 'notebook edición de video', 'notebook para 3D'],
  },
  {
    slug: 'mejores-notebooks-baratas',
    title: 'Las mejores notebooks baratas 2026 (buenas y económicas)',
    h1: 'Las mejores notebooks baratas',
    description: 'Notebooks baratas que valen la pena: las opciones más económicas con buen rendimiento para uso diario, al mejor precio.',
    intro: 'Si el presupuesto manda, estas son las notebooks más económicas que igual cumplen para navegar, estudiar y el día a día. Ordenadas de menor a mayor precio.',
    filters: { ramMinGb: 8, sort: 'price_asc' },
    keywords: ['notebook barata', 'notebook económica', 'notebook precio bajo'],
  },
  {
    slug: 'mejores-macbook',
    title: 'Las mejores MacBook 2026: cuál comprar en Argentina',
    h1: 'Las mejores MacBook 2026',
    description: 'Comparativa de las MacBook disponibles en Mercado Libre Argentina (Air y Pro), con specs y el mejor precio de cada una.',
    intro: 'Si querés una Mac, repasamos las MacBook disponibles en Mercado Libre Argentina ordenadas por relación specs/precio, con el valor más bajo de cada modelo.',
    filters: {},
    match: hasApple,
    keywords: ['macbook', 'mejor macbook', 'macbook air', 'macbook pro'],
  },
  {
    slug: 'mejores-chromebooks',
    title: 'Las mejores Chromebooks 2026 en Argentina',
    h1: 'Las mejores Chromebooks',
    description: 'Chromebooks baratas y livianas para navegar, estudiar y la nube, con precios actualizados de Mercado Libre Argentina.',
    intro: 'Las Chromebooks son livianas, baratas y rendidoras para todo lo que sea web, estudio y la nube. Estas son las mejores disponibles.',
    filters: { sort: 'price_asc' },
    match: isChromebook,
    keywords: ['chromebook', 'mejor chromebook', 'chromebook barata'],
  },
  {
    slug: 'mejores-notebooks-16gb-ram',
    title: 'Las mejores notebooks con 16GB de RAM 2026',
    h1: 'Mejores notebooks con 16GB de RAM',
    description: 'Notebooks con 16GB de RAM para multitarea pesada, al mejor precio en Mercado Libre Argentina.',
    intro: '16 GB de RAM es el punto justo para multitarea sin trabarse. Estas son las mejores notebooks con 16 GB (o más) disponibles ahora.',
    filters: { ramMinGb: 16 },
    keywords: ['notebook 16gb', 'notebook 16gb ram'],
  },
  {
    slug: 'mejores-notebooks-i7',
    title: 'Las mejores notebooks con procesador i7 / Ryzen 7 (2026)',
    h1: 'Mejores notebooks i7 / Ryzen 7',
    description: 'Notebooks potentes con Intel Core i7 o AMD Ryzen 7, para trabajo pesado, edición y gaming.',
    intro: 'Un i7 o Ryzen 7 te da potencia de sobra para trabajo exigente, edición y juegos. Acá están las mejores con ese nivel de procesador.',
    filters: { processorMinTier: 7, ramMinGb: 16 },
    keywords: ['notebook i7', 'notebook ryzen 7', 'notebook potente'],
  },
  {
    slug: 'mejores-notebooks-livianas',
    title: 'Las mejores notebooks livianas y portátiles 2026',
    h1: 'Mejores notebooks livianas (13–14")',
    description: 'Notebooks livianas y compactas de 13 a 14 pulgadas, ideales para llevar a todos lados.',
    intro: 'Si la llevás a todos lados, conviene una de 13–14" y poco peso. Estas son las más cómodas para transportar sin resignar rendimiento.',
    filters: { screenMin: 13, screenMax: 14.5, ramMinGb: 8 },
    keywords: ['notebook liviana', 'notebook portátil', 'ultrabook'],
  },
  {
    slug: 'mejores-notebooks-alta-gama',
    title: 'Las mejores notebooks de alta gama 2026',
    h1: 'Las mejores notebooks de alta gama',
    description: 'Lo más potente: notebooks premium con i7+/Ryzen 7+, 16GB+ y la mejor relación de specs, ordenadas de mayor a menor.',
    intro: 'Para quienes quieren lo mejor sin mirar tanto el precio: notebooks de alta gama con procesadores tope, mucha RAM y placa dedicada.',
    filters: { ramMinGb: 16, processorMinTier: 7, priceMin: 1_500_000, sort: 'price_desc' },
    keywords: ['notebook alta gama', 'notebook premium', 'mejor notebook'],
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
};

export function categoryFor(slug: string): string {
  return CATEGORY[slug] ?? 'Guía';
}
