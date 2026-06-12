/* =============================================================
   TEAM NEXUS — interactions
   - sticky-nav shadow on scroll
   - mobile menu toggle
   - active-section highlight in the nav (scroll spy)
   ============================================================= */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  /* ---- sticky-nav shadow ---- */
  function onScroll() {
    if (window.scrollY > 8) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- mobile menu ---- */
  function closeMenu() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // tapping any link closes the drawer
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeMenu();
  });

  /* ---- scroll spy: highlight the section currently in view ---- */
  var sections = ['mission', 'stack', 'members', 'objectives', 'resources']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  var navAnchors = {};
  links.querySelectorAll('a[href^="#"]').forEach(function (a) {
    navAnchors[a.getAttribute('href').slice(1)] = a;
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          Object.values(navAnchors).forEach(function (a) { a.classList.remove('active'); });
          var active = navAnchors[entry.target.id];
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---- resource filter (pill-tabs) ---- */
  var filterBar = document.getElementById('resFilter');
  if (filterBar) {
    var groups = document.querySelectorAll('.res-group');
    var resNote = document.querySelector('.res-note');
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.pill-tab');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');

      filterBar.querySelectorAll('.pill-tab').forEach(function (p) {
        p.classList.toggle('active', p === btn);
      });
      groups.forEach(function (g) {
        var show = cat === 'all' || g.getAttribute('data-cat') === cat;
        g.classList.toggle('is-hidden', !show);
      });
      // the "持续补充" note only makes sense in the full view
      if (resNote) resNote.style.display = (cat === 'all') ? '' : 'none';
    });
  }

  /* ---- back-to-top ---- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
