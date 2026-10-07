// views/home.js — pantalla de inicio con accesos principales.
export const home = {
  title: 'Inicio',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view home';
    view.innerHTML = `
      <div class="home__brand">VentaCositas</div>
      <div class="home__tagline">Inventario offline de artículos a vender</div>
      <div class="home__actions">
        <a class="btn btn--primary" href="#/articulos">📦 Gestionar</a>
        <a class="btn btn--ghost" href="#/historial">🧾 Historial</a>
        <a class="btn btn--ghost" href="#/config">⚙️ Configuración</a>
      </div>
    `;
    container.appendChild(view);
  },
};
