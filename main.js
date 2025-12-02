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
      // on descend → on cache la nav (après un petit seuil)
      upAccum = 0;
      if (y > SCROLL_THRESHOLD && header) {
        header.classList.add('nav-hidden');
      }
    } else {
      // on remonte → on réaffiche après un petit mouvement cumulé
      upAccum += Math.abs(dy);
      if (header) {
        if (upAccum > SCROLL_THRESHOLD) header.classList.remove('nav-hidden');
        if (y < SCROLL_THRESHOLD) header.classList.remove('nav-hidden');
      }
    }

    lastY = y;

    // Animation du logo uniquement si autorisé
    if (prefersReducedMotion.matches) return;

    const hero = document.getElementById('home');
    const logo = document.querySelector('.hero-logo'); // si tu l’utilises encore

    if (hero && logo) {
      const rect = hero.getBoundingClientRect();
      let p = (-rect.top) / Math.max(rect.height, 1); // 0 → 1 sur la hauteur du hero
      p = Math.max(0, Math.min(1, p));

      const scale = 1 - 0.15 * p; // 1 → 0.85
      const rot = -6 * p;         // 0deg → -6deg
      const ty = -8 * p;          // 0px → -8px

      logo.style.transform = `translateY(${ty}px) rotate(${rot}deg) scale(${scale})`;
    }
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

  /* ---------- Année du footer ---------- */
  function initYear() {
    const el = document.getElementById('year');
    if (!el) return;
    el.textContent = new Date().getFullYear();
  }

  /* ---------- Initialisation ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initReviews();
    initYear();
    onScroll(); // état initial de la nav + logo
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
