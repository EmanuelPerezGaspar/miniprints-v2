// MiniPrints — mensajes de WhatsApp (ventas).
// Abre WhatsApp con el mensaje escrito; se elige el chat dentro de WhatsApp.
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

  function abrir(texto, telefono) {
    const tel = String(telefono || '').replace(/\D/g, '');
    const url = (tel ? `https://wa.me/52${tel}` : 'https://wa.me/') + '?text=' + encodeURIComponent(texto);
    const w = window.open(url, '_blank');
    if (!w) window.location.href = url;   // si el navegador bloquea la ventana nueva
  }

  window.MP_WA = { venta, abrir };
})();
