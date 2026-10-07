// MiniPrints — una sola definición de costos para toda la app (Cotizar, Cotizaciones, Inventario,
// Historial de ventas y Finanzas).
//   Costo de producción = costo base (material, luz, desgaste, mano de obra) + reserva por fallas
//   Ganancia de la empresa = margen de ganancia + recargo por urgencia
//   Empaque e IVA van aparte (el empaque es costo; el IVA no es dinero del negocio)
(function () {
  const leer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const FACTOR_URGENCIA = { express: 1.25, urgente: 1.5 };

  // Desglose de una cotización. Las cotizaciones nuevas guardan cada parte; en las anteriores
  // (solo costo base, ganancia, IVA y total) la diferencia se reparte en fallas (con el % configurado),
  // urgencia (según el tipo de entrega) y empaque (lo que sobre).
  function desglose(c) {
    const total = Number(c.total) || 0, base = Number(c.costo_base) || 0;
    const iva = Number(c.iva) || 0, margen = Number(c.ganancia) || 0;
    let falla, urgencia, empaque;
    if (c.falla != null) {
      falla = Number(c.falla) || 0; urgencia = Number(c.urgencia_monto) || 0; empaque = Number(c.empaque) || 0;
    } else {
      const pct = (Number((leer('mp_config', {}) || {}).falla) || 10) / 100;
      const resto = Math.max(0, total - iva - base - margen);
      falla = Math.min(resto, base * pct);
      urgencia = Math.min(resto - falla, (base + falla + margen) * ((FACTOR_URGENCIA[c.urgencia] || 1) - 1));
      empaque = Math.max(0, resto - falla - urgencia);
      // Centavos de redondeo: si lo que queda es menos de 50 ¢ no es empaque, es parte de las fallas
      if (empaque < 0.5) { falla += empaque; empaque = 0; }
    }
    return { base, falla, produccion: base + falla, margen, urgencia, ganancia: margen + urgencia, empaque, iva, total };
  }

  // Valores por pieza: de la cotización aceptada más reciente de esa pieza; si no hay, del registro
  // que guarda Cotizar al confirmar una impresión. null si la pieza nunca se cotizó.
  function porPieza(nombre, cots, costos) {
    cots = cots || leer('mp_cotizaciones', []);
    costos = costos || leer('mp_costos_piezas', {});
    let c = null;
    (Array.isArray(cots) ? cots : []).forEach(x => {
      if (x && x.fue_aceptada === true && x.pieza === nombre && Number(x.cantidad) > 0 && Number(x.total) > 0 && (!c || (x.id || 0) > (c.id || 0))) c = x;
    });
    if (c) {
      const d = desglose(c), n = Number(c.cantidad);
      return { produccion: r2(d.produccion / n), empaque: r2(d.empaque / n), iva: r2(d.iva / n), cotizado: r2(d.total / n), aprox: false };
    }
    const g = costos && costos[nombre];
    if (g && g.cotizado > 0) {
      // Registros anteriores guardaban solo el costo base (sin fallas): se marcan como aproximados
      return { produccion: Number(g.costo) || 0, empaque: Number(g.empaque) || 0, iva: Number(g.iva) || 0, cotizado: Number(g.cotizado), aprox: g.v !== 2 };
    }
    return null;
  }

  window.MP_COSTOS = { desglose, porPieza, r2 };
})();
