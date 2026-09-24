// MiniPrints v2 — sincronización entre dispositivos (Firebase Firestore)

const firebaseConfig = {
  apiKey: "AIzaSyC64TanRR3eG1X5X7lUEoVjLTQGSRZr3Vg",
  authDomain: "miniprints-v2.firebaseapp.com",
  projectId: "miniprints-v2",
  storageBucket: "miniprints-v2.firebasestorage.app",
  messagingSenderId: "688525548823",
  appId: "1:688625548823:web:984352167469cba3402652"
};

// Solo la cuenta autorizada puede leer y escribir (lo exigen las reglas de Firestore);
// este archivo ya no guarda ningún PIN ni contraseña.
const SYNC_KEYS = ['mp_config','mp_materials','mp_piezas','mp_ventas','mp_cotizaciones','mp_historial','mp_templates','mp_meta_mensual','mp_categorias','mp_wa_grupo','mp_wa_modo'];

const _origSetItem = localStorage.setItem.bind(localStorage);
let applyingRemote    = false;
let pushTimer         = null;
let _schedulePush     = () => {};
let _pendingLocalWrite  = false;
let _lastLocalWriteTime = 0;
const AUTH_FLAG = 'mp_auth_ok';

// Badge visible de estado — ayuda a diagnosticar en iPad sin acceso a consola
function syncBadge(state) {
  let el = document.getElementById('mp-sync-badge');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mp-sync-badge';
    el.style.cssText = [
      'position:fixed', 'bottom:72px', 'right:16px', 'z-index:9998',
      'font-size:0.68rem', 'font-weight:700', 'padding:4px 10px',
      'border-radius:20px', 'pointer-events:none', 'transition:opacity 0.4s',
      'font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",system-ui,sans-serif'
    ].join(';');
    document.body.appendChild(el);
  }
  clearTimeout(el._t);
  el.style.opacity = '1';
  const cfg = {
    connecting: ['#2c2c2e','#aeaeb2','#3a3a3c', '⟳ Conectando...', 0],
    ok:         ['#052e16','#30d158','#166534', '✓ Guardado',       3000],
    error:      ['#450a0a','#ff6961','#7f1d1d', '⚠ Error de sync',  0],
    local:      ['#1c1917','#78716c','#292524', '● Modo local',     5000],
    denied:     ['#450a0a','#ff6961','#7f1d1d', '⚠ Sin permiso',   0],
  }[state];
  if (!cfg) { el.style.opacity = '0'; return; }
  el.style.background = cfg[0];
  el.style.color       = cfg[1];
  el.style.border      = `1px solid ${cfg[2]}`;
  el.textContent       = cfg[3];
  if (cfg[4]) el._t = setTimeout(() => { el.style.opacity = '0'; }, cfg[4]);
}

localStorage.setItem = function (key, value) {
  _origSetItem(key, value);
  if (!applyingRemote && SYNC_KEYS.includes(key)) {
    _pendingLocalWrite  = true;
    _lastLocalWriteTime = Date.now();
    _schedulePush();
  }
};

function applyRemoteData(data) {
  applyingRemote = true;
  SYNC_KEYS.forEach(k => { if (data && data[k] != null) _origSetItem(k, data[k]); });
  applyingRemote = false;
  window.dispatchEvent(new CustomEvent('mp-sync-update'));
}

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';

// ── Pantalla de inicio de sesión ──────────────────
const ERRORES = {
  'auth/invalid-credential':     'Correo o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
  'auth/wrong-password':         'Correo o contraseña incorrectos.',
  'auth/user-not-found':         'Correo o contraseña incorrectos.',
  'auth/invalid-email':          'Ese correo no es válido.',
  'auth/missing-password':       'Escribe tu contraseña.',
  'auth/too-many-requests':      'Demasiados intentos. Espera unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
  'auth/operation-not-allowed':  'El inicio de sesión con correo no está activado en Firebase.',
  'auth/user-disabled':          'Esta cuenta está desactivada.',
};
const errorDe = e => ERRORES[e && e.code] || 'No se pudo iniciar sesión. Intenta de nuevo.';

// Una sola pantalla con tres estados: conectando, error (con reintentar) y formulario
function pantallaAcceso() {
  let el = document.getElementById('mp-login');
  if (!el) {
    el = document.createElement('div');
    el.id = 'mp-login';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'mp-login-t');
    el.innerHTML = `
      <form class="auth-card" novalidate>
        <img class="auth-icon" src="icon-180.png" alt="" width="72" height="72" />
        <h1 id="mp-login-t">MiniPrints</h1>
        <p class="auth-sub" id="mp-login-sub">Conectando…</p>
        <div class="auth-fields" hidden>
          <input id="mp-login-email" type="email" inputmode="email" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Correo" aria-label="Correo" required />
          <input id="mp-login-pass" type="password" autocomplete="current-password" placeholder="Contraseña" aria-label="Contraseña" required />
        </div>
        <p class="auth-msg" id="mp-login-msg" role="alert"></p>
        <button class="auth-btn" type="submit" id="mp-login-btn" hidden>Iniciar sesión</button>
        <button class="auth-link" type="button" id="mp-login-olvide" hidden>¿Olvidaste tu contraseña?</button>
      </form>`;
    (document.body || document.documentElement).appendChild(el);
  }
  document.documentElement.style.overflow = 'hidden';
  const $ = id => el.querySelector('#' + id);
  const aviso = (t, ok) => { $('mp-login-msg').textContent = t || ''; $('mp-login-msg').classList.toggle('is-ok', !!ok); };
  const verFormulario = v => {
    el.querySelector('.auth-fields').hidden = !v;
    $('mp-login-olvide').hidden = !v;
    $('mp-login-btn').hidden = false;
  };
  return {
    cargando() {
      $('mp-login-sub').textContent = 'Conectando…';
      el.querySelector('.auth-fields').hidden = true;
      $('mp-login-btn').hidden = true; $('mp-login-olvide').hidden = true; aviso('');
    },
    error(texto) {
      $('mp-login-sub').textContent = 'No se pudo conectar.';
      el.querySelector('.auth-fields').hidden = true; $('mp-login-olvide').hidden = true;
      aviso(texto);
      const btn = $('mp-login-btn');
      btn.hidden = false; btn.disabled = false; btn.textContent = 'Reintentar';
      btn.onclick = e => { e.preventDefault(); location.reload(); };
    },
    pedir(api) {
      return new Promise(resolve => {
        $('mp-login-sub').textContent = 'Inicia sesión para ver tu negocio.';
        verFormulario(true); aviso('');
        const btn = $('mp-login-btn'), email = $('mp-login-email'), pass = $('mp-login-pass');
        btn.textContent = 'Iniciar sesión'; btn.disabled = false; btn.onclick = null;
        el.querySelector('form').onsubmit = async e => {
          e.preventDefault();
          if (!email.value.trim() || !pass.value) return aviso('Escribe tu correo y contraseña.');
          btn.disabled = true; btn.textContent = 'Entrando…'; aviso('');
          try {
            const cred = await api.signInWithEmailAndPassword(api.auth, email.value.trim(), pass.value);
            el.remove();
            document.documentElement.style.overflow = '';
            resolve(cred.user);
          } catch (err) {
            aviso(errorDe(err));
            btn.disabled = false; btn.textContent = 'Iniciar sesión';
            pass.select();
          }
        };
        $('mp-login-olvide').onclick = async () => {
          if (!email.value.trim()) { aviso('Escribe tu correo y vuelve a tocar aquí.'); email.focus(); return; }
          try {
            await api.sendPasswordResetEmail(api.auth, email.value.trim());
            aviso('Si el correo está registrado, te llegará un enlace para cambiar la contraseña.', true);
          } catch (err) { aviso(errorDe(err)); }
        };
        setTimeout(() => email.focus(), 200);
      });
    },
  };
}

// Evita que un paso de red o de almacenamiento se quede esperando para siempre
const conTiempo = (promesa, ms, codigo) => Promise.race([
  promesa,
  new Promise((_, rej) => setTimeout(() => { const e = new Error(codigo); e.code = codigo; rej(e); }, ms)),
]);

// Cerrar sesión: se borra la copia local (sin sincronizar el borrado) y se vuelve a pedir acceso
let _salir = null;
window.MP_AUTH = {
  salir() {
    if (_salir) return _salir();
    localStorage.removeItem(AUTH_FLAG);
    location.reload();
  },
  usuario: null,
};

// ── Arranque ──────────────────────────────────────
let _listo = false;
function listo() {
  if (_listo) return;
  _listo = true;
  window.dispatchEvent(new CustomEvent('mp-sync-ready'));
}

async function iniciar() {
  // Si ya iniciaste sesión en este dispositivo, la app se muestra al momento con los datos
  // guardados; la sesión se confirma en segundo plano.
  const recordado = localStorage.getItem(AUTH_FLAG) === '1';
  const pantalla = recordado ? null : pantallaAcceso();
  if (recordado) listo(); else pantalla.cargando();
  syncBadge('connecting');

  try {
    const [{ initializeApp }, A, { getFirestore, doc, getDoc, setDoc, onSnapshot }] = await conTiempo(
      Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js')]),
      20000, 'sin-conexion');
    const app = initializeApp(firebaseConfig);
    // La sesión se guarda en localStorage: en Safari de iPhone IndexedDB puede quedarse colgado
    const auth = A.initializeAuth(app, { persistence: [A.browserLocalPersistence, A.inMemoryPersistence] });
    let user = await conTiempo(new Promise(resolve => {
      let parar = null;
      parar = A.onAuthStateChanged(auth, u => { if (parar) parar(); resolve(u); });
    }), 15000, 'auth-lento');

    _salir = async () => {
      try { await A.signOut(auth); } catch (_) {}
      localStorage.removeItem(AUTH_FLAG);
      SYNC_KEYS.forEach(k => localStorage.removeItem(k));
      location.replace('dashboard.html');
    };

    if (user && user.isAnonymous) { try { await A.signOut(auth); } catch (_) {} user = null; }
    if (!user) {
      localStorage.removeItem(AUTH_FLAG);
      syncBadge('none');
      user = await (pantalla || pantallaAcceso()).pedir({ auth, signInWithEmailAndPassword: A.signInWithEmailAndPassword, sendPasswordResetEmail: A.sendPasswordResetEmail });
    }
    _origSetItem(AUTH_FLAG, '1');
    window.MP_AUTH.usuario = { email: user.email, uid: user.uid };
    window.dispatchEvent(new CustomEvent('mp-auth', { detail: window.MP_AUTH.usuario }));
    listo();
    syncBadge('connecting');
    iniciarSync({ doc: doc(getFirestore(app), 'negocio', 'data'), getDoc, setDoc, onSnapshot });

    // Si la sesión se cierra en otro lado (o se revoca), se vuelve a pedir acceso
    A.onAuthStateChanged(auth, u => { if (!u) window.MP_AUTH.salir(); });
  } catch (e) {
    console.error('MiniPrints: no se pudo iniciar', e);
    if (recordado) { syncBadge('local'); return; }
    const sinRed = e && (e.code === 'sin-conexion' || e.code === 'auth/network-request-failed' || /fetch|import|network/i.test(e.message || ''));
    const motivo = sinRed ? 'Revisa tu conexión a internet.'
      : e && e.code === 'auth-lento' ? 'El servicio tardó demasiado en responder.'
      : 'Detalle: ' + ((e && (e.code || e.message)) || 'desconocido');
    pantalla.error(motivo);
  }
}

function iniciarSync({ doc: docRef, getDoc, setDoc, onSnapshot }) {
  // Push con reintentos — si falla por red lo intenta hasta 3 veces
  async function executeSetDoc(payload) {
    for (let i = 0; i < 3; i++) {
      try {
        await setDoc(docRef, payload, { merge: true });
        syncBadge('ok');
        return;
      } catch (e) {
        if (e && e.code === 'permission-denied') { console.error('mp sync: sin permiso', e); syncBadge('denied'); return; }
        if (i === 2) { console.error('mp sync push error', e); syncBadge('error'); }
        else await new Promise(r => setTimeout(r, 800 * (i + 1)));
      }
    }
  }

  function flushPush() {
    clearTimeout(pushTimer);
    _pendingLocalWrite = false;
    const payload = {};
    SYNC_KEYS.forEach(k => { payload[k] = localStorage.getItem(k); });
    executeSetDoc(payload);
  }

  _schedulePush = () => { clearTimeout(pushTimer); pushTimer = setTimeout(flushPush, 150); };

  document.addEventListener('visibilitychange', () => { if (document.hidden && _pendingLocalWrite) flushPush(); });
  window.addEventListener('pagehide', () => { if (_pendingLocalWrite) flushPush(); });

  // BFCache: al restaurar página desde caché en iOS, refrescar datos
  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      getDoc(docRef).then(s => {
        if (s.exists() && Date.now() - _lastLocalWriteTime > 2000) applyRemoteData(s.data());
      }).catch(() => {});
    }
  });

  (async () => {
    try {
      const snap = await getDoc(docRef);
      if (_pendingLocalWrite) {
        // Cambios locales hechos mientras se confirmaba la sesión — subirlos ahora
        flushPush();
      } else if (snap.exists() && Date.now() - _lastLocalWriteTime > 2000) {
        applyRemoteData(snap.data());
        syncBadge('ok');
      } else if (!snap.exists()) {
        const initial = {};
        SYNC_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) initial[k] = v; });
        await setDoc(docRef, initial);
        syncBadge('ok');
      } else {
        syncBadge('ok');
      }

      onSnapshot(docRef, snap => {
        if (snap.metadata.hasPendingWrites) return;
        if (Date.now() - _lastLocalWriteTime < 5000) return;
        if (snap.exists()) applyRemoteData(snap.data());
      }, e => { console.warn('mp sync snapshot', e); syncBadge(e && e.code === 'permission-denied' ? 'denied' : 'error'); });
    } catch (e) {
      console.warn('Firebase sync no disponible:', e);
      syncBadge(e && e.code === 'permission-denied' ? 'denied' : 'error');
    }
  })();
}

iniciar();
