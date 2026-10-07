// components/toast.js — toast efímero de confirmación. Browser-only.

export function mostrarToast(mensaje, { duracion = 2500, tipo = 'success' } = {}) {
  if (typeof document === 'undefined') return null;

  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  el.setAttribute('role', 'status');
  el.textContent = mensaje;

  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--visible'));

  window.setTimeout(() => {
    el.classList.remove('toast--visible');
    window.setTimeout(() => el.remove(), 300);
  }, duracion);

  return el;
}
