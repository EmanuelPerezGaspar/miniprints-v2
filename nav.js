// MiniPrints — menú estilo iOS: tab bar flotante + hoja "Más"
(function () {
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const ICONS = {
    inicio:     '<path class="i-fill" d="M3.5 10.2 12 3.5l8.5 6.7V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path class="i-cut" d="M9.5 20.5v-5.5h5v5.5"/>',
    cotizar:    '<rect class="i-fill" x="4.5" y="2.5" width="15" height="19" rx="3"/><path class="i-cut" d="M8 7h8M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M8.5 18h.01M12 18h.01M15.5 15v3"/>',
    ventas:     '<path class="i-fill" d="M5.2 8h13.6l-1 11.6a1.5 1.5 0 0 1-1.5 1.4H7.7a1.5 1.5 0 0 1-1.5-1.4z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    inventario: '<path class="i-fill" d="M12 2.8 20.2 7.2v9.6L12 21.2l-8.2-4.4V7.2z"/><path class="i-cut" d="M3.8 7.2 12 11.6l8.2-4.4M12 11.6v9.6"/>',
    mas:        '<circle class="i-fill" cx="12" cy="12" r="9"/><path class="i-cut" d="M7.8 12h.01M12 12h.01M16.2 12h.01" stroke-width="2.4"/>',
  };

  const TABS = [
    { id: 'inicio',     label: 'Inicio',     href: 'dashboard.html',   pages: ['dashboard.html', 'index.html', ''] },
    { id: 'cotizar',    label: 'Cotizar',    href: 'cotizador.html',   pages: ['cotizador.html'] },
    { id: 'ventas',     label: 'Ventas',     href: 'ventas.html',      pages: ['ventas.html', 'historial-ventas.html'] },
    { id: 'inventario', label: 'Inventario', href: 'stock-piezas.html', pages: ['stock-piezas.html', 'stock-material.html'] },
    { id: 'mas',        label: 'Más',        pages: ['cotizaciones.html', 'finanzas.html', 'reset.html'] },
  ];

  const SHEET_ICONS = {
    ventas:    '<path d="M5.2 8h13.6l-1 11.6a1.5 1.5 0 0 1-1.5 1.4H7.7a1.5 1.5 0 0 1-1.5-1.4z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    historial: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    finanzas:  '<path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/>',
    piezas:    '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    material:  '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.5"/>',
    bloquear:  '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    reset:     '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    salir:     '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l5-5-5-5M15 12H4"/>',
  };

  const SECTIONS = [
    { label: 'Negocio', rows: [
      { href: 'historial-ventas.html', icon: 'ventas', color: '#30d158', title: 'Historial de ventas', sub: 'Ventas registradas y cobros' },
      { href: 'cotizaciones.html',   icon: 'historial', color: '#0a84ff', title: 'Historial de cotizaciones', sub: 'Cotizaciones guardadas' },
      { href: 'finanzas.html',       icon: 'finanzas',  color: '#5e5ce6', title: 'Finanzas', sub: 'Ingresos, costos y ganancia' },
    ]},
    { label: 'Inventario', rows: [
      { href: 'stock-piezas.html',   icon: 'piezas',    color: '#ff9f0a', title: 'Piezas terminadas', sub: 'Stock listo para vender' },
      { href: 'stock-material.html', icon: 'material',  color: '#bf5af2', title: 'Filamentos y material', sub: 'Rollos y gramos disponibles' },
    ]},
    { label: 'Cuenta', rows: [
      { action: 'lock',              icon: 'salir',      color: '#8e8e93', title: 'Cerrar sesión', sub: 'Salir de tu cuenta en este dispositivo' },
      { href: 'reset.html',          icon: 'reset',     color: '#ff453a', title: 'Restablecer datos', sub: 'Borrar la información guardada', danger: true },
    ]},
  ];

  const svg = (inner, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${inner}</svg>`;
  const CHEVRON = '<svg class="sheet-chev" viewBox="0 0 8 14" aria-hidden="true"><path d="M1 1l6 6-6 6"/></svg>';

  const activeTab = TABS.find(t => t.pages.includes(page));
  const marcarVT = t => window.MP_VT && MP_VT.marcar(t);

  /* ── Tab bar ──────────────────────────────────────── */
  function buildTabbar() {
    const nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.setAttribute('aria-label', 'Navegación principal');
    nav.innerHTML = `<div class="tabbar-glass"><div class="tab-bubble no-anim"></div>${
      TABS.map(t => {
        const current = t === activeTab ? ' aria-current="page"' : '';
        const inner = svg(ICONS[t.id]) + `<span>${t.label}</span>`;
        return t.href
          ? `<a class="tab" data-tab="${t.id}" href="${t.href}"${current}>${inner}</a>`
          : `<button class="tab" type="button" data-tab="${t.id}" aria-haspopup="dialog"${current}>${inner}</button>`;
      }).join('')
    }</div>`;
    document.body.appendChild(nav);

    const bubble = nav.querySelector('.tab-bubble');
    function moveBubble(tabEl) {
      if (!tabEl) { bubble.style.opacity = '0'; return; }
      bubble.style.opacity = '1';
      bubble.style.left  = tabEl.offsetLeft + 'px';
      bubble.style.width = tabEl.offsetWidth + 'px';
    }
    const currentEl = () => nav.querySelector('.tab.is-open') || nav.querySelector('.tab[aria-current="page"]');
    moveBubble(currentEl());
    requestAnimationFrame(() => requestAnimationFrame(() => bubble.classList.remove('no-anim')));

    new ResizeObserver(() => moveBubble(currentEl())).observe(nav);
    document.fonts && document.fonts.ready.then(() => moveBubble(currentEl()));

    nav.querySelectorAll('a.tab').forEach(a => a.addEventListener('click', () => { moveBubble(a); marcarVT('tab'); }));
    nav.querySelector('[data-tab="mas"]').addEventListener('click', e => openSheet(e.currentTarget));

    // Compactar al bajar, expandir al subir
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 8) return;
      nav.classList.toggle('is-compact', y > lastY && y > 80);
      lastY = y;
    }, { passive: true });
    nav.addEventListener('transitionend', e => { if (e.propertyName === 'width') moveBubble(currentEl()); });

    return { nav, moveBubble, currentEl };
  }

  /* ── Selector Piezas / Material en Inventario ─────── */
  function buildSegmented() {
    if (page !== 'stock-piezas.html' && page !== 'stock-material.html') return;
    const main = document.querySelector('.dash-main');
    if (!main) return;
    const seg = document.createElement('nav');
    seg.className = 'ios-segmented';
    seg.setAttribute('aria-label', 'Tipo de inventario');
    seg.innerHTML = [['stock-piezas.html', 'Piezas'], ['stock-material.html', 'Material']]
      .map(([href, label]) => `<a href="${href}"${href === page ? ' aria-current="page"' : ''}>${label}</a>`).join('');
    seg.addEventListener('click', e => { if (e.target.closest('a')) marcarVT('seg'); });
    main.prepend(seg);
  }

  /* ── Hoja "Más" ───────────────────────────────────── */
  let sheet, backdrop, opener, tabbar;

  function buildSheet() {
    backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.hidden = true;

    sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.hidden = true;
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'sheet-title');
    sheet.innerHTML = `
      <div class="sheet-head">
        <h2 id="sheet-title">Más</h2>
        <button class="sheet-close" type="button" aria-label="Cerrar"><svg viewBox="0 0 12 12"><path d="M1 1l10 10M11 1 1 11"/></svg></button>
      </div>
      ${SECTIONS.map(s => `
        <div class="sheet-label">${s.label}</div>
        <div class="sheet-group">${s.rows.map(r => {
          const current = r.href === page;
          const cls = `sheet-row${r.danger ? ' danger' : ''}${current ? ' is-current' : ''}`;
          const body = `<span class="sheet-icon" style="background:${r.color}">${svg(SHEET_ICONS[r.icon])}</span>
            <span class="sheet-row-body">
              <span class="sheet-row-text"><span class="sheet-row-title">${r.title}</span>
                <span class="sheet-row-sub">${current ? 'Aquí estás' : r.sub}</span></span>
              ${r.href ? CHEVRON : ''}
            </span>`;
          return r.href
            ? `<a class="${cls}" href="${r.href}"${current ? ' aria-current="page"' : ''}>${body}</a>`
            : `<button class="${cls}" type="button" data-action="${r.action}">${body}</button>`;
        }).join('')}</div>`).join('')}
      <div class="sheet-foot" id="sheet-foot">MiniPrints</div>`;

    document.body.append(backdrop, sheet);

    // Ir a una pantalla de la barra desde la hoja cuenta como cambio de pestaña
    sheet.querySelectorAll('a.sheet-row').forEach(a => a.addEventListener('click', () => {
      if (TABS.some(t => t.href === a.getAttribute('href'))) marcarVT('tab');
    }));
    backdrop.addEventListener('click', closeSheet);
    sheet.querySelector('.sheet-close').addEventListener('click', closeSheet);
    const cuenta = window.MP_AUTH && MP_AUTH.usuario;
    if (cuenta && cuenta.email) sheet.querySelector('[data-action="lock"] .sheet-row-sub').textContent = cuenta.email;
    sheet.querySelector('[data-action="lock"]').addEventListener('click', () => {
      if (!confirm('¿Cerrar sesión en este dispositivo? Tus datos siguen guardados en tu cuenta.')) return;
      if (window.MP_AUTH) return MP_AUTH.salir();
      location.reload();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !sheet.hidden) closeSheet();
      if (e.key === 'Tab' && !sheet.hidden) trapFocus(e);
    });
    enableDragToClose();
  }

  function trapFocus(e) {
    const f = sheet.querySelectorAll('a, button');
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // Versión y estado de sincronización al pie de la hoja
  const VERSION = ((document.querySelector('script[src*="nav.js"]') || {}).src || '').split('v=')[1] || '—';
  function pintarPie() {
    const S = window.MP_SYNC || {};
    let pend = false;
    try { pend = !!localStorage.getItem('mp_sync_pendiente'); } catch (_) {}
    const txt = { ok: 'al día', none: 'al día', connecting: 'conectando', error: 'error', denied: 'sin permiso', local: 'sin conexión', inicio: 'iniciando' }[S.estado] || S.estado || '—';
    sheet.querySelector('#sheet-foot').innerHTML = `MiniPrints · versión ${VERSION}<br>Sincronización: ${txt}${pend ? ' · cambios sin subir' : ''}`
      + `${S.subida ? ' · última subida ' + S.subida : ''}${S.error ? '<br>Error: ' + String(S.error).replace(/[<>&]/g, '') : ''}`;
  }

  function openSheet(btn) {
    if (!sheet) buildSheet();
    pintarPie();
    opener = btn;
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    tabbar.moveBubble(btn);
    sheet.hidden = backdrop.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      sheet.classList.add('open');
      backdrop.classList.add('open');
    }));
    setTimeout(() => sheet.querySelector('.sheet-close').focus({ preventScroll: true }), 50);
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('open', 'dragging');
    sheet.style.transform = '';
    backdrop.classList.remove('open');
    backdrop.style.opacity = '';
    document.documentElement.style.overflow = '';
    if (opener) {
      opener.classList.remove('is-open');
      opener.setAttribute('aria-expanded', 'false');
      tabbar.moveBubble(tabbar.currentEl());
      opener.focus({ preventScroll: true });
    }
    setTimeout(() => { if (!sheet.classList.contains('open')) sheet.hidden = backdrop.hidden = true; }, 450);
  }

  // Arrastrar hacia abajo para cerrar (solo móvil)
  function enableDragToClose() {
    let startY = null, dy = 0;
    sheet.addEventListener('touchstart', e => {
      if (window.innerWidth >= 900 || sheet.scrollTop > 0) return;
      startY = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (startY === null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      if (dy > 0) {
        sheet.classList.add('dragging');
        sheet.style.transform = `translateY(${dy}px)`;
        backdrop.style.opacity = String(Math.max(0, 1 - dy / 400));
      }
    }, { passive: true });
    sheet.addEventListener('touchend', () => {
      if (startY === null) return;
      startY = null;
      sheet.classList.remove('dragging');
      if (dy > 110) closeSheet();
      else { sheet.style.transform = ''; backdrop.style.opacity = ''; }
    });
  }

  /* ── Texto siempre en MAYÚSCULAS ───────────────────
     Todo lo que se escribe en campos de texto se guarda en mayúsculas, para que
     no haya registros mezclados. No aplica a correo, contraseña, enlaces ni a
     campos marcados con data-sin-mayus (por ejemplo, el JSON de importación). */
  const esTexto = el => el && !el.hasAttribute('data-sin-mayus') && !el.readOnly &&
    (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && ['text', 'search', ''].includes((el.getAttribute('type') || '').toLowerCase())));
  document.addEventListener('focusin', e => {
    if (esTexto(e.target)) e.target.setAttribute('autocapitalize', 'characters');
  });
  document.addEventListener('input', e => {
    const el = e.target;
    if (!esTexto(el) || e.isComposing) return;
    const v = el.value, up = v.toLocaleUpperCase('es-MX');
    if (v === up) return;
    const ini = el.selectionStart, fin = el.selectionEnd;
    el.value = up;
    try { el.setSelectionRange(ini, fin); } catch (_) {}
  }, true);
  document.addEventListener('compositionend', e => {
    if (esTexto(e.target)) e.target.dispatchEvent(new Event('input', { bubbles: true }));
  });

  function init() {
    tabbar = buildTabbar();
    buildSegmented();
  }

  // nav.js se carga al final del <body>: se construye ya, para que la barra exista
  // en el primer cuadro y la transición entre páginas la deje fija
  document.body && document.querySelector('.dash-main') ? init()
    : document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
