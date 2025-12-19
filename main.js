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

  // --- 6. COOKIE BANNER ---
  function initCookieBanner() {
    const CONSENT_KEY = 'mial_cookie_consent';
    if (localStorage.getItem(CONSENT_KEY)) return; // Déjà répondu

    // Création du HTML
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <div>
        <h4>🍪 Cookies & Confidentialité</h4>
        <p>Cela nous aide pour le développement de notre projet. Les données sont anonymisées.</p>
      </div>
      <div class="cookie-actions">
        <button id="cookie-accept" class="btn btn-primary w-full" style="padding: 0.6rem;">Accepter</button>
        <button id="cookie-decline" class="btn btn-ghost w-full" style="padding: 0.6rem;">Refuser</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Animation d'entrée
    requestAnimationFrame(() => {
      banner.classList.add('visible');
    });

    // Listeners
    document.getElementById('cookie-accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      closeBanner();
    });

    document.getElementById('cookie-decline').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'declined');
      closeBanner();
    });

    function closeBanner() {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 500);
    }
  }

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
  });

  window.addEventListener('scroll', onScroll, { passive: true });

})();