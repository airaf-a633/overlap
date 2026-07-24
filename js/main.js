(function () {
  // Sticky nav shadow on scroll
  var header = document.getElementById('site-header');
  function onScroll() {
    if (window.scrollY > 8) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var panel = document.getElementById('mobile-panel');
  var openBtn = document.getElementById('menu-open');
  var closeBtn = document.getElementById('menu-close');

  function openMenu() {
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }
  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  // Scroll reveal — content is visible by default (see CSS); this only
  // adds the "in-view" class that triggers the reveal transition.
  var revealEls = document.querySelectorAll('[data-reveal], [data-reveal-group]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  // Coverage bar fill-in
  var fill = document.querySelector('.coverage-bar .fill');
  if (fill && 'IntersectionObserver' in window) {
    var fillObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            fill.classList.add('filled');
            fillObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    fillObserver.observe(fill);
  }
})();
