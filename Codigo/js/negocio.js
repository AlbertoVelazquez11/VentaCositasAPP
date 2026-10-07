// negocio.js — reglas puras del dominio VentaCositas (sin DOM, sin efectos).
// Estados congelados y máquina de transiciones de un artículo.

export const ESTATUS = Object.freeze({
  ALMACENADO: 'almacenado',
  EN_VENTA: 'en-venta',
  VENDIDO: 'vendido',
  DESCARTADO: 'descartado',
});

/**
 * Transiciones válidas (desde → [hacia...]).
 * - almacenado ⇄ en-venta (manual, ambos sentidos)
 * - almacenado / en-venta → vendido | descartado
 * - vendido y descartado son terminales (sin reversibilidad).
 */
export const TRANSICIONES = Object.freeze({
  [ESTATUS.ALMACENADO]: Object.freeze([ESTATUS.EN_VENTA, ESTATUS.VENDIDO, ESTATUS.DESCARTADO]),
  [ESTATUS.EN_VENTA]: Object.freeze([ESTATUS.ALMACENADO, ESTATUS.VENDIDO, ESTATUS.DESCARTADO]),
  [ESTATUS.VENDIDO]: Object.freeze([]),
  [ESTATUS.DESCARTADO]: Object.freeze([]),
});

/** ¿Se puede pasar de `desde` a `hacia`? */
export function puedeTransicionar(desde, hacia) {
  const destinos = TRANSICIONES[desde];
  return Array.isArray(destinos) && destinos.includes(hacia);
}

/** ¿El estatus es terminal (sin transiciones de salida)? */
export function esTerminal(estatus) {
  return estatus === ESTATUS.VENDIDO || estatus === ESTATUS.DESCARTADO;
}

/** Genera un UUID v4 con fallback seguro (crypto.randomUUID cuando está disponible). */
function generarUUID() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Valida los datos de un artículo (función pura).
 * @param {Object} [datos]
 * @returns {{ok: boolean, errores: Record<string,string>}}
 */
export function validarArticulo(datos = {}) {
  const errores = {};

  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  if (!nombre) errores.nombre = 'El nombre es obligatorio.';

  const precio = datos.precioSugerido;
  const num = Number(precio);
  if (precio === undefined || precio === null || precio === '') {
    errores.precioSugerido = 'El precio sugerido es obligatorio.';
  } else if (!Number.isFinite(num) || num <= 0) {
    errores.precioSugerido = 'El precio sugerido debe ser un número mayor a 0.';
  }

  return { ok: Object.keys(errores).length === 0, errores };
}

/**
 * Crea un artículo nuevo con defaults (función pura, con id/ahora inyectables para tests).
 * @param {Object} [datos]
 * @param {{id?: string, ahora?: number}} [opciones]
 */
export function crearArticulo(datos = {}, { id, ahora } = {}) {
  const articulo = {
    id: id ?? generarUUID(),
    fechaRegistro: ahora ?? Date.now(),
    estatus: ESTATUS.ALMACENADO,
    nombre: datos.nombre ?? '',
    descripcion: datos.descripcion ?? '',
    detalles: datos.detalles ?? '',
    precioSugerido: datos.precioSugerido ?? null,
  };
  if (datos.foto != null) articulo.foto = datos.foto;
  return articulo;
}
