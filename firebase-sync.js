// MiniPrints v2 — sincronización entre dispositivos (Firebase Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC64TanRR3eG1X5X7lUEoVjLTQGSRZr3Vg",
  authDomain: "miniprints-v2.firebaseapp.com",
  projectId: "miniprints-v2",
  storageBucket: "miniprints-v2.firebasestorage.app",
  messagingSenderId: "688525548823",
  appId: "1:688625548823:web:984352167469cba3402652"
};

const PIN = "0343";
const SYNC_KEYS = ['mp_config','mp_materials','mp_piezas','mp_ventas','mp_cotizaciones','mp_historial','mp_templates','mp_meta_mensual'];

const app    = initializeApp(firebaseConfig);
const auth   = getAuth(app);
const db     = getFirestore(app);
const docRef = doc(db, 'negocio', 'data');

let applyingRemote = false;
let pushTimer = null;

function flushPush() {
  clearTimeout(pushTimer);
  const payload = {};
  SYNC_KEYS.forEach(k => { payload[k] = localStorage.getItem(k); });
  setDoc(docRef, payload, { merge: true }).catch(e => console.error('mp sync push error', e));
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(flushPush, 150);
}

// Intercepta escrituras a localStorage y dispara push a Firestore
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (!applyingRemote && SYNC_KEYS.includes(key)) schedulePush();
};

// Flush inmediato cuando la página se oculta o cierra (crítico en iPhone/iPad)
document.addEventListener('visibilitychange', () => { if (document.hidden) flushPush(); });
window.addEventListener('pagehide', flushPush);

function applyRemoteData(data) {
  applyingRemote = true;
  SYNC_KEYS.forEach(k => {
    if (data && data[k] != null) _origSetItem(k, data[k]);
  });
  applyingRemote = false;
  window.dispatchEvent(new CustomEvent('mp-sync-update'));
}

function showPinGate(onUnlock) {
  if (localStorage.getItem('mp_pin_ok') === '1') { onUnlock(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'mp-pin-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:#0a0f1a;z-index:99999;display:flex;align-items:center;justify-content:center;font-family:"Plus Jakarta Sans",sans-serif;';
  overlay.innerHTML = `
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:32px;max-width:320px;width:90%;text-align:center;">
      <div style="font-size:2rem;margin-bottom:8px;">🔒</div>
      <h2 style="color:#e2e8f0;font-size:1.1rem;margin-bottom:16px;">MiniPrints</h2>
      <input id="mp-pin-input" type="password" inputmode="numeric" maxlength="6" placeholder="PIN" autocomplete="off"
        style="width:100%;padding:12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:1.2rem;text-align:center;letter-spacing:6px;outline:none;margin-bottom:12px;box-sizing:border-box;" />
      <button id="mp-pin-btn" style="width:100%;padding:12px;border-radius:10px;border:none;background:#22c55e;color:#fff;font-weight:700;font-size:0.95rem;cursor:pointer;">Entrar</button>
      <div id="mp-pin-err" style="color:#ef4444;font-size:0.8rem;margin-top:10px;display:none;">PIN incorrecto</div>
    </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector('#mp-pin-input');
  const btn   = overlay.querySelector('#mp-pin-btn');
  const err   = overlay.querySelector('#mp-pin-err');
  function tryUnlock() {
    if (input.value === PIN) {
      _origSetItem('mp_pin_ok', '1');
      overlay.remove();
      onUnlock();
    } else {
      err.style.display = 'block';
      input.value = '';
      input.focus();
    }
  }
  btn.addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  setTimeout(() => input.focus(), 150);
}

async function initSync() {
  // Disparar mp-sync-ready de inmediato para que la página cargue
  // con los datos locales mientras Firestore sincroniza en segundo plano.
  window.dispatchEvent(new CustomEvent('mp-sync-ready'));

  try {
    await signInAnonymously(auth);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      applyRemoteData(snap.data());  // dispara mp-sync-update → re-render
    } else {
      const initial = {};
      SYNC_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) initial[k] = v; });
      await setDoc(docRef, initial);
    }
    onSnapshot(docRef, snap => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) applyRemoteData(snap.data());
    });
  } catch (e) {
    console.error('mp sync init error', e);
  }
}

showPinGate(initSync);
