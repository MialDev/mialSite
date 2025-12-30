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
