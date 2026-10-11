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

  // ── Reparto del dinero de una venta ──
  // Primero se recupera el costo (producción + empaque); la ganancia de la empresa llega hasta lo
  // cotizado; lo que la venta completa supere a lo cotizado (sobreprecio) se reparte: 50 % comisión
  // del vendedor y 50 % para la meta elegida en Inicio (si no hay, se queda en la empresa).
  // Abajo de lo cotizado se reduce la ganancia; el IVA (si la cotización lo llevaba) se aparta.
  const PARTE_VENDEDOR = 0.5;
  const itemsDe = v => v.items || [{ pieza: v.pieza, cantidad: v.cantidad, precio: v.precio }];
  function reparto(v, cache) {
    cache = cache || {};
    let C = 0, Q = 0, I = 0, V = 0, iva = 0, sin = 0, aprox = false;
    itemsDe(v).forEach(it => {
      const q = Number(it.cantidad) || 0;
      if (it.cv !== 2 && !(it.pieza in cache)) cache[it.pieza] = porPieza(it.pieza);
      const ref = it.cv === 2 ? it : cache[it.pieza];
      const prod = ref && (it.cv === 2 ? ref.costo : ref.produccion), cot = ref && ref.cotizado;
      if (!(prod > 0 && cot > 0) || !q) { sin += q; return; }
      if (it.cv !== 2) aprox = true;
      C += (prod + (Number(ref.empaque) || 0)) * q; Q += cot * q; I += (Number(ref.iva) || 0) * q;
      const venta = (Number(it.precio) || 0) * q;
      V += venta;
      iva += venta * (Number(ref.iva) || 0) / cot;        // la parte del precio que es IVA, pieza por pieza
    });
    if (!C) return { sin };
    const Vn = V - iva, Qn = Q - I;
    const recupera = Math.min(Vn, C);
    const ganancia = Vn >= Qn ? Qn - C : Vn - C;
    const sobre = Math.max(0, Vn - Qn);
    const comision = sobre * PARTE_VENDEDOR;
    return { C, Q, V, iva, recupera, ganancia, sobre, comision, paraMeta: sobre - comision, sin, aprox };
  }

  // Meta por evento que recibe la otra mitad del sobreprecio (solo una a la vez)
  function metaDeSobreprecio(metas) {
    metas = metas || leer('mp_metas_eventos', []);
    return (Array.isArray(metas) ? metas : []).find(m => m && m.recibeSobreprecio) || null;
  }
  const isoDe = x => { const m = String(x || '').match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : ''; };
  const pagada = v => !v.estatusPago || v.estatusPago === 'pagado';
  // Ventas ya cobradas a partir de una fecha (se excluyen al activar una meta: solo cuentan las siguientes)
  function cobradasDesde(fecha, ventas) {
    ventas = ventas || leer('mp_ventas', []);
    return (Array.isArray(ventas) ? ventas : []).filter(v => pagada(v) && (isoDe(v.fechaPago) || isoDe(v.fecha)) >= fecha).map(v => Number(v.id));
  }
  // Lo que las ventas cobradas desde que se activó le han aportado a esa meta
  function aportesVentas(meta, ventas) {
    if (!meta || !meta.recibeSobreprecio) return 0;
    ventas = ventas || leer('mp_ventas', []);
    const fuera = new Set((meta.excluir || []).map(Number));
    const cache = {};
    return (Array.isArray(ventas) ? ventas : []).reduce((s, v) => {
      const cobro = isoDe(v.fechaPago) || isoDe(v.fecha);
      if (!pagada(v) || !cobro || (meta.desde && cobro < meta.desde) || fuera.has(Number(v.id))) return s;
      return s + (reparto(v, cache).paraMeta || 0);
    }, 0);
  }

  window.MP_COSTOS = { desglose, porPieza, reparto, metaDeSobreprecio, aportesVentas, cobradasDesde, PARTE_VENDEDOR, r2 };
})();
