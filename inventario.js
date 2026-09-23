// MiniPrints — piezas compartidas de Inventario, Historiales y Finanzas:
// hojas inferiores estilo iOS, escape de texto, aviso flotante y fechas.
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

  // ── Fechas ──
  const MESES = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };
  const pad = n => String(n).padStart(2, '0');
  const isoDe = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hoy = () => isoDe(new Date());
  // Acepta "2026-09-23" o el formato viejo "23 sep 2026"
  function iso(fecha) {
    if (!fecha) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha.slice(0, 10);
    const p = String(fecha).toLowerCase().replace(/\./g, '').split(/[\s/-]+/);
    if (p.length >= 3 && MESES[p[1].slice(0, 3)]) return `${p[2]}-${pad(MESES[p[1].slice(0, 3)])}-${pad(p[0])}`;
    return '';
  }
  function diaLargo(f) {
    if (!f) return 'Sin fecha';
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    if (f === hoy()) return 'Hoy';
    if (f === isoDe(ayer)) return 'Ayer';
    const d = new Date(f + 'T12:00:00');
    const txt = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  const mesKey = f => (f || '').slice(0, 7);
  function mesNombre(key, corto) {
    const d = new Date(key + '-01T12:00:00');
    const t = d.toLocaleDateString('es-MX', corto ? { month: 'short' } : { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1).replace('.', '');
  }
  const money = n => '$' + parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = n => (n < 0 ? '−$' : '$') + Math.round(Math.abs(n || 0)).toLocaleString('es-MX');

  window.MP_INV = { esc, abrir, cerrar, toast, syncChips, fecha: { iso, isoDe, hoy, diaLargo, mesKey, mesNombre }, money, money0 };
})();
