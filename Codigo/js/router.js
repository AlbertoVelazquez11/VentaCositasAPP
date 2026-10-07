// router.js — hash router (compatibilidad iOS Standalone, sin History API).

const rutas = new Map();

/**
 * Parsea un hash en { path, params }. Función pura: no lee location.
 * @param {string} [hash] hash crudo, ej. '#/articulos?id=3' o '/historial' o ''
 * @returns {{path: string, params: Record<string,string>}}
 */
export function parseHash(hash = '') {
  const raw = String(hash || '').replace(/^#/, '').trim() || '/';
  const [pathPart, queryPart] = raw.split('?');
  let path = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);

  const params = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => {
      params[k] = v;
    });
  }
  return { path, params };
}

/** Registra un handler ({ render(container, params) }) para una ruta. */
export function registrarRuta(path, handler) {
  rutas.set(path, handler);
}

/** Navega programáticamente a una ruta (actualiza el hash). */
export function navegar(path) {
  const hash = `#${String(path).replace(/^#/, '')}`;
  if (window.location.hash === hash) {
    render();
    return;
  }
  window.location.hash = hash;
}

/** Renderiza la vista correspondiente a la ruta actual. */
function render() {
  const { path, params } = parseHash(window.location.hash);
  const handler = rutas.get(path) || rutas.get('/');
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = '';
  try {
    if (handler && typeof handler.render === 'function') {
      handler.render(app, params);
    }
  } catch (e) {
    console.error('Error al renderizar la ruta:', path, e);
    app.innerHTML = `
      <div class="view">
        <div class="stub">
          <div class="stub__icon">⚠️</div>
          <div class="empty__title">Error</div>
          <p>No se pudo cargar esta pantalla.</p>
        </div>
      </div>`;
  }
  window.scrollTo(0, 0);
}

/** Arranca el router escuchando cambios de hash y renderiza la ruta inicial. */
export function iniciar() {
  window.addEventListener('hashchange', render);
  render();
}
