// main.js
(() => {
  'use strict';

  // --- EXISTING SITE LOGIC ---
  const header = document.getElementById('site-header');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastY = window.scrollY || 0;
  const SCROLL_THRESHOLD = 10;

  function onScroll() {
    const y = window.scrollY || 0;
    const dy = y - lastY;
    const goingDown = dy > 0;
    if (header) {
      if (goingDown && y > SCROLL_THRESHOLD) header.classList.add('nav-hidden');
      else header.classList.remove('nav-hidden');
    }
    lastY = y;
  }

  function initMobileNav() {
    if (!header) return;
    const toggle = header.querySelector('.nav-toggle');
    const links = header.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => header.classList.toggle('nav-open'));
    links.addEventListener('click', (e) => { if (e.target.tagName === 'A') header.classList.remove('nav-open'); });
  }

  function initBriefAudio() {
    const audio = document.getElementById('brief-audio');
    const btn = document.getElementById('brief-audio-button');
    const icon = document.getElementById('brief-audio-icon');
    if (!audio || !btn || !icon) return;
    btn.addEventListener('click', () => {
      if (audio.paused) { audio.play().catch(() => { }); btn.classList.add('is-playing'); icon.textContent = '⏸'; }
      else { audio.pause(); btn.classList.remove('is-playing'); icon.textContent = '▶'; }
    });
    audio.addEventListener('ended', () => { btn.classList.remove('is-playing'); icon.textContent = '▶'; });
  }

  function initRevealAnimations() {
    if (prefersReducedMotion.matches) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const index = Array.from(target.parentNode.children).indexOf(target);
          setTimeout(() => target.classList.add('visible'), index * 140);
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('.reveal-fx').forEach(el => observer.observe(el));
  }

  function initPricingSwitch() {
    const switcher = document.querySelector('.switcher-glass');
    if (!switcher) return;
    const radios = switcher.querySelectorAll('input[name="billing"]');
    const priceElements = document.querySelectorAll('.price');
    const updatePrices = (billingType) => {
      priceElements.forEach(priceEl => {
        const amount = priceEl.getAttribute(`data-${billingType}`);
        if (!amount) return;
        priceEl.style.opacity = '0';
        setTimeout(() => {
          priceEl.innerHTML = `€${amount} <span>/mo</span> <span class="discount-badge"></span>`;
          const newBadge = priceEl.querySelector('.discount-badge');
          newBadge.textContent = (billingType === 'yearly') ? '(-20%)' : '';
          priceEl.style.opacity = '1';
        }, 150);
      });
    };
    radios.forEach(radio => { radio.addEventListener('change', (e) => { if (e.target.checked) updatePrices(e.target.value); }); });
  }

  function initPlanSelection() {
    const buttons = document.querySelectorAll('.select-plan-btn');
    const messageField = document.querySelector('textarea[name="message"]');
    const hiddenInput = document.getElementById('hidden-plan-input');
    const switcher = document.querySelector('.switcher-glass');
    if (!messageField) return;
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        let planName = btn.getAttribute('data-plan');
        let period = "Mensuel";
        if (switcher && switcher.querySelector('input[value="yearly"]').checked) period = "Annuel";
        if (planName.includes("Entreprise") || planName.includes("Demo")) period = "";
        else planName = `${planName} (${period})`;
        if (hiddenInput) hiddenInput.value = planName;
        if (messageField.value.trim() === '') messageField.value = `Bonjour, je suis intéressé par l'offre : ${planName}.\n\nVoici mes besoins : `;
        else messageField.value = `Intéressé par : ${planName}.\n` + messageField.value.replace(/^Intéressé par : .*\n/, '');
      });
    });
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgDiv = document.getElementById('formMsg');
      if (msgDiv) { msgDiv.textContent = 'Envoi en cours...'; msgDiv.style.color = 'var(--blue)'; }
      const data = {
        name: document.getElementById('name') ? document.getElementById('name').value.trim() : '',
        email: document.getElementById('email') ? document.getElementById('email').value.trim() : '',
        company: document.getElementById('company') ? document.getElementById('company').value.trim() : '',
        profession: document.getElementById('profession') ? document.getElementById('profession').value.trim() : null,
        volume: document.getElementById('volume') ? document.getElementById('volume').value : '',
        phone: document.getElementById('phone') ? document.getElementById('phone').value.trim() : null,
        message: document.getElementById('message') ? document.getElementById('message').value.trim() : ''
      };
      if (!data.name || !data.email || !data.message) {
        if (msgDiv) { msgDiv.textContent = "Veuillez remplir les champs obligatoires."; msgDiv.style.color = '#ef4444'; }
        return;
      }
      try {
        const path = window.apiUrl ? window.apiUrl('/contact') : '/portal-api/contact';
        const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          if (msgDiv) { msgDiv.textContent = "Message envoyé ! Nous vous répondrons très vite."; msgDiv.style.color = 'green'; }
          form.reset();
        } else {
          if (msgDiv) { msgDiv.textContent = "Erreur: " + (json.detail || "Inconnue"); msgDiv.style.color = '#ef4444'; }
        }
      } catch (err) {
        if (msgDiv) { msgDiv.textContent = "Impossible de contacter le serveur."; msgDiv.style.color = '#ef4444'; }
      }
    });
  }

  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }


  // --- ANALYTICS TRACKING ---
  const CONSENT_KEY = 'mial_consent';
  const ENDPOINT = '/portal-api/a/collect';
  const DEBUG = new URLSearchParams(window.location.search).has('analytics_debug');

  function uuidv4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const PAGE_ID = uuidv4();
  const PAGE_START = performance.now();
  const PATH = window.location.pathname;
  const REF = document.referrer || null;

  let hasConsented = false;
  try {
    const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}');
    hasConsented = c.analytics === true;
  } catch (e) { }

  function log(msg, ...args) {
    if (DEBUG) console.log(`[Analytics] ${msg}`, ...args);
  }
  function logError(msg, ...args) {
    if (DEBUG) console.error(`[Analytics] ${msg}`, ...args);
  }

  function sendEvent(payload) {
    if (!hasConsented) return;

    const fullPayload = {
      event: payload.event,
      path: PATH,
      ts: Date.now(),
      referrer: REF,
      page_id: PAGE_ID,
      duration_ms: payload.duration_ms || null,
      props: payload.props || null
    };

    log('Sending:', fullPayload);

    const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });

    // Beacon for reliability (especially pageclose)
    if (navigator.sendBeacon) {
      if (navigator.sendBeacon(ENDPOINT, blob)) {
        log('Sent via Beacon (status not available in beacon)');
        return;
      }
    }

    // Fallback
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
      keepalive: true,
      credentials: 'include'
    }).then(res => {
      log('Fetch status:', res.status);
    }).catch(err => {
      logError('Fetch error:', err);
    });
  }

  function trackPageview() {
    sendEvent({ event: 'pageview' });
  }

  let pagecloseSent = false;
  function trackPageClose() {
    if (pagecloseSent) return;
    pagecloseSent = true;
    const duration = Math.round(performance.now() - PAGE_START);
    sendEvent({ event: 'pageclose', duration_ms: duration });
  }

  function initHeartbeat() {
    setInterval(() => {
      // 15s interval, strictly visible & consented
      if (document.visibilityState === 'visible' && hasConsented) {
        sendEvent({ event: 'heartbeat' });
      }
    }, 15000);
  }

  function initScrollTracking() {
    const thresholds = [25, 50, 75, 100];
    const sent = new Set();
    const checkScroll = () => {
      if (!hasConsented) return;
      const h = document.documentElement;
      const b = document.body;
      const st = h.scrollTop || b.scrollTop;
      const sh = h.scrollHeight || b.scrollHeight;
      const ch = h.clientHeight;
      if (sh <= ch) return;

      const pct = Math.floor((st / (sh - ch)) * 100);
      thresholds.forEach(t => {
        if (pct >= t && !sent.has(t)) {
          sent.add(t);
          sendEvent({ event: `scroll:${t}`, props: { scroll_pct: t } });
        }
      });
    };
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { checkScroll(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

  function initInteractionTracking() {
    const handle = (e, attr) => {
      const el = e.target.closest(`[${attr}]`);
      if (el) {
        const val = el.getAttribute(attr);
        const evtName = (attr === 'data-analytics-conversion') ? `conversion:${val}` : `click:${val}`;
        sendEvent({ event: evtName });
      }
    };

    document.addEventListener('click', (e) => {
      handle(e, 'data-analytics-click');
      handle(e, 'data-analytics-conversion');
    });

    document.addEventListener('submit', (e) => {
      const el = e.target.closest('[data-analytics-conversion]');
      if (el) {
        const val = el.getAttribute('data-analytics-conversion');
        sendEvent({ event: `conversion:${val}` });
      }
    });
  }

  function initCookieBanner() {
    if (localStorage.getItem(CONSENT_KEY)) return;
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div><h4>🍪 Cookies & Confidentialité</h4><p>En acceptant, vous nous aidez à améliorer Mial via des statistiques anonymes.</p></div>
      <div class="cookie-actions">
        <button id="cookie-accept" class="btn btn-primary w-full" style="padding: 0.6rem;">Accepter</button>
        <button id="cookie-decline" class="btn btn-ghost w-full" style="padding: 0.6rem;">Refuser</button>
      </div>
    `;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));

    document.getElementById('cookie-accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true }));
      hasConsented = true;
      banner.remove();
      trackPageview();
    });
    document.getElementById('cookie-decline').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false }));
      hasConsented = false;
      banner.remove();
    });
  }


  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initBriefAudio();
    initRevealAnimations();
    initYear();
    initPricingSwitch();
    initPlanSelection();
    initContactForm();

    initCookieBanner();
    if (hasConsented) trackPageview();

    initHeartbeat();
    initScrollTracking();
    initInteractionTracking();

    window.addEventListener('pagehide', trackPageClose);
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') trackPageClose(); });

    document.querySelectorAll('#logout-btn, [data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); if (window.doLogout) window.doLogout(); });
    });

    onScroll();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

})();

/* =========================================================
   DASHBOARD LOGIC (Gestion des Profils)
   ========================================================= */

// Variables Globales
let PROFILES_BY_ID = new Map();
let USER_MAILBOXES = [];
let currentEditingId = null;

// Icônes SVG
const ICON_EDIT = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`;
const ICON_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;

// Helpers
function escapeHtml(s) { return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

// --- LOGIQUE OUTLOOK CHIPS (Emails) ---
function setupChipInput(containerId, textareaId) {
  const container = document.getElementById(containerId);
  const textarea = document.getElementById(textareaId);
  if (!container || !textarea) return;

  const input = container.querySelector('.chip-input');
  let emails = [];

  function update() {
    textarea.value = emails.join(', ');
    container.querySelectorAll('.chip').forEach(c => c.remove());
    emails.forEach(email => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `<span>${escapeHtml(email)}</span><span class="remove" style="margin-left:6px;cursor:pointer;">×</span>`;
      chip.querySelector('.remove').addEventListener('click', (e) => {
        e.stopPropagation();
        emails = emails.filter(x => x !== email);
        update();
      });
      container.insertBefore(chip, input);
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(',', '');
      if (val && !emails.includes(val)) { // Validation email laxiste pour UX
        emails.push(val);
        input.value = '';
        update();
      }
    }
    if (e.key === 'Backspace' && input.value === '' && emails.length > 0) {
      emails.pop();
      update();
    }
  });

  container.loadEmails = (csvString) => {
    if (!csvString) { emails = []; update(); return; }
    emails = csvString.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    update();
  };
  container.clear = () => { emails = []; input.value = ''; update(); };

  // Focus sur l'input quand on clique sur le container
  container.addEventListener('click', () => input.focus());
}


// --- INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
  // Si on n'est pas sur le dashboard, on arrête
  if (!document.getElementById('profiles-body')) return;

  // Init Chips
  setupChipInput('container-sender', 'f-filtre-sender');
  setupChipInput('container-exclude', 'f-exclude-sender');
  setupChipInput('container-cc', 'f-filtre-cc');

  // Init Auth & Data
  try {
    const res = await fetch(apiUrl('/me'), { credentials: 'include' });
    if (res.status === 401) window.location.href = 'login.html';
    const user = await res.json();
    const elEmail = document.getElementById('user-email');
    if (elEmail) elEmail.textContent = user.email;

    // Charger les boites mail
    const resMail = await fetch(apiUrl('/my/mailboxes'), { credentials: 'include' });
    if (resMail.ok) {
      let data = await resMail.json();
      if (Array.isArray(data)) USER_MAILBOXES = data;
      else if (data && data.connected) USER_MAILBOXES = [data]; // Cas objet unique
    }

    loadProfiles();
  } catch (e) { console.error(e); }
});


// --- ACTIONS UTILISATEUR ---

// 1. Click sur "+ Configurer"
window.handleCreateClick = function () {
  if (USER_MAILBOXES.length === 0) {
    alert("Erreur: Aucune boîte mail connectée. Veuillez d'abord connecter un compte.");
    return;
  }
  // Si 1 seule boite -> On ouvre direct
  if (USER_MAILBOXES.length === 1) {
    openEditorForCreation(USER_MAILBOXES[0]);
  } else {
    // Sinon -> Modale
    const list = document.getElementById('account-select-list');
    list.innerHTML = USER_MAILBOXES.map(mb => {
      // Astuce pour passer l'objet sans casser le HTML
      const safeObj = encodeURIComponent(JSON.stringify(mb));
      return `<button class="account-select-btn" onclick='openEditorForCreation(JSON.parse(decodeURIComponent("${safeObj}")))'>
                <span>${escapeHtml(mb.email || mb.email_address)}</span> <span>→</span>
            </button>`;
    }).join('');
    document.getElementById('modal-account-select').style.display = 'flex';
  }
};

window.closeAccountModal = function () {
  document.getElementById('modal-account-select').style.display = 'none';
};

// 2. Ouvrir l'éditeur (Mode CRÉATION)
window.openEditorForCreation = function (mailbox) {
  closeAccountModal();
  showEditor(false); // Reset UI

  console.log("Create for:", mailbox);

  // FIX CRITIQUE : Récupérer l'ID correctement
  // L'API renvoie parfois 'id' (table email_account) ou 'email_account_id' (table profile)
  const accId = mailbox.id || mailbox.email_account_id;

  if (!accId) {
    alert("Erreur technique: ID du compte introuvable.");
    return;
  }

  // Remplir l'input caché
  document.getElementById('f-account').value = accId;

  // Remplir le destinataire par défaut
  const email = mailbox.email || mailbox.email_address || "";
  document.getElementById('f-recipient').value = email;

  // Titres
  document.getElementById('editor-main-title').textContent = "Créer une nouvelle automatisation";
  document.getElementById('btn-save').textContent = "CRÉER L'AUTOMATISATION";
};

// 3. Ouvrir l'éditeur (Mode MODIFICATION)
window.editProfile = async function (id) {
  const p = PROFILES_BY_ID.get(id);
  if (!p) return;

  await showEditor(true);
  currentEditingId = id;

  // Mapping Données
  const sub = (s) => (s && s.length >= 5) ? s.substring(0, 5) : (s || '00:00');
  const toCsv = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(', ') : '';

  // ID Compte (Caché)
  document.getElementById('f-account').value = p.email_account_id;

  document.getElementById('f-recipient').value = p.recap_recipient || '';
  document.getElementById('f-schedule').value = sub(p.schedule_time || '08:00');

  // Période
  document.getElementById('f-days-start').value = (p.jours_arriere_start !== undefined) ? p.jours_arriere_start : 1;
  document.getElementById('f-days-end').value = (p.jours_arriere_end !== undefined) ? p.jours_arriere_end : 0;
  document.getElementById('f-time-start').value = sub(p.heure_debut);
  document.getElementById('f-time-end').value = sub(p.heure_fin);

  // Filtres
  document.getElementById('f-unread').checked = !!p.only_unread;
  document.getElementById('f-sort').value = p.sort_mode || 'date_desc';
  toggleCategoryUI();

  // Chips
  const cSender = document.getElementById('container-sender');
  const cExclude = document.getElementById('container-exclude');
  const cCc = document.getElementById('container-cc');
  if (cSender) cSender.loadEmails(toCsv(p.filtre_sender || []));
  if (cExclude) cExclude.loadEmails(toCsv(p.exclude_sender || []));
  if (cCc) cCc.loadEmails(toCsv(p.filtre_cc || []));

  // Audio
  document.getElementById('f-audio').checked = (p.audio_actif !== undefined) ? !!p.audio_actif : true;
  document.getElementById('f-voice').value = p.voice || 'alloy';
  document.getElementById('f-speed').value = p.speed || 1.0;
  if (document.getElementById('speed-val')) document.getElementById('speed-val').textContent = (p.speed || 1.0) + 'x';
  document.getElementById('f-lang').value = p.language || 'fr';

  // Titres
  document.getElementById('editor-main-title').textContent = "Modifier l'automatisation";
  document.getElementById('btn-save').textContent = "METTRE À JOUR";
};

// 4. Sauvegarder (Create ou Update)
window.saveProfile = async function () {
  // Validation du compte source (Le FIX est ici)
  const accId = document.getElementById('f-account').value;
  if (!accId) {
    alert("Erreur: Compte source non défini. Veuillez recharger la page et réessayer.");
    return;
  }

  const recipient = document.getElementById('f-recipient').value;
  if (!recipient) {
    alert("Erreur: Le destinataire est obligatoire.");
    return;
  }

  // Construction du payload
  const parseCsv = (val) => val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  const fixTime = (t) => (t && t.length === 5) ? t + ':00' : t;

  const payload = {
    email_account_id: accId,
    recap_recipient: recipient,

    schedule_time: fixTime(document.getElementById('f-schedule').value),

    jours_arriere_start: parseInt(document.getElementById('f-days-start').value) || 0,
    jours_arriere_end: parseInt(document.getElementById('f-days-end').value) || 0,
    heure_debut: fixTime(document.getElementById('f-time-start').value),
    heure_fin: fixTime(document.getElementById('f-time-end').value),

    only_unread: document.getElementById('f-unread').checked,
    sort_mode: document.getElementById('f-sort').value,

    filters: {
      sender: parseCsv(document.getElementById('f-filtre-sender').value),
      exclude: parseCsv(document.getElementById('f-exclude-sender').value),
      cc: parseCsv(document.getElementById('f-filtre-cc').value),
      destined_to: [], forwarded_from: []
    },

    audio_actif: document.getElementById('f-audio').checked,
    voice: document.getElementById('f-voice').value,
    speed: parseFloat(document.getElementById('f-speed').value),
    language: document.getElementById('f-lang').value,

    status: 'Active', timezone: 'Europe/Paris', categories: 'ALL'
  };

  const btn = document.getElementById('btn-save');
  const originalText = btn.textContent;
  btn.textContent = "EN COURS...";
  btn.disabled = true;

  try {
    const isEdit = !!currentEditingId;
    const url = isEdit ? `/my/profiles/${currentEditingId}` : '/my/profiles';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(apiUrl(url), {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!res.ok) throw new Error(await res.text());

    // Succès
    alert(isEdit ? "Modifications enregistrées !" : "Automatisation créée avec succès !");
    hideEditor();
    loadProfiles();

  } catch (e) {
    console.error(e);
    alert("Erreur lors de l'enregistrement : " + e.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
};

// --- UTILS UI ---
window.hideEditor = function () {
  document.getElementById('view-editor').style.display = 'none';
  document.getElementById('view-list').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentEditingId = null;
  document.getElementById('form-editor').reset();

  // Clear chips
  ['container-sender', 'container-exclude', 'container-cc'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.clear) el.clear();
  });
};

window.showEditor = async function (isEdit) {
  document.getElementById('view-list').style.display = 'none';
  document.getElementById('view-editor').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!isEdit) {
    currentEditingId = null;
    document.getElementById('form-editor').reset();
    ['container-sender', 'container-exclude', 'container-cc'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.clear) el.clear();
    });

    // Defaults UI
    document.getElementById('f-schedule').value = "08:00";
    document.getElementById('f-days-start').value = 1;
    document.getElementById('f-time-start').value = "00:00";
    document.getElementById('f-days-end').value = 0;
    document.getElementById('f-time-end').value = "23:59";

    toggleCategoryUI();
    renderCategories();
  }
};

window.toggleCategoryUI = function () {
  const val = document.getElementById('f-sort').value;
  const ui = document.getElementById('ui-categories');
  if (val === 'category') {
    ui.style.display = 'block';
    renderCategories();
  } else {
    ui.style.display = 'none';
  }
};

function renderCategories() {
  const container = document.getElementById('chips-categories');
  if (!container || container.children.length > 0) return;

  const cats = [
    { id: 'meeting', label: 'Meeting', class: 'meeting' },
    { id: 'action', label: 'Action', class: 'action' },
    { id: 'info', label: 'Info', class: 'info' },
    { id: 'pub', label: 'Pub', class: 'pub' }
  ];
  container.innerHTML = cats.map(c =>
    `<div class="cat-pill ${c.class}" draggable="true">
            ${c.label} <span class="remove" onclick="this.parentElement.remove()">×</span>
         </div>`
  ).join('');
}

// Charger la liste
async function loadProfiles() {
  const tbody = document.getElementById('profiles-body');
  try {
    const res = await fetch(apiUrl('/my/profiles'), { credentials: 'include' });
    if (!res.ok) throw new Error("Erreur chargement");
    const profiles = await res.json();
    PROFILES_BY_ID.clear();

    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;" class="muted">Aucune automatisation configurée.</td></tr>`;
      return;
    }

    tbody.innerHTML = profiles.map(p => {
      PROFILES_BY_ID.set(p.id, p);

      const isActive = (String(p.status).toLowerCase() === 'active');
      const statusClass = isActive ? 'active' : 'inactive';
      const statusText = isActive ? 'Actif' : 'Inactif';
      const statusPill = `<button class="status-pill ${statusClass}" onclick="toggleStatus('${p.id}')">${statusText}</button>`;

      const sub = (s) => (s && s.length >= 5) ? s.substring(0, 5) : (s || '00:00');
      const plage = `<span class="muted">J-${p.jours_arriere_start || 0}</span> <strong>${sub(p.heure_debut)}</strong> <span class="muted">à</span> <span class="muted">J-${p.jours_arriere_end || 0}</span> <strong>${sub(p.heure_fin)}</strong>`;
      const accountEmail = escapeHtml(p.account_email || '—');

      return `<tr>
                <td style="font-weight:600;">${accountEmail}</td>
                <td>${escapeHtml(p.recap_recipient || '—')}</td>
                <td>${plage}</td>
                <td style="font-weight:600; color:var(--ink);">${sub(p.schedule_time)}</td>
                <td>${statusPill}</td>
                <td style="text-align:right;">
                    <button class="btn-icon" title="Modifier" onclick="editProfile('${p.id}')">${ICON_EDIT}</button>
                    <button class="btn-icon delete" title="Supprimer" onclick="deleteProfile('${p.id}')">${ICON_TRASH}</button>
                </td>
            </tr>`;
    }).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">${e.message}</td></tr>`; }
}

window.deleteProfile = async function (id) {
  if (!confirm("Supprimer cette automatisation ?")) return;
  try {
    await fetch(apiUrl(`/my/profiles/${id}`), { method: 'DELETE', credentials: 'include' });
    loadProfiles();
  } catch (e) { alert(e.message); }
};

window.toggleStatus = async function (id) {
  // Logique de toggle status (simplifiée pour ce prompt)
  const btn = document.querySelector(`button[onclick="toggleStatus('${id}')"]`);
  if (!btn) return;
  try {
    const p = PROFILES_BY_ID.get(id);
    if (!p) return;
    const newStatus = p.status === 'Active' ? 'Paused' : 'Active';
    await fetch(apiUrl(`/my/profiles/${id}/status`), {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    loadProfiles();
  } catch (e) { console.error(e); }
};
