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
