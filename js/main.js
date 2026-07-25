(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     Inertial scrolling.
     Wheel/trackpad input is damped so the page glides to a stop instead
     of snapping. Touch is left native — phones already have momentum
     scrolling and hijacking it feels worse, not better. Skipped entirely
     under reduced-motion, and skipped if the CDN script did not load, in
     which case native scrolling just carries on.
     --------------------------------------------------------------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.6
    });

    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(0);
  }

  // Anchor links: hand them to the scroller so in-page jumps ease the same
  // way the wheel does, and clear the sticky header on arrival.
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      if (!lenis) return; // native scroll-behavior:smooth handles it
      e.preventDefault();
      // No offset here — Lenis honours the target's scroll-margin-top, so
      // the header clearance is defined once in CSS and applies whether the
      // jump is eased by Lenis or by native smooth scrolling.
      lenis.scrollTo(target, { duration: 1.15 });
    });
  });

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

  function setExpanded(isOpen) {
    if (openBtn) openBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function openMenu() {
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();   // don't let the page glide behind the overlay
    setExpanded(true);
    // Send focus into the panel once it has faded up, so keyboard users
    // land on the first link rather than behind the overlay.
    var first = panel.querySelector('a[href^="#"]:not(.logo)');
    if (first) setTimeout(function () { first.focus(); }, 180);
  }

  function closeMenu(returnFocus) {
    if (!panel.classList.contains('open')) return;
    panel.classList.remove('open');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    setExpanded(false);
    if (returnFocus && openBtn) openBtn.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', function () { closeMenu(true); });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { closeMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu(true);
  });

  // A resize past the breakpoint should not leave the panel stuck open.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) closeMenu(false);
  });

  setExpanded(false);

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
      // Fires a little before the element is fully in view, so the stagger
      // is already underway by the time it reaches comfortable reading height.
      { threshold: 0.1, rootMargin: '0px 0px -90px 0px' }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  // Bands draw in when scrolled into view
  var bandEls = document.querySelectorAll('.timeline, .instrument');
  if (bandEls.length && 'IntersectionObserver' in window) {
    var tlObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            tlObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    bandEls.forEach(function (el) { tlObserver.observe(el); });
  }

  // Live clocks — the shared working window is the whole pitch, so show it real.
  var clockUs = document.getElementById('clock-us');
  var clockPk = document.getElementById('clock-pk');
  var zoneUs = document.getElementById('zone-us');
  var status = document.getElementById('shift-status');
  var nowMark = document.getElementById('oi-now');
  var footerClock = document.getElementById('footer-clock');

  function partsIn(tz, date) {
    var fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true,
      weekday: 'short', timeZoneName: 'short'
    });
    var out = {};
    fmt.formatToParts(date).forEach(function (p) { out[p.type] = p.value; });
    return out;
  }

  function tick() {
    var now = new Date();
    var us, pk;
    try {
      us = partsIn('America/New_York', now);
      pk = partsIn('Asia/Karachi', now);
    } catch (e) {
      return; // Intl timeZone unsupported — card keeps its static fallback text
    }

    clockUs.textContent = us.hour + ':' + us.minute + ' ' + us.dayPeriod;
    clockPk.textContent = pk.hour + ':' + pk.minute + ' ' + pk.dayPeriod;
    if (zoneUs) zoneUs.textContent = 'Your side · New York, ' + us.timeZoneName;

    // Team is on shift 6 AM – 3 PM ET, weekdays.
    var etHour = parseInt(us.hour, 10) % 12 + (us.dayPeriod === 'PM' ? 12 : 0);
    var etFrac = etHour + parseInt(us.minute, 10) / 60;
    var weekend = us.weekday === 'Sat' || us.weekday === 'Sun';
    var onShift = !weekend && etFrac >= 6 && etFrac < 15;
    var bothOnline = !weekend && etFrac >= 9 && etFrac < 15;

    status.textContent = bothOnline ? 'Both teams online now'
                       : onShift    ? 'Our team on shift'
                                    : 'Next shift 6 AM ET';
    status.classList.toggle('off', !onShift);

    // Live "now" needle across the 24-hour track.
    if (nowMark) {
      nowMark.style.left = (etFrac / 24 * 100).toFixed(2) + '%';
      nowMark.hidden = false;
    }

    if (footerClock) {
      footerClock.innerHTML = 'Lahore, PK · <b>' + pk.hour + ':' + pk.minute + ' ' + pk.dayPeriod + '</b> local';
    }
  }

  if (clockUs && clockPk && status) {
    tick();
    setInterval(tick, 30000);
  }
})();
