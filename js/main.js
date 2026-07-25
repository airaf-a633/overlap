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

  // Timeline bands draw in when scrolled into view
  var timeline = document.querySelector('.timeline');
  if (timeline && 'IntersectionObserver' in window) {
    var tlObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            timeline.classList.add('in-view');
            tlObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    tlObserver.observe(timeline);
  }

  // Live clocks — the shared working window is the whole pitch, so show it real.
  var clockUs = document.getElementById('clock-us');
  var clockPk = document.getElementById('clock-pk');
  var zoneUs = document.getElementById('zone-us');
  var status = document.getElementById('shift-status');

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
    if (zoneUs) zoneUs.textContent = 'Your side · ' + us.timeZoneName;

    // Team is on shift 6 AM – 3 PM ET, weekdays.
    var etHour = parseInt(us.hour, 10) % 12 + (us.dayPeriod === 'PM' ? 12 : 0);
    var weekend = us.weekday === 'Sat' || us.weekday === 'Sun';
    var onShift = !weekend && etHour >= 6 && etHour < 15;

    status.textContent = onShift ? 'Team on shift' : 'Next shift 6 AM ET';
    status.classList.toggle('off', !onShift);
  }

  if (clockUs && clockPk && status) {
    tick();
    setInterval(tick, 30000);
  }
})();
