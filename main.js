'use strict';

// =========================================================
// VARIABLES GLOBALES
// =========================================================
const CONSENT_KEY = 'mial_consent';
const SCROLL_THRESHOLD = 10;
let lastY = window.scrollY || 0;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.getElementById('site-header');

// User Dashboard Globals
let PROFILES_BY_ID = new Map();
let USER_MAILBOXES = [];
let currentEditingId = null;

// Admin Dashboard Globals
let ADMIN_PROFILES_BY_ID = new Map();
let ADMIN_EDITOR_ID = null;
const ADMIN_CACHE = { users: [], mailboxes: {}, profiles: {} };
const ADMIN_LOADING = { mailboxes: {}, profiles: {} };

// Icons
const ICON_EDIT = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`;
const ICON_TRASH = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px;height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`;

// =========================================================
// UTILS & HELPERS
// =========================================================
function escapeHtml(s) { return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
// apiUrl is REMOVED from here to avoid Main.js recursion. It is loaded from api.js.

window.onScroll = function () {
  const y = window.scrollY || 0;
  const dy = y - lastY;
  const goingDown = dy > 0;
  if (header) {
    if (goingDown && y > SCROLL_THRESHOLD) header.classList.add('nav-hidden');
    else header.classList.remove('nav-hidden');
  }
  lastY = y;
};

window.initMobileNav = function () {
  if (!header) return;
  const toggle = header.querySelector('.nav-toggle');
  const links = header.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => header.classList.toggle('nav-open'));
  links.addEventListener('click', (e) => { if (e.target.tagName === 'A') header.classList.remove('nav-open'); });
};

window.initBriefAudio = function () {
  const audio = document.getElementById('brief-audio');
  const btn = document.getElementById('brief-audio-button');
  const icon = document.getElementById('brief-audio-icon');
  if (!audio || !btn || !icon) return;
  btn.addEventListener('click', () => {
    if (audio.paused) { audio.play().catch(() => { }); btn.classList.add('is-playing'); icon.textContent = '⏸'; }
    else { audio.pause(); btn.classList.remove('is-playing'); icon.textContent = '▶'; }
  });
  audio.addEventListener('ended', () => { btn.classList.remove('is-playing'); icon.textContent = '▶'; });
};

window.initRevealAnimations = function () {
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
};

window.initPricingSwitch = function () {
  const switcher = document.querySelector('.switcher-glass');
  if (!switcher) return;
  const radios = switcher.querySelectorAll('input[name="billing"]');
  const priceElements = document.querySelectorAll('.price');
  radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.checked) {
        priceElements.forEach(priceEl => {
          const amount = priceEl.getAttribute(`data-${e.target.value}`);
          if (!amount) return;
          priceEl.style.opacity = '0';
          setTimeout(() => {
            priceEl.innerHTML = `€${amount} <span>/mo</span> <span class="discount-badge"></span>`;
            const newBadge = priceEl.querySelector('.discount-badge');
            newBadge.textContent = (e.target.value === 'yearly') ? '(-20%)' : '';
            priceEl.style.opacity = '1';
          }, 150);
        });
      }
    });
  });
};

window.initPlanSelection = function () {
  const buttons = document.querySelectorAll('.select-plan-btn');
  const messageField = document.querySelector('textarea[name="message"]');
  const hiddenInput = document.getElementById('hidden-plan-input');
  const switcher = document.querySelector('.switcher-glass');
  if (!messageField) return;
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
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
};

window.initContactForm = function () {
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
      const path = apiUrl('/contact'); // Uses global api.js function
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
};

window.initYear = function () {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
};

// =========================================================
// USER DASHBOARD LOGIC
// =========================================================

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
      if (val && !emails.includes(val)) {
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
  container.addEventListener('click', () => input.focus());
}

window.handleCreateClick = function () {
  if (USER_MAILBOXES.length === 0) {
    alert("Erreur: Aucune boîte mail connectée. Veuillez d'abord connecter un compte.");
    return;
  }
  if (USER_MAILBOXES.length === 1) {
    window.openEditorForCreation(USER_MAILBOXES[0]);
  } else {
    const list = document.getElementById('account-select-list');
    list.innerHTML = USER_MAILBOXES.map(mb => {
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

window.openEditorForCreation = function (mailbox) {
  window.closeAccountModal();
  window.showEditor(false);
  const accId = mailbox.id || mailbox.email_account_id;
  if (!accId) { alert("Erreur technique: ID absent"); return; }
  document.getElementById('f-account').value = accId;
  document.getElementById('f-recipient').value = mailbox.email || mailbox.email_address || "";
  document.getElementById('editor-main-title').textContent = "Créer une nouvelle automatisation";
  document.getElementById('btn-save').textContent = "CRÉER L'AUTOMATISATION";
};

window.editProfile = async function (id) {
  const p = PROFILES_BY_ID.get(id);
  if (!p) return;
  await window.showEditor(true);
  currentEditingId = id;
  const sub = (s) => (s && s.length >= 5) ? s.substring(0, 5) : (s || '00:00');
  const toCsv = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(', ') : '';

  document.getElementById('f-account').value = p.email_account_id;
  document.getElementById('f-recipient').value = p.recap_recipient || '';
  document.getElementById('f-schedule').value = sub(p.schedule_time || '08:00');
  document.getElementById('f-days-start').value = (p.jours_arriere_start !== undefined) ? p.jours_arriere_start : 1;
  document.getElementById('f-days-end').value = (p.jours_arriere_end !== undefined) ? p.jours_arriere_end : 0;
  document.getElementById('f-time-start').value = sub(p.heure_debut);
  document.getElementById('f-time-end').value = sub(p.heure_fin);
  document.getElementById('f-unread').checked = !!p.only_unread;
  document.getElementById('f-sort').value = p.sort_mode || 'date_desc';

  window.toggleCategoryUI();

  const cSender = document.getElementById('container-sender');
  const cExclude = document.getElementById('container-exclude');
  const cCc = document.getElementById('container-cc');
  if (cSender) cSender.loadEmails(toCsv(p.filtre_sender || []));
  if (cExclude) cExclude.loadEmails(toCsv(p.exclude_sender || []));
  if (cCc) cCc.loadEmails(toCsv(p.filtre_cc || []));

  document.getElementById('f-audio').checked = (p.audio_actif !== undefined) ? !!p.audio_actif : true;
  document.getElementById('f-voice').value = p.voice || 'alloy';
  document.getElementById('f-speed').value = p.speed || 1.0;
  if (document.getElementById('speed-val')) document.getElementById('speed-val').textContent = (p.speed || 1.0) + 'x';
  document.getElementById('f-lang').value = p.language || 'fr';

  document.getElementById('editor-main-title').textContent = "Modifier l'automatisation";
  document.getElementById('btn-save').textContent = "METTRE À JOUR";
};

window.saveProfile = async function () {
  const accId = document.getElementById('f-account').value;
  if (!accId) { alert("Erreur: Compte source non défini."); return; }
  const recipient = document.getElementById('f-recipient').value;
  if (!recipient) { alert("Erreur: Destinataire requis."); return; }

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
    alert(isEdit ? "Modifications enregistrées !" : "Automatisation créée !");
    window.hideEditor();
    window.loadProfiles();
  } catch (e) {
    alert("Erreur: " + e.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
};

window.hideEditor = function () {
  document.getElementById('view-editor').style.display = 'none';
  document.getElementById('view-list').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentEditingId = null;
  document.getElementById('form-editor').reset();
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
    document.getElementById('f-schedule').value = "08:00";
    document.getElementById('f-days-start').value = 1;
    document.getElementById('f-time-start').value = "00:00";
    document.getElementById('f-days-end').value = 0;
    document.getElementById('f-time-end').value = "23:59";
    window.toggleCategoryUI();
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

window.loadProfiles = async function () {
  const tbody = document.getElementById('profiles-body');
  if (!tbody) return;
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
};

window.deleteProfile = async function (id) {
  if (!confirm("Supprimer cette automatisation ?")) return;
  try {
    await fetch(apiUrl(`/my/profiles/${id}`), { method: 'DELETE', credentials: 'include' });
    window.loadProfiles();
  } catch (e) { alert(e.message); }
};

window.toggleStatus = async function (id) {
  const btn = document.querySelector(`button[onclick="toggleStatus('${id}')"]`);
  if (!btn) return;
  const originalText = btn.textContent;
  btn.textContent = "...";
  btn.style.opacity = "0.7";
  btn.disabled = true;
  try {
    const p = PROFILES_BY_ID.get(id);
    if (!p) return;
    const isCurrentlyActive = String(p.status).toLowerCase() === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    const res = await fetch(apiUrl(`/my/profiles/${id}/status`), {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) throw new Error("Erreur serveur");
    window.loadProfiles();
  } catch (e) {
    alert("Impossible de changer le statut : " + e.message);
    btn.textContent = originalText;
    btn.style.opacity = "1";
    btn.disabled = false;
  }
};

// =========================================================
// ADMIN DASHBOARD LOGIC (Leads & Users)
// =========================================================

window.switchAdminView = function (viewName) {
  const vProfiles = document.getElementById('view-profiles');
  const vLeads = document.getElementById('view-leads');
  if (viewName === 'leads') {
    if (vProfiles) vProfiles.style.display = 'none';
    if (vLeads) vLeads.style.display = 'block';
    if (window.loadLeads) window.loadLeads();
  } else {
    if (vLeads) vLeads.style.display = 'none';
    if (vProfiles) vProfiles.style.display = 'block';
  }
};

window.loadLeads = async function () {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="center muted py-4">Chargement...</td></tr>';
  try {
    const res = await fetch(apiUrl('/admin/api/prospects'), { credentials: 'include' });
    if (!res.ok) throw new Error("Erreur chargement leads");
    const leads = await res.json();
    renderLeads(leads);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="center error-text py-4">${e.message}</td></tr>`;
  }
};

function renderLeads(leads) {
  const tbody = document.getElementById('leads-tbody');
  if (!leads || leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="center muted py-4">Aucun prospect.</td></tr>';
    return;
  }
  tbody.innerHTML = leads.map(l => {
    const date = new Date(l.created_at).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const shortMsg = l.message.length > 50 ? l.message.substring(0, 50) + '...' : l.message;
    return `
        <tr>
          <td>${date}</td>
          <td>${l.name}</td>
          <td><a href="mailto:${l.email}">${l.email}</a></td>
          <td>${l.company || '-'}</td>
          <td title="${l.message.replace(/"/g, '&quot;')}">${shortMsg}</td>
          <td style="text-align:right; white-space:nowrap;">
            <button class="action-btn" title="Répondre" onclick="openReplyModal('${l.id}', '${l.email}', '${l.name.replace(/'/g, "\\'")}')">✉️</button>
            <button class="action-btn" title="Supprimer" style="color:#ef4444; margin-left:8px;" onclick="deleteLead('${l.id}')">🗑</button>
          </td>
        </tr>`;
  }).join('');
}

window.deleteLead = async function (id) {
  if (!confirm("Supprimer ce prospect ?")) return;
  try {
    const res = await fetch(apiUrl(`/admin/api/prospects/${id}`), { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error("Erreur suppression");
    window.loadLeads();
  } catch (e) { alert(e.message); }
};

let currentLeadReplyId = null;
window.openReplyModal = function (id, email, name) {
  currentLeadReplyId = id;
  const modal = document.getElementById('modal-reply');
  const sub = document.getElementById('modal-reply-subtitle');
  const subj = document.getElementById('reply-subject');
  if (sub) sub.textContent = `À: ${name} (${email})`;
  if (subj) subj.value = `Re: Votre demande de contact mial`;
  if (document.getElementById('reply-message')) document.getElementById('reply-message').value = '';
  if (modal) modal.showModal();
};

window.submitReply = async function () {
  if (!currentLeadReplyId) return;
  const subject = document.getElementById('reply-subject').value;
  const message = document.getElementById('reply-message').value;
  const modal = document.getElementById('modal-reply');
  if (!subject || !message) return alert("Veuillez remplir le sujet et le message.");
  try {
    const res = await fetch(apiUrl(`/admin/api/prospects/${currentLeadReplyId}/reply`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message }), credentials: 'include'
    });
    if (!res.ok) throw new Error("Erreur envoi réponse");
    alert("Réponse envoyée !");
    if (modal) modal.close();
    window.loadLeads();
  } catch (e) { alert(e.message); }
};

window.initAdminDashboard = async function () {
  ADMIN_CACHE.users = []; ADMIN_CACHE.mailboxes = {}; ADMIN_CACHE.profiles = {};
  const root = document.getElementById('hierarchy-root');
  if (root) root.innerHTML = '<div style="text-align:center; padding: 40px;" class="muted">Chargement de la hiérarchie...</div>';

  if (document.getElementById('profile-editor')) window.initAdminEditorListeners();

  try {
    // Direct call to fetchAdminUsers as requested (removing admin-tree legacy)
    await fetchAdminUsers();
  } catch (e) {
    if (root) root.innerHTML = `<div style="text-align:center; color:red; padding: 20px;">Erreur init: ${e.message}</div>`;
  }
};

async function fetchAdminUsers() {
  try {
    const res = await fetch(apiUrl('/admin/api/users'), { credentials: 'include' });
    if (!res.ok) throw new Error('Impossible de charger les utilisateurs');
    const users = await res.json();
    ADMIN_CACHE.users = users;
    renderAdminUsersRoot(users);
  } catch (e) {
    const root = document.getElementById('hierarchy-root');
    if (root) root.innerHTML = `<div style="text-align:center; color:red;">${e.message}</div>`;
  }
}

function renderAdminUsersRoot(users) {
  const root = document.getElementById('hierarchy-root');
  if (!root) return;
  if (!users || users.length === 0) {
    root.innerHTML = '<div style="text-align:center; padding: 20px;">Aucun utilisateur.</div>';
    return;
  }
  root.innerHTML = users.map(u => buildAdminUserRow(u)).join('');
}

function buildAdminUserRow(u) {
  const created = u.created_at ? new Date(u.created_at).toLocaleDateString() : '—';
  const activeBadge = u.is_active ? `<span class="badge-active">ACTIF</span>` : `<span class="badge-inactive">INACTIF</span>`;
  let mbCount = '?'; let pfCount = '?';
  if (u.mailboxes_count !== undefined) mbCount = u.mailboxes_count;
  if (u.profiles_count !== undefined) pfCount = u.profiles_count;

  if (ADMIN_CACHE.mailboxes[u.id]) {
    mbCount = ADMIN_CACHE.mailboxes[u.id].length;
    let localPCount = 0;
    ADMIN_CACHE.mailboxes[u.id].forEach(m => {
      if (ADMIN_CACHE.profiles[m.id]) localPCount += ADMIN_CACHE.profiles[m.id].length;
    });
    if (mbCount > 0) pfCount = localPCount;
  }

  const safeEmail = String(u.email || '').replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; });

  return `
    <div id="user-container-${u.id}" class="user-row" style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; background: white; overflow: hidden;">
        <div onclick="toggleAdminUser('${u.id}')" style="padding: 12px 16px; background: #f8fafc; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid transparent;">
            <div style="display:flex; align-items:center; gap: 12px;">
                <span style="font-size: 1.2rem; transform: rotate(0deg); transition: transform 0.2s;" id="icon-user-${u.id}">▶</span>
                <div>
                    <div style="font-weight: 600; font-size: 1rem; color: #1e293b;">${safeEmail}</div>
                    <div class="muted" style="font-size: 0.8rem;">ID: ${u.id.substring(0, 8)}... · ${u.role || 'user'} · ${created}</div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap: 16px;">
                 <div style="font-size: 0.85rem; color: #64748b;">
                    <span id="count-mb-${u.id}"><strong>${mbCount}</strong> Boîtes</span> · 
                    <span id="count-pf-${u.id}"><strong>${pfCount}</strong> Profils</span>
                 </div>
                 ${activeBadge}
                 <button class="action-btn" style="color: #ef4444; border-color: #fecaca; margin-left: 12px;" onclick="event.stopPropagation(); deleteAdminUser('${u.id}')">Supprimer</button>
            </div>
        </div>
        <div id="content-user-${u.id}" style="display: none; border-top: 1px solid #e2e8f0;">
            <div style="padding: 16px; background: #fff;" id="inner-user-${u.id}"></div>
        </div>
    </div>`;
}

window.toggleAdminUser = async function (userId) {
  const content = document.getElementById(`content-user-${userId}`);
  const icon = document.getElementById(`icon-user-${userId}`);
  const inner = document.getElementById(`inner-user-${userId}`);
  if (!content) return;

  if (content.style.display === 'none') {
    content.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(90deg)';

    if (!ADMIN_CACHE.mailboxes[userId] && !ADMIN_LOADING.mailboxes[userId]) {
      ADMIN_LOADING.mailboxes[userId] = true;
      inner.innerHTML = '<div class="muted">Chargement des boîtes...</div>';
      try {
        const res = await fetch(apiUrl(`/admin/api/users/${userId}/email-accounts`), { credentials: 'include' });
        if (res.ok) {
          const mbs = await res.json();
          ADMIN_CACHE.mailboxes[userId] = mbs;
          renderAdminMailboxes(userId, mbs);
        } else {
          inner.innerHTML = '<div class="muted" style="padding:8px;">Aucune boîte mail.</div>';
        }
      } catch (e) {
        inner.innerHTML = `<div style="color:red;">${e.message}</div>`;
      } finally {
        ADMIN_LOADING.mailboxes[userId] = false;
      }
    } else if (ADMIN_CACHE.mailboxes[userId]) {
      renderAdminMailboxes(userId, ADMIN_CACHE.mailboxes[userId]);
    }
  } else {
    content.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

function renderAdminMailboxes(userId, mailboxes) {
  const container = document.getElementById(`inner-user-${userId}`);
  if (!mailboxes || mailboxes.length === 0) {
    container.innerHTML = '<div class="muted" style="padding:8px; font-style:italic;">Aucune boîte mail connectée.</div>';
    return;
  }
  container.innerHTML = mailboxes.map(mb => buildAdminMailboxRow(mb)).join('');
}

function buildAdminMailboxRow(mb) {
  const statusColor = (mb.status === 'connected') ? '#16a34a' : '#f59e0b';
  const safeEmail = String(mb.email_address || '').replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; });
  return `
    <div id="mailbox-container-${mb.id}" style="margin-top: 8px; border: 1px solid #f1f5f9; border-radius: 6px; background: #f8fafc;">
         <div onclick="toggleAdminMailbox('${mb.id}')" style="padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <div style="display:flex; align-items:center; gap: 8px;">
                <span id="icon-mb-${mb.id}" style="font-size: 0.9rem; transition: transform 0.2s;">▶</span>
                <strong>${safeEmail}</strong>
                <span style="font-size:0.8rem; background: #e2e8f0; padding: 1px 6px; border-radius: 4px;">${mb.provider}</span>
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; display: inline-block;"></span>
            </div>
            <div>
                 <button class="action-btn" style="color: #ef4444; border-color: #fecaca; font-size: 0.75rem;" onclick="event.stopPropagation(); deleteAdminMailbox('${mb.id}', '${mb.user_id}')">Supprimer Boîte</button>
            </div>
         </div>
         <div id="content-mb-${mb.id}" style="display: none; padding: 12px; border-top: 1px solid #f1f5f9; background: white;">
            <table class="dashboard-table" style="width: 100%;">
                <thead>
                    <tr><th>ID</th><th>Recipient</th><th>Heures</th><th>Jours</th><th>Status</th><th style="text-align: right;">Actions</th></tr>
                </thead>
                <tbody id="tbody-mb-${mb.id}"></tbody>
            </table>
         </div>
    </div>`;
}

window.toggleAdminMailbox = async function (mbId) {
  const content = document.getElementById(`content-mb-${mbId}`);
  const icon = document.getElementById(`icon-mb-${mbId}`);
  const tbody = document.getElementById(`tbody-mb-${mbId}`);
  if (!content) return;

  if (content.style.display === 'none') {
    content.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(90deg)';
    if (!ADMIN_CACHE.profiles[mbId] && !ADMIN_LOADING.profiles[mbId]) {
      ADMIN_LOADING.profiles[mbId] = true;
      tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;">Chargement profils...</td></tr>';
      try {
        const res = await fetch(apiUrl(`/admin/api/email-accounts/${mbId}/recap-profiles`), { credentials: 'include' });
        if (res.ok) {
          const profs = await res.json();
          ADMIN_CACHE.profiles[mbId] = profs;
          renderAdminProfiles(mbId, profs);
        } else {
          tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;">Aucun profil.</td></tr>';
        }
      } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">${e.message}</td></tr>`;
      } finally {
        ADMIN_LOADING.profiles[mbId] = false;
      }
    } else if (ADMIN_CACHE.profiles[mbId]) {
      renderAdminProfiles(mbId, ADMIN_CACHE.profiles[mbId]);
    }
  } else {
    content.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

function renderAdminProfiles(mbId, profiles) {
  const tbody = document.getElementById(`tbody-mb-${mbId}`);
  if (!profiles || profiles.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center; font-style:italic;">Aucun profil de récap.</td></tr>';
    return;
  }
  profiles.forEach(p => ADMIN_PROFILES_BY_ID.set(p.id, p));

  tbody.innerHTML = profiles.map(p => {
    const isStatusActive = (String(p.status ?? '').toLowerCase() === 'active');
    const statusClass = isStatusActive ? 'badge-active' : 'badge-inactive';
    const recipient = String(p.recap_recipient || '—').replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]; });
    return `
        <tr id="profile-row-${p.id}">
            <td style="font-family:monospace; font-size:0.85rem; color:#64748b;">${p.id.substring(0, 8)}...</td>
            <td><strong>${recipient}</strong></td>
            <td>${p.heure_debut || '—'} - ${p.heure_fin || '—'}</td>
            <td>${p.jours_arriere_start || 0} → ${p.jours_arriere_end || 0}</td>
            <td><span class="${statusClass}">${p.status || '—'}</span></td>
            <td style="text-align: right; white-space: nowrap;">
                 <button class="action-btn" onclick="openAdminEditor('${p.id}')">Éditer / Détails</button>
                 <button class="action-btn" style="color:#ef4444; border-color:transparent; background:transparent;" onclick="deleteAdminProfile('${p.id}', '${mbId}')">🗑</button>
            </td>
        </tr>`;
  }).join('');
}

window.deleteAdminUser = async function (id) {
  if (!confirm("Attention: Supprimer cet utilisateur ?")) return;
  try {
    const res = await fetch(apiUrl(`/admin/api/users/${id}`), { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Delete failed');
    const row = document.getElementById(`user-container-${id}`);
    if (row) row.remove();
    if (ADMIN_CACHE.users) ADMIN_CACHE.users = ADMIN_CACHE.users.filter(u => u.id !== id);
  } catch (e) { alert(e.message); }
};

window.deleteAdminMailbox = async function (mbId, userId) {
  if (!confirm("Supprimer cette boîte mail ?")) return;
  try {
    const res = await fetch(apiUrl(`/admin/api/email-accounts/${mbId}`), { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Delete failed');
    const row = document.getElementById(`mailbox-container-${mbId}`);
    if (row) row.remove();
  } catch (e) { alert(e.message); }
};

window.deleteAdminProfile = async function (pId, mbId) {
  if (!confirm("Supprimer ce profil ?")) return;
  try {
    const res = await fetch(apiUrl(`/admin/api/recap-profiles/${pId}`), { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error('Delete failed');
    const row = document.getElementById(`profile-row-${pId}`);
    if (row) row.remove();
  } catch (e) { alert(e.message); }
};

window.openAdminEditor = function (id) {
  const p = ADMIN_PROFILES_BY_ID.get(id);
  if (!p) return;
  ADMIN_EDITOR_ID = id;
  document.getElementById('edit-profile-id').textContent = id;
  document.getElementById('editor-error').style.display = 'none';
  document.getElementById('editor-ok').style.display = 'none';
  document.getElementById('profile-editor').style.display = 'block';

  document.getElementById('f-timezone').value = p.timezone || '';
  document.getElementById('f-start').value = p.heure_debut || '';
  document.getElementById('f-end').value = p.heure_fin || '';
  document.getElementById('f-days-start').value = p.jours_arriere_start ?? 0;
  document.getElementById('f-days-end').value = p.jours_arriere_end ?? 0;
  document.getElementById('f-debug').checked = (p.debug_mode === true);

  const f = p.filters || {};
  const arrToCsv = (a) => Array.isArray(a) ? a.join(', ') : '';
  document.getElementById('f-filter-sender').value = arrToCsv(f.sender);
  document.getElementById('f-filter-exclude').value = arrToCsv(f.exclude);
  document.getElementById('f-filter-cc').value = arrToCsv(f.cc);
  document.getElementById('f-filter-destined').value = arrToCsv(f.destined_to);
  document.getElementById('f-filter-forwarded').value = arrToCsv(f.forwarded_from);

  document.getElementById('f-unread').checked = (p.only_unread === true);
  document.getElementById('f-audio').checked = (p.audio_actif === true);
  document.getElementById('f-voice').value = p.voice || 'alloy';
  document.getElementById('f-speed').value = p.speed || 1.0;
  document.getElementById('f-sort').value = p.sort_mode || 'date_desc';
  document.getElementById('f-lang').value = p.language || 'fr';
  document.getElementById('f-categories').value = p.categories || '';
  document.getElementById('f-status').checked = (String(p.status).toLowerCase() === 'active');

  const assignEmailInput = document.getElementById('f-assign-email');
  const unassignBtn = document.getElementById('btn-unassign');
  const assignStatus = document.getElementById('assign-status');
  if (p.assigned_to_email) {
    assignEmailInput.value = p.assigned_to_email;
    unassignBtn.style.display = 'inline-block';
    assignStatus.textContent = `Assigné à : ${p.assigned_to_email}`;
  } else {
    assignEmailInput.value = '';
    unassignBtn.style.display = 'none';
    assignStatus.textContent = "Non assigné (Orphelin)";
  }
  document.getElementById('profile-editor').scrollIntoView({ behavior: 'smooth' });
};

window.initAdminEditorListeners = function () {
  if (window._adminEditorListenersAttached) return;
  window._adminEditorListenersAttached = true;

  const closeBtn = document.getElementById('editor-close');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    document.getElementById('profile-editor').style.display = 'none';
    ADMIN_EDITOR_ID = null;
  });

  const saveBtn = document.getElementById('save-settings');
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    if (!ADMIN_EDITOR_ID) return;
    const errDiv = document.getElementById('editor-error');
    const okDiv = document.getElementById('editor-ok');
    errDiv.style.display = 'none'; okDiv.style.display = 'none';

    const normalizeTime = (t) => {
      if (!t) return null;
      const m = t.match(/^(\d{1,2}):(\d{2})$/);
      if (m) return `${m[1].padStart(2, '0')}:${m[2]}:00`;
      return t.length === 8 ? t : null;
    };
    const tz = document.getElementById('f-timezone').value.trim();
    const cleanStart = normalizeTime(document.getElementById('f-start').value);
    const cleanEnd = normalizeTime(document.getElementById('f-end').value);
    if (!tz || !cleanStart || !cleanEnd) { errDiv.style.display = 'block'; errDiv.innerText = "Champs invalides"; return; }

    const csvToArr = (s) => s.split(',').map(x => x.trim()).filter(x => x.length > 0);
    const payload = {
      timezone: tz, heure_debut: cleanStart, heure_fin: cleanEnd,
      jours_arriere_start: parseInt(document.getElementById('f-days-start').value) || 0,
      jours_arriere_end: parseInt(document.getElementById('f-days-end').value) || 0,
      debug_mode: document.getElementById('f-debug').checked,
      status: document.getElementById('f-status').checked ? 'Active' : 'Inactive',
      filters: {
        sender: csvToArr(document.getElementById('f-filter-sender').value),
        exclude: csvToArr(document.getElementById('f-filter-exclude').value),
        cc: csvToArr(document.getElementById('f-filter-cc').value),
        destined_to: csvToArr(document.getElementById('f-filter-destined').value),
        forwarded_from: csvToArr(document.getElementById('f-filter-forwarded').value)
      },
      only_unread: document.getElementById('f-unread').checked,
      audio_actif: document.getElementById('f-audio').checked,
      voice: document.getElementById('f-voice').value,
      speed: parseFloat(document.getElementById('f-speed').value),
      sort_mode: document.getElementById('f-sort').value,
      language: document.getElementById('f-lang').value,
      categories: document.getElementById('f-categories').value.trim()
    };

    try {
      const res = await fetch(apiUrl(`/profiles/${ADMIN_EDITOR_ID}/settings`), {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), credentials: 'include'
      });
      if (!res.ok) throw new Error(await res.text());
      okDiv.style.display = 'block'; okDiv.textContent = "Sauvegardé !";
      if (ADMIN_PROFILES_BY_ID.has(ADMIN_EDITOR_ID)) Object.assign(ADMIN_PROFILES_BY_ID.get(ADMIN_EDITOR_ID), payload);
    } catch (e) { errDiv.style.display = 'block'; errDiv.textContent = e.message; }
  });

  const btnAssign = document.getElementById('btn-assign');
  if (btnAssign) btnAssign.addEventListener('click', async () => {
    if (!ADMIN_EDITOR_ID) return;
    const email = document.getElementById('f-assign-email').value.trim();
    if (!email) return alert("Email requis");
    try {
      await fetch(apiUrl('/admin/assign'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile_id: ADMIN_EDITOR_ID, user_email: email }), credentials: 'include' });
      alert("Assigné !");
      window.openAdminEditor(ADMIN_EDITOR_ID);
    } catch (e) { alert(e.message); }
  });

  const btnUnassign = document.getElementById('btn-unassign');
  if (btnUnassign) btnUnassign.addEventListener('click', async () => {
    if (!ADMIN_EDITOR_ID) return;
    if (!confirm("Retirer l'assignation ?")) return;
    try {
      await fetch(apiUrl(`/admin/assign/${ADMIN_EDITOR_ID}`), { method: 'DELETE', credentials: 'include' });
      alert("Désassigné !");
      window.openAdminEditor(ADMIN_EDITOR_ID);
    } catch (e) { alert(e.message); }
  });

  // Bind DELETE Profile in editor (distinct from table icon)
  const btnDel = document.getElementById('btn-delete-profile');
  if (btnDel) btnDel.addEventListener('click', async () => {
    if (!ADMIN_EDITOR_ID || !confirm("Supprimer ce profil ?")) return;
    try {
      const res = await fetch(apiUrl(`/admin/api/recap-profiles/${ADMIN_EDITOR_ID}`), { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error("Erreur supression");
      alert("Profil supprimé");
      document.getElementById('profile-editor').style.display = 'none';
      // Try to find row and remove it
      const row = document.getElementById(`profile-row-${ADMIN_EDITOR_ID}`);
      if (row) row.remove();
      ADMIN_EDITOR_ID = null;
    } catch (e) { alert(e.message); }
  });
};

// =========================================================
// ANALYTICS LOGIC (Simplified)
// =========================================================
const DEBUG_ANALYTICS = new URLSearchParams(window.location.search).has('analytics_debug');
function uuidv4() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }
const PAGE_ID = uuidv4();
let hasConsented = false;
try { hasConsented = JSON.parse(localStorage.getItem(CONSENT_KEY) || '{}').analytics === true; } catch (e) { }

function sendEvent(payload) {
  if (!hasConsented) return;
  const full = { ...payload, path: window.location.pathname, ts: Date.now(), page_id: PAGE_ID, referrer: document.referrer || null };
  if (DEBUG_ANALYTICS) console.log('[Analytics]', full);
  fetch(apiUrl('/portal-api/a/collect'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(full), keepalive: true, credentials: 'include' }).catch(() => { });
}
function trackPageview() { sendEvent({ event: 'pageview' }); }

function initCookieBanner() {
  if (localStorage.getItem(CONSENT_KEY)) return;
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `<div><h4>🍪 Cookies</h4><p>Statistiques anonymes.</p></div><div class="cookie-actions"><button id="cookie-accept" class="btn btn-primary">Accepter</button><button id="cookie-decline" class="btn btn-ghost">Refuser</button></div>`;
  document.body.appendChild(banner);
  requestAnimationFrame(() => banner.classList.add('visible'));
  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: true }));
    hasConsented = true; banner.remove(); trackPageview();
  });
  document.getElementById('cookie-decline').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: false }));
    hasConsented = false; banner.remove();
  });
}

function initHeartbeat() { setInterval(() => { if (document.visibilityState === 'visible' && hasConsented) sendEvent({ event: 'heartbeat' }); }, 15000); }

// =========================================================
// MAIN INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Mobile Nav
  window.initMobileNav();

  // General Inits
  window.initBriefAudio();
  window.initRevealAnimations();
  window.initYear();
  window.initPricingSwitch();
  window.initPlanSelection();

  // Forms & Analytics
  window.initContactForm();
  initCookieBanner();

  if (hasConsented) trackPageview();
  initHeartbeat();

  document.querySelectorAll('#logout-btn, [data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); if (window.doLogout) window.doLogout(); });
  });

  // Init User Dashboard
  if (document.getElementById('profiles-body')) {
    setupChipInput('container-sender', 'f-filtre-sender');
    setupChipInput('container-exclude', 'f-exclude-sender');
    setupChipInput('container-cc', 'f-filtre-cc');

    try {
      const res = await fetch(apiUrl('/me'), { credentials: 'include' });
      if (res.status === 401) window.location.href = 'login.html';
      const user = await res.json();
      if (document.getElementById('user-email')) document.getElementById('user-email').textContent = user.email;
      const resMail = await fetch(apiUrl('/my/mailboxes'), { credentials: 'include' });
      if (resMail.ok) {
        let data = await resMail.json();
        if (Array.isArray(data)) USER_MAILBOXES = data;
        else if (data && data.connected) USER_MAILBOXES = [data];
      }
      if (window.loadProfiles) window.loadProfiles();
    } catch (e) { console.error(e); }
  }

  // Init Admin Dashboard
  if (window.location.pathname.includes('/admin/dashboard.html')) {
    if (window.initAdminDashboard) window.initAdminDashboard();
  }

  // Init OnScroll
  window.onScroll();
});

window.addEventListener('scroll', window.onScroll, { passive: true });
window.addEventListener('scroll', () => { /* simplistic scroll track */ }, { passive: true });
