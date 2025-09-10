
(function(){
  const header = document.getElementById('site-header');
  let lastY = window.scrollY || 0;
  let upAccum = 0;
  const threshold = 6;

  function onScroll(){
    const y = window.scrollY || 0;
    const dy = y - lastY;
    const goingDown = dy > 0;

    if (goingDown){
      upAccum = 0;
      if (y > threshold) header.classList.add('nav-hidden');
    } else {
      upAccum += Math.abs(dy);
      if (upAccum > 6) header.classList.remove('nav-hidden');
      if (y < 6) header.classList.remove('nav-hidden');
    }
    lastY = y;

    // Logo animation limited to HERO only
    const hero = document.getElementById('home');
    const logo = document.querySelector('.hero-logo');
    if (hero && logo){
      const rect = hero.getBoundingClientRect();
      // progress: 0 at hero top = viewport top; 1 when hero has scrolled past its height
      let p = (-rect.top) / Math.max(rect.height, 1);
      p = Math.max(0, Math.min(1, p));
      const scale = 1 - 0.15*p;      // 1 -> 0.85
      const rot = -6*p;              // 0deg -> -6deg
      const ty = -8*p;               // 0px -> -8px
      logo.style.transform = `translateY(${ty}px) rotate(${rot}deg) scale(${scale})`;
    }
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('DOMContentLoaded', function(){
    // set current year
    var y = new Date().getFullYear();
    var el = document.getElementById('year'); if (el) el.textContent = y;
    onScroll();
  });
})();
