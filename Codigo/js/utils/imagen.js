// utils/imagen.js — utilidades de imagen para VentaCositas.
// calcularDimensiones es pura (testeable en Node). comprimirImagen usa canvas (solo navegador).

/**
 * Calcula las dimensiones finales manteniendo el aspect ratio y sin exceder `maxLado`.
 * Función pura: no lee el DOM.
 * @param {number} ancho
 * @param {number} alto
 * @param {number} maxLado
 * @returns {{ancho: number, alto: number}}
 */
export function calcularDimensiones(ancho, alto, maxLado) {
  const w = Number(ancho);
  const h = Number(alto);
  const max = Number(maxLado);

  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return { ancho: 0, alto: 0 };
  }
  if (!Number.isFinite(max) || max <= 0) {
    return { ancho: Math.round(w), alto: Math.round(h) };
  }

  const scale = Math.min(1, max / Math.max(w, h));
  return {
    ancho: Math.max(1, Math.round(w * scale)),
    alto: Math.max(1, Math.round(h * scale)),
  };
}

/**
 * Comprime una imagen (File/Blob) a JPEG con un lado máximo y calidad dados.
 * Solo navegador: usa Image, canvas y URL.createObjectURL.
 * @param {Blob} file
 * @param {{maxLado?: number, calidad?: number}} [opciones]
 * @returns {Promise<Blob>}
 */
export function comprimirImagen(file, { maxLado = 800, calidad = 0.8 } = {}) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return Promise.reject(new Error('La compresión de imágenes solo está disponible en el navegador.'));
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const naturalW = img.naturalWidth || img.width;
      const naturalH = img.naturalHeight || img.height;
      const { ancho, alto } = calcularDimensiones(naturalW, naturalH, maxLado);

      const canvas = document.createElement('canvas');
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto de dibujo.'));
        return;
      }
      ctx.drawImage(img, 0, 0, ancho, alto);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo comprimir la imagen.'));
      }, 'image/jpeg', calidad);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };

    img.src = url;
  });
}
