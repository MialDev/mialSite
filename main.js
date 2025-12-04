// main.js
(() => {
  'use strict';

  const header = document.getElementById('site-header');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastY = window.scrollY || 0;
  let upAccum = 0;
  const SCROLL_THRESHOLD = 6;

  /* ---------- NAV : hide / show en scroll ---------- */
  function onScroll() {
    const y = window.scrollY || 0;
    const dy = y - lastY;
    const goingDown = dy > 0;

    if (goingDown) {
      upAccum = 0;
      if (y > SCROLL_THRESHOLD && header) {
        header.classList.add('nav-hidden');
      }
    } else {
      upAccum += Math.abs(dy);
      if (header) {
        if (upAccum > SCROLL_THRESHOLD) header.classList.remove('nav-hidden');
        if (y < SCROLL_THRESHOLD) header.classList.remove('nav-hidden');
      }
    }

    lastY = y;

    // Si l'utilisateur demande moins d'animations : on ne rajoute rien ici
    if (prefersReducedMotion.matches) return;
  }

  /* ---------- Nav mobile : burger ---------- */
  function initMobileNav() {
    if (!header) return;
    const toggle = header.querySelector('.nav-toggle');
    const links = header.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      header.classList.toggle('nav-open');
    });

    // fermer le menu quand on clique sur un lien
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        header.classList.remove('nav-open');
      }
    });
  }

  /* ---------- Avis : ouverture/fermeture au clic ---------- */
  function initReviews() {
    const cards = document.querySelectorAll('.review-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('click', () => {
        card.classList.toggle('is-open');
      });
    });
  }

  /* ---------- Brief audio : play / pause + icône ---------- */
  function initBriefAudio() {
    const audio = document.getElementById('brief-audio');
    const btn   = document.getElementById('brief-audio-button');
    const icon  = document.getElementById('brief-audio-icon');

    if (!audio || !btn || !icon) return;

    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => {
          // si le navigateur bloque l'auto-play, on ne fait rien de spécial
        });
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', () => {
      btn.classList.add('is-playing');
      icon.textContent = '⏸';
    });

    const resetState = () => {
      btn.classList.remove('is-playing');
      icon.textContent = '▶';
    };

    audio.addEventListener('pause', resetState);
    audio.addEventListener('ended', resetState);
  }

  /* ---------- Année du footer ---------- */
  function initYear() {
    const el = document.getElementById('year');
    if (!el) return;
    el.textContent = new Date().getFullYear();
  }

  /* ---------- Helper générique : séquence "jelly" au scroll ---------- */
  function setupSequentialReveal({
    sectionSelector,      // ex: '.section-audience' (peut être null)
    cardSelector,         // ex: '.persona-card' ou '.section-features .card'
    threshold = 0.35,
    delay = 140,
    resetOnExit = false,  // true = rejouer à chaque fois qu'on quitte totalement l'écran
    toggleWaveClass = false // true = gérer .section-audience-active sur la section
  }) {
    const cards = document.querySelectorAll(cardSelector);
    if (!cards.length) return;

    const section = sectionSelector ? document.querySelector(sectionSelector) : null;

    // Si l'utilisateur ne veut pas d'animations ou si IntersectionObserver n'est pas dispo
    if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
      cards.forEach(card => card.classList.add('visible'));
      if (toggleWaveClass && section) {
        section.classList.add('section-audience-active');
      }
      return;
    }

    // cible observée : la section si fournie, sinon le parent du 1er élément
    const target = section || cards[0].parentElement;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const fullyOut =
          !entry.isIntersecting &&
          (entry.boundingClientRect.bottom <= 0 ||
           entry.boundingClientRect.top >= window.innerHeight);

        if (resetOnExit && fullyOut) {
          // reset complet
          cards.forEach(card => card.classList.remove('visible'));
          if (toggleWaveClass && section) {
            section.classList.remove('section-audience-active');
          }
          return;
        }

        if (entry.isIntersecting) {
          if (toggleWaveClass && section) {
            section.classList.add('section-audience-active');
          }

          // séquence de "pop" : gauche → droite
          cards.forEach((card, index) => {
            if (card.classList.contains('visible')) return;
            setTimeout(() => {
              card.classList.add('visible');
            }, index * delay);
          });
        }
      });
    }, { threshold });

    observer.observe(target);
  }

  /* ---------- Section "Mise en place" ---------- */
  function initHowReveal() {
    setupSequentialReveal({
      sectionSelector: '.section-how',
      cardSelector: ' .card-glass-jelly .h',
      threshold: 0.25,
      delay: 140,
      resetOnExit: false,
      toggleWaveClass: false
    });
  }

  /* ---------- Initialisation des séquences jelly ---------- */
  function initJellySections() {
    // 1) Personas "Pour qui" : reset quand la section sort entièrement, vague de fond
    setupSequentialReveal({
      sectionSelector: '.section-audience',
      cardSelector: '.card-glass-jelly',
      threshold: 0.25,
      delay: 140,
      resetOnExit: true,
      toggleWaveClass: true
    });

    // 2) Cartes "Ce que Mial peut faire" : on exclut la carte d'intro
    setupSequentialReveal({
      sectionSelector: '.section-features ',
      cardSelector: '.card.feature-card',
      threshold: 0.25,
      delay: 140,
      resetOnExit: false,
      toggleWaveClass: false
    });
  }

  /* ---------- Initialisation globale ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initReviews();
    initBriefAudio();
    initJellySections();
    initHowReveal();
    initYear();
    onScroll();
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

})();
