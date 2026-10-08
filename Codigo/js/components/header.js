// components/header.js — barra superior reutilizable (título, volver y acción derecha).
import { navegar } from '../router.js';

/**
 * Crea un `<header class="topbar">` para las vistas del shell.
 * @param {{titulo?: string, volver?: boolean, volverA?: string, accionDerecha?: Node|null}} [opciones]
 * @returns {HTMLElement}
 */
export function crearHeader({ titulo = '', volver = false, volverA = '/', accionDerecha = null } = {}) {
  const header = document.createElement('header');
  header.className = 'topbar';

  if (volver) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'topbar__back';
    back.setAttribute('aria-label', 'Volver');
    back.textContent = '←';
    back.addEventListener('click', () => navegar(volverA));
    header.appendChild(back);
  }

  const tituloEl = document.createElement('h1');
  tituloEl.className = 'topbar__titulo';
  tituloEl.textContent = titulo;
  header.appendChild(tituloEl);

  if (accionDerecha) {
    header.appendChild(accionDerecha);
  }

  return header;
}
