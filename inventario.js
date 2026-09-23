// MiniPrints — piezas compartidas de las pantallas de Inventario (Piezas y Material):
// hojas inferiores estilo iOS, escape de texto y aviso flotante.
(function () {
  const esc = t => String(t ?? '').replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[c]);

  let backdrop, abierta, opener;

  function ensureBackdrop() {
    if (backdrop) return;
    backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.hidden = true;
    backdrop.addEventListener('click', () => cerrar());
    document.body.append(backdrop);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && abierta) cerrar(); });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-sheet-close]')) cerrar();
    });
  }

  function abrir(id) {
    ensureBackdrop();
    if (abierta) cerrar(true);
    const s = document.getElementById(id);
    if (!s) return;
    opener = document.activeElement;
    abierta = s;
    s.hidden = backdrop.hidden = false;
    s.scrollTop = 0;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      s.classList.add('open');
      backdrop.classList.add('open');
    }));
  }

  function cerrar(inmediato) {
    const s = abierta;
    if (!s) return;
    abierta = null;
    s.classList.remove('open');
    backdrop.classList.remove('open');
    document.documentElement.style.overflow = '';
    const ocultar = () => { if (!s.classList.contains('open')) s.hidden = true; if (!abierta) backdrop.hidden = true; };
    if (inmediato) ocultar(); else setTimeout(ocultar, 420);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(t._t); t._t = setTimeout(() => t.style.display = 'none', 3200);
  }

  // Controles segmentados / chips con <select> oculto (mismo patrón que Cotizar y Ventas)
  function syncChips(root = document) {
    root.querySelectorAll('[data-for]').forEach(g => {
      const input = document.getElementById(g.dataset.for);
      if (!input) return;
      g.querySelectorAll('button[data-v]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === input.value)));
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-for] button[data-v]');
    if (!b) return;
    const input = document.getElementById(b.parentElement.dataset.for);
    if (!input) return;
    input.value = b.dataset.v;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    syncChips();
  });

  window.MP_INV = { esc, abrir, cerrar, toast, syncChips };
})();
