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
  function initContactForm() {
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

  // --- 5b. CONTACT FORM ---
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

  // --- 6. COOKIE BANNER ---
  // --- 6. COOKIE BANNER (CONSENT V2) ---
  function initCookieBanner() {
    const CONSENT_KEY = 'mial_cookie_consent';
    const SCRIPT_URL = '/assets/js/analytics.js';

    // Global Consent Function
    window.mialSetConsent = function (consent) {
      if (consent.analytics) {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        loadAnalytics();
        closeBanner();
      } else {
        localStorage.setItem(CONSENT_KEY, 'declined');
        // Reload to ensure tracking is stopped/cleaned
        window.location.reload();
      }
    };

    function loadAnalytics() {
      // Avoid double load
      if (document.querySelector(`script[src="${SCRIPT_URL}"]`)) return;
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }

    function closeBanner() {
      const banner = document.getElementById('cookie-banner');
      if (banner) {
        banner.classList.remove('visible');
        setTimeout(() => banner.remove(), 500);
      }
    }

    // Check existing consent
    const current = localStorage.getItem(CONSENT_KEY);
    if (current === 'accepted') {
      loadAnalytics();
      return; // Banner hidden
    } else if (current === 'declined') {
      return; // Banner hidden, tracking off
    }

    // Show Banner if no choice yet
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

    // Animation
    requestAnimationFrame(() => banner.classList.add('visible'));

    // Listeners
    document.getElementById('cookie-accept').addEventListener('click', () => {
      window.mialSetConsent({ analytics: true });
    });

    document.getElementById('cookie-decline').addEventListener('click', () => {
      window.mialSetConsent({ analytics: false });
    });
  }

  // --- 8. TRACKING ---
  function track(event, path, referrer) {
    // Check availability of apiUrl (api.js must be loaded)
    if (typeof apiUrl !== 'function') return;

    const payload = {
      event: event,
      path: path || window.location.pathname,
      referrer: referrer || null,
      ts: Date.now()
    };

    try {
      fetch(apiUrl('/a/collect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        keepalive: true
      }).catch(err => console.debug('Tracking error', err));
    } catch (e) { /* ignore */ }
  }

  // Global Click Listener for data-track
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    track('click:' + el.getAttribute('data-track'), window.location.pathname, document.referrer);
  });

  // --- INIT ---
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

    // Initial Pageview
    if (!window.__mialTracked) {
      window.__mialTracked = true;
      track('pageview', window.location.pathname + window.location.search, document.referrer);
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });

})();