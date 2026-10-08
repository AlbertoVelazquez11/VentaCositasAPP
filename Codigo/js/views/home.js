// views/home.js — pantalla de inicio con accesos principales.
import { crearHeader } from '../components/header.js';

export const home = {
  title: 'Inicio',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view home';

    const accionConfig = document.createElement('a');
    accionConfig.className = 'topbar__accion';
    accionConfig.setAttribute('aria-label', 'Configuración');
    accionConfig.setAttribute('href', '#/config');
    accionConfig.textContent = '⚙️';

    const header = crearHeader({ accionDerecha: accionConfig });

    const brand = document.createElement('div');
    brand.className = 'home__brand';
    brand.textContent = 'VentaCositas';

    const tagline = document.createElement('div');
    tagline.className = 'home__tagline';
    tagline.textContent = 'Inventario offline de artículos a vender';

    const acciones = document.createElement('div');
    acciones.className = 'home__actions';
    acciones.innerHTML = `
      <a class="btn btn--primary" href="#/articulos">📦 Gestionar</a>
      <a class="btn btn--ghost" href="#/historial">🧾 Historial</a>
    `;

    view.append(header, brand, tagline, acciones);
    container.appendChild(view);
  },
};
