// MiniPrints — mensajes de WhatsApp (ventas).
// Ventas y cotizaciones se envían con enviarAGrupo() según el modo elegido.
(function () {
  const fmt = n => '$' + parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function fechaLarga(iso) {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    if (!y || !m || !d) return iso || '';
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function venta(v) {
    const items = v.items || [{ pieza: v.pieza, cantidad: v.cantidad, precio: v.precio }];
    const total = items.reduce((s, it) => s + it.precio * it.cantidad, 0);
    const pagada = !v.estatusPago || v.estatusPago === 'pagado';
    let msg = '🧾 *Venta MiniPrints*\n';
    msg += `📅 ${fechaLarga(v.fecha)}\n\n`;
    items.forEach(it => { msg += `• ${it.cantidad} × ${it.pieza} — ${fmt(it.precio * it.cantidad)}\n`; });
    msg += `\n💰 *Total: ${fmt(total)}*\n`;
    msg += pagada ? `✅ Pagado${v.metodoPago ? ' · ' + v.metodoPago : ''}\n` : '⏳ Pago pendiente\n';
    if (v.notas) msg += `📝 ${v.notas}\n`;
    msg += '\n¡Gracias por tu compra! 🙌';
    return msg;
  }

  function abrirUrl(url) {
    const w = window.open(url, '_blank');
    if (!w) window.location.href = url;   // si el navegador bloquea la ventana nueva
  }

  // Abre WhatsApp con el texto escrito (a un número, o para elegir el chat)
  function abrir(texto, telefono) {
    const tel = String(telefono || '').replace(/\D/g, '');
    abrirUrl((tel ? `https://wa.me/52${tel}` : 'https://wa.me/') + '?text=' + encodeURIComponent(texto));
  }

  // ── Grupo fijo ───────────────────────────────────
  // WhatsApp no permite dejar un mensaje escrito en un grupo desde un enlace.
  // Por eso se copia el mensaje y se abre el grupo con su enlace de invitación;
  // solo falta pegar y enviar.
  const KEY = 'mp_wa_grupo';
  const RE_GRUPO = /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{10,}/;

  function grupo() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function guardarGrupo(link) {
    const l = String(link || '').trim();
    if (l && !RE_GRUPO.test(l)) return false;
    try { l ? localStorage.setItem(KEY, l) : localStorage.removeItem(KEY); } catch (e) { return false; }
    return true;
  }

  function copiar(texto) {
    let ok = false;
    try {   // copia síncrona: funciona en iOS dentro del mismo toque
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, texto.length);
      ok = document.execCommand('copy');
      ta.remove();
    } catch (e) {}
    try { navigator.clipboard && navigator.clipboard.writeText(texto).catch(() => {}); ok = true; } catch (e) {}
    return ok;
  }

  // Modo de envío:
  //  'escrito' (por defecto): WhatsApp se abre con el mensaje ya escrito y se elige el chat.
  //  'grupo': se copia el mensaje y se abre el grupo configurado; se pega y se envía.
  const KEY_MODO = 'mp_wa_modo';
  function modo() { try { return localStorage.getItem(KEY_MODO) === 'grupo' ? 'grupo' : 'escrito'; } catch (e) { return 'escrito'; } }
  function guardarModo(m) { try { localStorage.setItem(KEY_MODO, m === 'grupo' ? 'grupo' : 'escrito'); } catch (e) {} }

  // Devuelve 'grupo' si abrió el grupo (mensaje copiado) o 'elegir' si abrió con el mensaje escrito
  function enviarAGrupo(texto) {
    const g = grupo();
    if (modo() !== 'grupo' || !g) { abrir(texto); return 'elegir'; }
    copiar(texto);
    abrirUrl(g);
    return 'grupo';
  }

  window.MP_WA = { venta, abrir, grupo, guardarGrupo, modo, guardarModo, enviarAGrupo, copiar };
})();
