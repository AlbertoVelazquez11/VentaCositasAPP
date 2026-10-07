// app.js — bootstrap del shell: registra rutas, arranca el router y calienta IndexedDB.
import { iniciar, registrarRuta } from './router.js';
import { openDB } from './db.js';
import { home } from './views/home.js';
import { articulos } from './views/articulos.js';
import { config } from './views/config.js';

/** Placeholder de pantallas que llegan en sprints posteriores. */
function placeholder(titulo, icono, descripcion) {
  return {
    render(container) {
      const view = document.createElement('div');
      view.className = 'view';
      view.innerHTML = `
        <div class="stub">
          <div class="stub__icon">${icono}</div>
          <div class="empty__title">${titulo}</div>
          <p>${descripcion}</p>
          <span class="badge badge--neutral">Disponible en un sprint posterior</span>
        </div>
      `;
      container.appendChild(view);
    },
  };
}

// Rutas del shell.
registrarRuta('/', home);
registrarRuta('/articulos', articulos);
registrarRuta('/historial', placeholder('Historial', '🧾', 'Historial de ventas.'));
registrarRuta('/config', config);

// Calentar IndexedDB (no bloquea el arranque si no está disponible).
openDB().catch((e) => console.warn('IndexedDB no disponible:', e));

iniciar();
