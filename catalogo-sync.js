// MiniPrints — aviso de existencias para el catálogo público.
//
// El catálogo vive en otra dirección y en OTRO proyecto de Firebase (miniprints-catalogo).
// Desde aquí solo se publica, para las piezas marcadas con "Mostrar en catálogo", una marca:
//   'ok' (hay piezas) · 'ultimas' (2 o menos) · 'agotado' (0)
// No se publican cantidades, precios, costos, ventas ni clientes. El proyecto del negocio
// (miniprints-v2) no cambia ni se abre al público.
(function () {
  // Se llena al crear el proyecto miniprints-catalogo (Firebase › Configuración del proyecto ›
  // Tus apps › Configuración del SDK). Mientras sea null, nada se conecta ni se publica.
  const CONFIG = null;

  const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const MARCAS = 'mp_catalogo';            // { "Turbo": true, … } (se sincroniza entre dispositivos)
  const HUELLA = 'mp_catalogo_huella';     // lo último que se publicó desde este dispositivo
  const PUBLICADO = 'mp_catalogo_publicado';
  const ULTIMAS = 2;

  const leer = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
  // Identificador con el que el catálogo encuentra la pieza: "Lavanda Punk" → "lavanda-punk"
  const slug = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const estadoDe = n => (Number(n) || 0) <= 0 ? 'agotado' : n <= ULTIMAS ? 'ultimas' : 'ok';
  const marcadas = () => { const m = leer(MARCAS, {}); return m && typeof m === 'object' ? Object.keys(m).filter(k => m[k]) : []; };
  function estados() {
    const piezas = leer('mp_piezas', {}) || {}, p = {};
    marcadas().sort().forEach(nombre => { const s = slug(nombre); if (s) p[s] = estadoDe(piezas[nombre]); });
    return p;
  }
  function marcar(nombre, si) {
    const m = leer(MARCAS, {}) || {};
    if (si) m[nombre] = true; else delete m[nombre];
    localStorage.setItem(MARCAS, JSON.stringify(m));
  }

  // ── Conexión con el proyecto del catálogo (solo si está configurado) ──
  let fb = null;
  async function cargar() {
    if (!CONFIG) throw Object.assign(new Error('sin-config'), { code: 'sin-config' });
    if (fb) return fb;
    const [{ initializeApp, getApps }, A, F] = await Promise.all([
      import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')]);
    const app = getApps().find(a => a.name === 'catalogo') || initializeApp(CONFIG, 'catalogo');
    const auth = A.initializeAuth(app, { persistence: [A.browserLocalPersistence, A.inMemoryPersistence] });
    const usuario = await new Promise(r => { let parar = null; parar = A.onAuthStateChanged(auth, u => { if (parar) parar(); r(u); }); });
    fb = { A, F, auth, db: F.getFirestore(app), usuario };
    return fb;
  }

  async function publicar(forzar) {
    const p = estados(), huella = JSON.stringify(p);
    if (!forzar && huella === localStorage.getItem(HUELLA)) return 'sin-cambios';
    const { F, db, auth } = await cargar();
    if (!auth.currentUser) return 'sin-sesion';
    await F.setDoc(F.doc(db, 'publico', 'estado'), { p, t: Date.now() });
    try { localStorage.setItem(HUELLA, huella); localStorage.setItem(PUBLICADO, String(Date.now())); } catch (e) {}
    window.dispatchEvent(new CustomEvent('mp-catalogo'));
    return 'ok';
  }
  let timer = null;
  function programar() {
    if (!CONFIG || !marcadas().length) return;
    clearTimeout(timer);
    timer = setTimeout(() => publicar(false).catch(e => console.warn('catálogo: no se publicó', e)), 1200);
  }

  // Cada vez que cambian las piezas o las marcas (venta, impresión, ajuste) se revisa si hay que publicar
  const prev = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) {
    prev.call(this, k, v);
    if (this === window.localStorage && (k === 'mp_piezas' || k === MARCAS)) programar();
  };
  window.addEventListener('mp-sync-update', programar);
  window.addEventListener('mp-sync-ready', programar);

  window.MP_CATALOGO = {
    configurado: !!CONFIG, ULTIMAS, slug, estadoDe, estados, marcadas, marcar,
    esta: nombre => !!(leer(MARCAS, {}) || {})[nombre],
    publicadoEn: () => Number(localStorage.getItem(PUBLICADO)) || 0,
    publicar,
    async sesion() { try { const { auth } = await cargar(); return auth.currentUser ? { email: auth.currentUser.email, uid: auth.currentUser.uid } : null; } catch (e) { return null; } },
    async conectar(email, clave) {
      const { A, auth } = await cargar();
      const r = await A.signInWithEmailAndPassword(auth, email, clave);
      try { localStorage.removeItem(HUELLA); } catch (e) {}
      await publicar(true);
      return { email: r.user.email, uid: r.user.uid };
    },
    async desconectar() { const { A, auth } = await cargar(); await A.signOut(auth); },
  };
})();
