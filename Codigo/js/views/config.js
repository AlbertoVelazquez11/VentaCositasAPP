// views/config.js — placeholder mínimo de Configuración (Sprint 1).
export const config = {
  title: 'Configuración',
  render(container) {
    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <h1>Configuración</h1>
      <div class="stub">
        <div class="stub__icon">⚙️</div>
        <div class="empty__title">Opciones en construcción</div>
        <p>Las opciones de configuración llegan en un sprint posterior.</p>
      </div>
    `;
    container.appendChild(view);
  },
};
