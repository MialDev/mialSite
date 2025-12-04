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
    const btn   = document.getElementById('brief-audio-button');
    const icon  = document.getElementById('brief-audio-icon');

    if (!audio || !btn || !icon) return;

    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => {});
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
          // Ajoute un délai basé sur l'index pour effet cascade
          const index = Array.from(target.parentNode.children).indexOf(target);
          
          setTimeout(() => {
            target.classList.add('visible');
          }, index * 140); // 140ms délai original

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

    // Fonction pour mettre à jour l'affichage
    const updatePrices = (billingType) => {
      priceElements.forEach(priceEl => {
        // 1. Récupérer le montant
        const amount = priceEl.getAttribute(`data-${billingType}`);
        
        // --- CORRECTION ---
        // Si aucun montant n'est défini (cas "Sur devis"), on ne fait RIEN.
        if (!amount) return; 
        
        // Animation simple
        priceEl.style.opacity = '0';
        
        setTimeout(() => {
            // 2. Mettre à jour le prix
            priceEl.innerHTML = `€${amount} <span>/mo</span> <span class="discount-badge"></span>`;
            
            // 3. Gérer le badge (-20%) uniquement si c'est annuel
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

/* ---------- Effet Bouton Envoyer + Soumission AJAX ---------- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const btn = document.getElementById('submit-btn');
    const btnText = btn ? btn.querySelector('.btn-text') : null;
    const particlesContainer = document.getElementById('particles-container');

    if (!form || !btn) return;

    const createSplash = () => {
      const particleCount = 16; 
      
      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('span');
        p.classList.add('particle');
        
        // Calcul d'une direction aléatoire autour du bouton
        const angle = Math.random() * Math.PI * 2;
        // Distance de projection (entre 60px et 100px)
        const velocity = 60 + Math.random() * 40; 
        
        const tx = Math.cos(angle) * velocity + 'px';
        const ty = Math.sin(angle) * velocity + 'px';
        
        // On passe les variables au CSS
        p.style.setProperty('--tx', tx);
        p.style.setProperty('--ty', ty);
        
        // Lancement de l'animation
        p.style.animation = `splash 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards`;
        
        particlesContainer.appendChild(p);
        
        // Nettoyage après l'anim
        setTimeout(() => p.remove(), 800);
      }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Animation visuelle immédiate
        createSplash(); // SPLASH !
        
        if(btnText) {
            // Petit effet de switch de texte
            btnText.style.opacity = '0';
            btnText.style.transform = 'scale(0.5)';
            setTimeout(() => {
                btnText.textContent = "Merci !";
                btnText.style.opacity = '1';
                btnText.style.transform = 'scale(1)';
            }, 200);
        }

        // 2. Envoi des données (Fetch)
        const formData = new FormData(form);
        fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(formData).toString(),
        })
        .then(() => {
            // Succès
            form.reset();
            setTimeout(() => {
                if(btnText) btnText.textContent = "Envoyer";
            }, 4000);
        })
        .catch((error) => {
            // Ignore l'erreur si on est en localhost (Failed to fetch)
            if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                console.log("Envoi simulé (localhost) : Formulaire soumis !");
                form.reset();
                return;
            }
            alert("Oups, une erreur est survenue.");
        });
    });
  }

  // --- 5. FOOTER YEAR ---
  function initYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
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
    onScroll();
  });

  window.addEventListener('scroll', onScroll, { passive: true });

})();