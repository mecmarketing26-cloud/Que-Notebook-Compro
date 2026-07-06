/**
 * Reescribe una URL de imagen del CDN de Mercado Libre a una variante más
 * liviana. El catálogo guarda la foto full (`D_NQ_NP_..._-F.jpg`, 100-200 KiB);
 * el mismo CDN expone `D_NQ_NP_2X_..._-V.webp` (~640px) y `-O.webp` (~1000px)
 * que pesan 3-6 veces menos. Misma foto, mismo encuadre.
 *
 * No todas las fotos tienen todas las variantes (las subidas en baja resolución
 * devuelven 405): todo <img> que use estas URLs debe llevar el fallback
 * ML_IMG_ONERROR, que vuelve a la URL original si la variante no existe.
 */
const ML_RE = /^(https:\/\/http2\.mlstatic\.com\/D_NQ_NP_)(?:2X_)?(.+)-[A-Z]\.(?:jpe?g|png|webp)$/;

function variant(url: string | null | undefined, size: 'V' | 'O'): string {
  if (!url) return '';
  const m = url.match(ML_RE);
  return m ? `${m[1]}2X_${m[2]}-${size}.webp` : url;
}

/** Cards y thumbnails (~640px). */
export const mlThumb = (url: string | null | undefined): string => variant(url, 'V');

/** Imagen grande (ficha de producto, ~1000px). */
export const mlLarge = (url: string | null | undefined): string => variant(url, 'O');

/**
 * Atributo onerror que deshace la reescritura (variante → original) en el
 * navegador. Es inverso a `variant()`, así no hace falta duplicar la URL
 * original en el HTML.
 */
export const ML_IMG_ONERROR =
  "this.onerror=null;this.src=this.src.replace('D_NQ_NP_2X_','D_NQ_NP_').replace(/-[VO]\\.webp$/,'-F.jpg')";
