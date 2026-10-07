// views/config.js — vista #/config: selector de tema + acerca de (Sprint 4).
import { resolverTema } from '../negocio.js';

const CLAVE_TEMA = 'ventacositas.tema';

const OPCIONES_TEMA = [
  { valor: 'auto', etiqueta: 'Auto' },
  { valor: 'claro', etiqueta: 'Claro' },
  { valor: 'oscuro', etiqueta: 'Oscuro' },
];

/** Lee la preferencia guardada; 'auto' como default. */
function leerPreferencia() {
  try {
    return localStorage.getItem(CLAVE_TEMA) || 'auto';
  } catch {
    return 'auto';
  }
}

/** ¿El sistema prefiere esquema oscuro? (false si no hay matchMedia). */
function sistemaOscuro() {
  try {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch {
    return false;
  }
}

/** Resuelve la preferencia, la aplica al <html> y la persiste. */
function aplicarTema(preferencia) {
  const resuelto = resolverTema(preferencia, sistemaOscuro());
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-tema', resuelto);
  }
  try {
    localStorage.setItem(CLAVE_TEMA, preferencia);
  } catch {
    // Persistencia no disponible (p. ej. modo privado): el atributo ya quedó aplicado.
  }
  return resuelto;
}

export const config = {
  title: 'Configuración',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view config';
    container.appendChild(view);

    const header = document.createElement('h1');
    header.textContent = 'Configuración';
    view.appendChild(header);

    // ── Tema ────────────────────────────────────────────────
    const temaSection = document.createElement('section');
    temaSection.className = 'config__section card';

    const temaTitulo = document.createElement('h2');
    temaTitulo.textContent = 'Tema';
    temaSection.appendChild(temaTitulo);

    const temaDesc = document.createElement('p');
    temaDesc.textContent = 'Elegí cómo se ve la app.';
    temaSection.appendChild(temaDesc);

    const segmented = document.createElement('div');
    segmented.className = 'segmented';
    segmented.setAttribute('role', 'group');
    segmented.setAttribute('aria-label', 'Tema');

    const botones = OPCIONES_TEMA.map((op) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'segmented__item';
      b.textContent = op.etiqueta;
      b.addEventListener('click', () => {
        aplicarTema(op.valor);
        pintar();
      });
      segmented.appendChild(b);
      return { el: b, valor: op.valor };
    });
    temaSection.appendChild(segmented);

    function pintar() {
      const activa = leerPreferencia();
      for (const { el, valor } of botones) {
        const on = valor === activa;
        el.classList.toggle('segmented__item--active', on);
        el.setAttribute('aria-pressed', String(on));
      }
    }

    pintar();
    view.appendChild(temaSection);

    // ── Acerca de ───────────────────────────────────────────
    const acercaSection = document.createElement('section');
    acercaSection.className = 'config__section card';

    const acercaTitulo = document.createElement('h2');
    acercaTitulo.textContent = 'Acerca de';
    acercaSection.appendChild(acercaTitulo);

    const nombre = document.createElement('div');
    nombre.className = 'config__app-nombre';
    nombre.textContent = 'VentaCositas';
    acercaSection.appendChild(nombre);

    const version = document.createElement('div');
    version.className = 'config__version';
    version.textContent = 'Versión 1.0.0';
    acercaSection.appendChild(version);

    const descripcion = document.createElement('p');
    descripcion.className = 'config__descripcion';
    descripcion.textContent = 'Inventario offline de artículos a vender.';
    acercaSection.appendChild(descripcion);

    view.appendChild(acercaSection);

    // Aplica la preferencia guardada al cargar la vista.
    aplicarTema(leerPreferencia());
  },
};
