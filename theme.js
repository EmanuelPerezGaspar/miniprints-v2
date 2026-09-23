// MiniPrints — tema claro/oscuro según el sistema.
// IOSC tiene los colores de iOS del tema activo para el código que pinta con JS
// (montos, alertas, íconos, gráficas). Si el sistema cambia de tema, se vuelve a pintar.
(function () {
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  const PALETTES = {
    dark: {
      green: '#30d158', red: '#ff453a', orange: '#ff9f0a', yellow: '#ffd60a', blue: '#0a84ff',
      purple: '#bf5af2', indigo: '#5e5ce6', teal: '#64d2ff', pink: '#ff6961',
      text: '#ffffff', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)',
      grid: 'rgba(84,84,88,0.45)', card: '#1c1c1e',
      tooltip: 'rgba(44,44,46,0.96)', tooltipText: 'rgba(235,235,245,0.85)', tooltipBorder: 'rgba(255,255,255,0.08)',
      // Gráficas: colores de relleno
      chartGreen: '#30d158', chartGreenSoft: 'rgba(48,209,88,0.38)', chartGreenRgb: '48,209,88', chartPurple: '#bf5af2',
    },
    light: {
      green: '#248a3d', red: '#d70015', orange: '#c93400', yellow: '#b25000', blue: '#0040dd',
      purple: '#8944ab', indigo: '#3634a3', teal: '#0071a4', pink: '#d30f45',
      text: '#000000', text2: 'rgba(60,60,67,0.6)', text3: 'rgba(60,60,67,0.3)',
      grid: 'rgba(60,60,67,0.18)', card: '#ffffff',
      tooltip: 'rgba(255,255,255,0.98)', tooltipText: 'rgba(60,60,67,0.85)', tooltipBorder: 'rgba(0,0,0,0.08)',
      chartGreen: '#34c759', chartGreenSoft: 'rgba(52,199,89,0.35)', chartGreenRgb: '52,199,89', chartPurple: '#af52de',
    },
  };

  const IOSC = window.IOSC = {};
  function apply() {
    const scheme = mq.matches ? 'light' : 'dark';
    Object.assign(IOSC, PALETTES[scheme], { scheme });
    document.documentElement.dataset.scheme = scheme;
  }
  apply();

  mq.addEventListener('change', () => {
    apply();
    window.dispatchEvent(new CustomEvent('mp-theme-change'));
    // Las páginas ya se vuelven a pintar con este evento
    window.dispatchEvent(new CustomEvent('mp-sync-update'));
  });
})();

// Transiciones entre pantallas (View Transitions entre documentos, iOS 18.2+).
// Entrar a una sección se desliza desde la derecha, regresar se desliza a la derecha
// y cambiar de pestaña hace un fundido suave. nav.js marca el tipo al tocar la barra.
(function () {
  const DEPTH = { 'historial-ventas.html': 1, 'cotizaciones.html': 1, 'finanzas.html': 1, 'reset.html': 1 };
  const pageOf = href => (new URL(href, location.href).pathname.split('/').pop() || 'index.html').toLowerCase();
  const here = pageOf(location.href);
  const ss = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} },
  };

  const recordarOrigen = () => ss.set('mp-vt-from', here);
  window.addEventListener('pageswap', recordarOrigen);
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a && a.origin === location.origin && !a.target) recordarOrigen();
  }, true);

  function tipo() {
    const marcado = ss.get('mp-vt');
    ss.set('mp-vt', null);
    if (marcado) return marcado;
    const d0 = DEPTH[ss.get('mp-vt-from')] || 0, d1 = DEPTH[here] || 0;
    return d1 > d0 ? 'push' : d1 < d0 ? 'back' : 'tab';
  }

  window.addEventListener('pagereveal', e => {
    if (!e.viewTransition) { ss.set('mp-vt', null); return; }
    const root = document.documentElement;
    root.dataset.vt = tipo();
    e.viewTransition.finished.finally(() => { delete root.dataset.vt; });
  });

  // Navegadores sin transiciones entre páginas: la pantalla entra con un fundido
  if (!document.startViewTransition) document.documentElement.classList.add('mp-enter');

  window.MP_VT = { marcar: t => ss.set('mp-vt', t) };
})();
