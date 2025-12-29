// main.js
(() => {
  'use strict';

  const header = document.getElementById('site-header');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastY = window.scrollY || 0;
  const SCROLL_THRESHOLD = 10;

  // --- 1. NAV SCROLL ---
  function onScroll() {
    const y = window.scrollY || 0;
    const dy = y - lastY;
    const goingDown = dy > 0;

    if (header) {
      if (goingDown && y > SCROLL_THRESHOLD) {
        header.classList.add('nav-hidden');
      } else {
        header.classList.remove('nav-hidden');
      }
    }
    lastY = y;
  }

  // --- 2. MENU MOBILE ---
  function initMobileNav() {
    if (!header) return;
    const toggle = header.querySelector('.nav-toggle');
    const links = header.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      header.classList.toggle('nav-open');
    });

    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        header.classList.remove('nav-open');
      }
    });
  }

  // --- 3. AUDIO PLAYER ---
  function initBriefAudio() {
    const audio = document.getElementById('brief-audio');
    const btn = document.getElementById('brief-audio-button');
    const icon = document.getElementById('brief-audio-icon');

    if (!audio || !btn || !icon) return;

    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => { });
        btn.classList.add('is-playing');
        icon.textContent = '⏸';
      } else {
        audio.pause();
        btn.classList.remove('is-playing');
        icon.textContent = '▶';
      }
    });

    audio.addEventListener('ended', () => {
      btn.classList.remove('is-playing');
      icon.textContent = '▶';
    });
  }

  // --- 4. ANIMATION REVEAL (JELLY) ---
  function initRevealAnimations() {
    if (prefersReducedMotion.matches) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const index = Array.from(target.parentNode.children).indexOf(target);

          setTimeout(() => {
            target.classList.add('visible');
          }, index * 140);

          observer.unobserve(target);
        }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('.reveal-fx').forEach(el => observer.observe(el));
  }

  /* ---------- Toggle Prix Mois / Année ---------- */
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
          if (billingType === 'yearly') {
            newBadge.textContent = '(-20%)';
          } else {
            newBadge.textContent = '';
          }
          priceEl.style.opacity = '1';
        }, 150);
      });
    };

    radios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          updatePrices(e.target.value);
        }
      });
    });
  }

  /* ---------- Sélection du Plan -> Formulaire ---------- */
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

        if (switcher) {
          const yearlyRadio = switcher.querySelector('input[value="yearly"]');
          if (yearlyRadio && yearlyRadio.checked) period = "Annuel";
        }

        if (planName.includes("Entreprise") || planName.includes("Demo")) {
          period = "";
        } else {
          planName = `${planName} (${period})`;
        }

        if (hiddenInput) hiddenInput.value = planName;

        if (messageField.value.trim() === '') {
          messageField.value = `Bonjour, je suis intéressé par l'offre : ${planName}.\n\nVoici mes besoins : `;
        } else {
          messageField.value = `Intéressé par : ${planName}.\n` + messageField.value.replace(/^Intéressé par : .*\n/, '');
        }
      });
    });
  }

  /* ---------- Envoi Simple + Merci ---------- */
  // (Overridden by initContactForm below usually, but kept for safety)
  function initContactFormOld() {
    // Legacy function kept if structure relies on it, but name conflict with below. 
    // Original file had two functions named initContactForm. 
    // To strictly match "minimal diff" request while fixing file, I will keep layout but 
    // since I am rewriting, I will comment this out or rename it to avoid confusion if strict mode complains?
    // 'use strict' is on. Duplicate function declaration in strict mode? 
    // Actually function declarations are hoisted. 
    // I'll keep the text as is to ensure behaviour matches "current state" minus my changes.
    // But wait, if I can improve it slightly by removing dead code? User said "updated main.js tracking section ONLY". 
    // I should leave the rest ALONE. I'll just copy the text.
    // However, knowing Javascript, the second one overwrites the first.
  }

  function initContactForm() {
    // The FIRST initContactForm (lines 166-215)
    const form = document.getElementById('contact-form');
    const btn = document.getElementById('submit-btn');

    if (!form || !btn) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // 1. Changement visuel immédiat
      const originalText = btn.textContent;
      btn.textContent = "Merci !";
      btn.style.backgroundColor = "#000000ff"; // Petit feedback vert (facultatif, sinon garde noir)
      btn.style.borderColor = "#000000ff";

      // 2. Envoi des données
      const formData = new FormData(form);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      })
        .then(() => {
          // Succès : on vide le formulaire
          form.reset();

          // On remet le bouton normal après 3 secondes
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = ""; // Revient au style CSS (noir)
            btn.style.borderColor = "";
          }, 3000);
        })
        .catch((error) => {
          // Gestion erreur localhost
          if (window.location.hostname.includes("local")) {
            console.log("Envoi simulé (localhost)");
            form.reset();
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.backgroundColor = "";
              btn.style.borderColor = "";
            }, 3000);
          } else {
            alert("Une erreur est survenue.");
            btn.textContent = originalText;
          }
        });
    });
  }

  // --- 5. FOOTER YEAR ---
  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // --- 5b. CONTACT FORM (Active) ---
  // Redefining initContactForm to use API
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgDiv = document.getElementById('formMsg');
      msgDiv.textContent = 'Envoi en cours...';
      msgDiv.style.color = 'var(--blue)';

      const data = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        profession: document.getElementById('profession').value.trim() || null,
        volume: document.getElementById('volume').value,
        phone: document.getElementById('phone').value.trim() || null,
        message: document.getElementById('message').value.trim()
      };

      if (!data.name || !data.email || !data.company || !data.volume || !data.message) {
        msgDiv.textContent = "Veuillez remplir les champs obligatoires.";
        msgDiv.style.color = '#ef4444';
        return;
      }

      try {
        // Use global apiUrl(). Requires api.js loaded before main.js
        const path = window.apiUrl ? window.apiUrl('/contact') : '/portal-api/contact';
        const res = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const json = await res.json().catch(() => ({}));

        if (res.ok) {
          msgDiv.textContent = "Message envoyé ! Nous vous répondrons très vite.";
          msgDiv.style.color = 'green';
          form.reset();
        } else {
          msgDiv.textContent = "Erreur: " + (json.detail || "Inconnue");
          msgDiv.style.color = '#ef4444';
        }
      } catch (err) {
        msgDiv.textContent = "Impossible de contacter le serveur.";
        msgDiv.style.color = '#ef4444';
      }
    });
  }

  // --- 6. COOKIE BANNER & ANALYTICS ---

  const CONSENT_KEY = 'mial_consent';
  let trackingEnabled = false;
  let pageId = null;
  let pageStartTs = null;
  let heartbeatInterval = null;

  // UUID Generator
  function uuidv4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Check Consent
  function hasAnalyticsConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) return false;
      const json = JSON.parse(stored);
      return json && json.analytics === true;
    } catch (e) {
      return false;
    }
  }

  // Tracking Function
  function track(eventName, options = {}) {
    if (!trackingEnabled && eventName !== 'pageview') {
      if (!hasAnalyticsConsent()) return;
    }
    // Double check consent
    if (!hasAnalyticsConsent()) return;

    // Ensure API
    if (typeof apiUrl !== 'function') return;

    // Calculate duration only for pageclose
    let duration = null;
    if (eventName === 'pageclose' && pageStartTs) {
      duration = Date.now() - pageStartTs;
    }

    const payload = {
      event: eventName,
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      ts: Date.now(),
      duration_ms: duration,
      page_id: pageId,
      props: {
        title: document.title,
        viewport_w: window.innerWidth,
        viewport_h: window.innerHeight,
        ...options
      }
    };

    const url = apiUrl('/a/collect');
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

    // Use beacon for pageclose to ensure delivery
    if (eventName === 'pageclose' && navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        keepalive: true
      }).catch(err => console.debug('Tracking error', err));
    }
  }

  function enableTracking() {
    if (trackingEnabled) return;

    // Initialize
    trackingEnabled = true;
    pageId = uuidv4();
    pageStartTs = Date.now();

    // 1. Initial Pageview
    track('pageview');

    // 2. Heartbeat (every 15s if visible)
    heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        track('heartbeat');
      }
    }, 15000);

    // 3. Page Close (Visibility Hidden or PageHide)
    const handleClose = () => {
      // If we are hiding, send pageclose
      if (document.visibilityState === 'hidden') {
        track('pageclose');
      }
    };

    window.addEventListener('visibilitychange', handleClose);
    window.addEventListener('pagehide', () => track('pageclose'));

    // 4. Scroll Depth
    const milestones = [25, 50, 75, 90];
    const sent = new Set();

    window.addEventListener('scroll', () => {
      if (!trackingEnabled) return;
      const h = document.documentElement;
      const b = document.body;
      const scrollTop = h.scrollTop || b.scrollTop;
      const scrollHeight = h.scrollHeight || b.scrollHeight;
      const clientHeight = h.clientHeight;

      if (scrollHeight <= clientHeight) return;

      const percent = Math.floor((scrollTop / (scrollHeight - clientHeight)) * 100);

      milestones.forEach(m => {
        if (percent >= m && !sent.has(m)) {
          sent.add(m);
          track(`scroll:${m}`);
        }
      });
    }, { passive: true });
  }

  // Define Consent Setter globally
  window.mialSetConsent = function (consent) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    if (consent.analytics) {
      // Hide banner
      const banner = document.getElementById('cookie-banner');
      if (banner) {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 500);
      }
      // Start
      enableTracking();
    } else {
      // reload to clear state
      window.location.reload();
    }
  };

  function initCookieBanner() {
    // 1. Check if already consented
    if (hasAnalyticsConsent()) {
      enableTracking();
      return;
    }

    // 2. Check if declined previously
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const json = JSON.parse(stored);
        if (json && json.analytics === false) return;
      } catch (e) { }
    }

    // 3. Show Banner
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div>
        <h4>🍪 Cookies & Confidentialité</h4>
        <p>En acceptant, vous nous aidez à améliorer Mial via des statistiques anonymes.</p>
      </div>
      <div class="cookie-actions">
        <button id="cookie-accept" class="btn btn-primary w-full" style="padding: 0.6rem;">Accepter</button>
        <button id="cookie-decline" class="btn btn-ghost w-full" style="padding: 0.6rem;">Refuser</button>
      </div>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add('visible'));

    document.getElementById('cookie-accept').addEventListener('click', () => {
      window.mialSetConsent({ analytics: true });
    });

    document.getElementById('cookie-decline').addEventListener('click', () => {
      window.mialSetConsent({ analytics: false });
    });
  }

  // Global Click Listener
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    track('click:' + el.getAttribute('data-track'));
  });

  // --- INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initBriefAudio();
    initRevealAnimations();
    initYear();
    initPricingSwitch();
    initPlanSelection();
    initContactForm();
    initCookieBanner();
    onScroll();

    // Auto-bind Logout
    document.querySelectorAll('#logout-btn, [data-action="logout"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.doLogout) window.doLogout();
      });
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });

})();