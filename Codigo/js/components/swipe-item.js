// components/swipe-item.js — gesto swipe-izquierda con umbral que dispara un callback.
// Browser-only. Tras disparar, marca `el._swipeReciente` para que el click de apertura
// posterior (mismo toque) pueda ignorarse.

export function activarSwipe(el, { umbral = 80, onSwipe } = {}) {
  if (typeof window === 'undefined') return () => {};

  let startX = null;
  let startY = null;
  let deltaX = 0;
  let arrastrando = false;

  const reset = () => {
    el.style.transform = '';
  };

  const empezar = (x, y) => {
    startX = x;
    startY = y;
    deltaX = 0;
    arrastrando = false;
  };

  const mover = (x, y) => {
    if (startX == null) return;
    const dx = x - startX;
    const dy = y - startY;

    if (!arrastrando) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        arrastrando = true;
      } else {
        return;
      }
    }

    deltaX = Math.min(0, dx);
    el.style.transform = `translateX(${deltaX}px)`;
  };

  const terminar = () => {
    if (startX == null) return;
    const disparo = arrastrando && deltaX <= -umbral;
    if (disparo) {
      el._swipeReciente = true;
      window.setTimeout(() => {
        el._swipeReciente = false;
      }, 0);
      onSwipe?.(el);
    }
    startX = null;
    startY = null;
    deltaX = 0;
    arrastrando = false;
    reset();
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    empezar(e.clientX, e.clientY);
  };
  const onPointerMove = (e) => mover(e.clientX, e.clientY);
  const onPointerUp = terminar;
  const onPointerCancel = terminar;

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerCancel);

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', onPointerUp);
    el.removeEventListener('pointercancel', onPointerCancel);
    reset();
  };
}
