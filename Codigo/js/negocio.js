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
export function generarUUID() {
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

/**
 * Filtra artículos por estatus. `null`/`'todos'` (o undefined) devuelve todos (copia).
 * Cualquier otro estatus devuelve solo los que coincidan; estatus inexistente → [].
 * @param {Array} articulos
 * @param {string|null} estatus
 */
export function filtrarArticulos(articulos, estatus) {
  const lista = Array.isArray(articulos) ? articulos : [];
  if (estatus == null || estatus === 'todos') return [...lista];
  return lista.filter((a) => a?.estatus === estatus);
}

/**
 * Devuelve una COPIA ordenada (no muta el original).
 * Soporta `precioSugerido` asc/desc y `fechaRegistro` (por defecto asc; usar 'desc' para
 * el orden de más reciente primero). Valores no numéricos ordenan como 0.
 * @param {Array} articulos
 * @param {{campo?: string, direccion?: 'asc'|'desc'}} [opciones]
 */
export function ordenarArticulos(articulos, { campo = 'precioSugerido', direccion = 'asc' } = {}) {
  const copia = Array.isArray(articulos) ? [...articulos] : [];
  const factor = direccion === 'desc' ? -1 : 1;
  return copia.sort((a, b) => {
    const an = Number.isFinite(Number(a?.[campo])) ? Number(a?.[campo]) : 0;
    const bn = Number.isFinite(Number(b?.[campo])) ? Number(b?.[campo]) : 0;
    return (an - bn) * factor;
  });
}

/**
 * Búsqueda case-insensitive (trim + lowercase) en `nombre`, `descripcion` y `detalles`.
 * Texto vacío devuelve todos (copia). Sin coincidencias devuelve [].
 * @param {Array} articulos
 * @param {string} texto
 */
export function buscarArticulos(articulos, texto) {
  const lista = Array.isArray(articulos) ? articulos : [];
  const q = typeof texto === 'string' ? texto.trim().toLowerCase() : '';
  if (!q) return [...lista];
  return lista.filter((a) => {
    return [a?.nombre, a?.descripcion, a?.detalles].some(
      (campo) => typeof campo === 'string' && campo.toLowerCase().includes(q)
    );
  });
}

/**
 * Marca un artículo como descartado. Devuelve un NUEVO objeto (no muta el original).
 * Lanza `Error` si el motivo está vacío o si el estatus ya es terminal.
 * @param {Object} articulo
 * @param {string} motivo
 * @param {{ahora?: number}} [opciones]
 */
export function descartarArticulo(articulo, motivo, { ahora } = {}) {
  if (!articulo || typeof articulo !== 'object') {
    throw new Error('Artículo inválido.');
  }
  if (typeof motivo !== 'string' || !motivo.trim()) {
    throw new Error('El motivo es obligatorio.');
  }
  if (esTerminal(articulo.estatus)) {
    throw new Error('No se puede descartar un artículo vendido o descartado.');
  }
  return {
    ...articulo,
    estatus: ESTATUS.DESCARTADO,
    motivoDescarte: motivo.trim(),
    fechaDescarte: ahora ?? Date.now(),
  };
}

/**
 * Marca un artículo como vendido y arma el registro de venta.
 * Valida: estatus activo (almacenado/en-venta), `lugarVenta` no vacío y `precioVenta > 0`.
 * Lanza `Error` ante cualquier validación fallida. Devuelve `{ articulo, venta }` sin mutar el original.
 * @param {Object} articulo
 * @param {{lugarVenta?: string, precioVenta?: number, vendidoAlPrecioSugerido?: boolean}} [datosVenta]
 * @param {{id?: string, ahora?: number}} [opciones]
 */
export function venderArticulo(articulo, datosVenta = {}, { id, ahora } = {}) {
  if (!articulo || typeof articulo !== 'object') {
    throw new Error('Artículo inválido.');
  }
  if (!puedeTransicionar(articulo.estatus, ESTATUS.VENDIDO)) {
    throw new Error('Solo se pueden vender artículos almacenados o en venta.');
  }

  const d = datosVenta || {};
  const lugarVenta = typeof d.lugarVenta === 'string' ? d.lugarVenta.trim() : '';
  if (!lugarVenta) {
    throw new Error('El lugar de venta es obligatorio.');
  }

  const precioVenta = Number(d.precioVenta);
  if (!Number.isFinite(precioVenta) || precioVenta <= 0) {
    throw new Error('El precio de venta debe ser mayor a 0.');
  }

  const fechaVenta = ahora ?? Date.now();
  const ventaId = id ?? generarUUID();
  const vendidoAlPrecioSugerido = Boolean(d.vendidoAlPrecioSugerido);

  const articuloVendido = {
    ...articulo,
    estatus: ESTATUS.VENDIDO,
    fechaVenta,
    ventaId,
  };

  const venta = {
    id: ventaId,
    articuloId: articulo.id,
    nombre: articulo.nombre,
    precioSugerido: articulo.precioSugerido,
    precioVenta,
    lugarVenta,
    vendidoAlPrecioSugerido,
    fechaVenta,
  };

  return { articulo: articuloVendido, venta };
}

/**
 * Formatea un timestamp a fecha legible en es-MX (dateStyle medium).
 * Devuelve '' para ts inválido, null o vacío.
 * @param {number|string|null|undefined} ts
 * @returns {string}
 */
export function formatearFecha(ts) {
  if (ts == null || ts === '') return '';
  const n = Number(ts);
  if (!Number.isFinite(n)) return '';
  const fecha = new Date(n);
  if (Number.isNaN(fecha.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(fecha);
  } catch {
    return '';
  }
}

/**
 * Resuelve el tema final a partir de la preferencia y si el sistema está en oscuro.
 * 'claro'/'oscuro' fuerzan ese valor; cualquier otro valor (p. ej. 'auto') usa sistemaOscuro.
 * @param {string} preferencia
 * @param {boolean} sistemaOscuro
 * @returns {'claro'|'oscuro'}
 */
export function resolverTema(preferencia, sistemaOscuro) {
  if (preferencia === 'claro') return 'claro';
  if (preferencia === 'oscuro') return 'oscuro';
  return sistemaOscuro ? 'oscuro' : 'claro';
}

/**
 * Suma numérica de `precioVenta` de una lista de ventas.
 * Los valores no numéricos se tratan como 0. Devuelve un número.
 * @param {Array} ventas
 * @returns {number}
 */
export function sumarVentas(ventas) {
  if (!Array.isArray(ventas)) return 0;
  return ventas.reduce((total, v) => {
    const n = Number(v?.precioVenta);
    return total + (Number.isFinite(n) ? n : 0);
  }, 0);
}
