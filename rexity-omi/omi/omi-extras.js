/* omi-extras.js — adds three things to the Omi page:
   1. Nav click → smooth scroll to the matching iframe section.
   2. A 5-link legal footer strip ABOVE the existing dark footer:
      Impressum · Datenschutz · AGB · AEB · Erklärung zur Barrierefreiheit.
   3. Hides Webflow template artifacts: "Footer", "©Edition 10", "©Systems 03".
*/
(function () {
  var LOG = function (msg, obj) {
    try { console.log('[omi-extras] ' + msg, obj == null ? '' : obj); } catch (e) {}
  };

  // ============================================================
  // 1. Nav click → iframe section
  // ============================================================
  var NAV_MAP = {
    'about':    'welcome',
    'services': 'section-1027-10',
    'work':     'section-5070-10',
    'contact':  'contact-us',
  };

  function frame() { return document.getElementById('omi-it-frame'); }
  function wrap()  { return document.getElementById('omi-it-scroll'); }

  function scrollToIframeSection(sectionId) {
    var f = frame(), w = wrap();
    if (!f || !w) return false;
    try {
      var doc = f.contentDocument;
      if (!doc) return false;
      var el = doc.getElementById(sectionId);
      if (!el) return false;
      var top = 0, node = el;
      while (node) { top += node.offsetTop || 0; node = node.offsetParent; }
      var bannerOffset = 64;
      var parentTop = w.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      var target = Math.max(0, parentTop + top - bannerOffset);
      window.scrollTo({ top: target, behavior: 'smooth' });
      return true;
    } catch (e) { return false; }
  }

  function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href === 'index.html' || href === '/' || href === '#') {
      if (!a.hostname || a.hostname === window.location.hostname) {
        e.preventDefault(); scrollToTop(); return;
      }
    }
    if (href.charAt(0) !== '#') return;
    var hash = href.slice(1);
    if (!hash) { e.preventDefault(); scrollToTop(); return; }
    var target = NAV_MAP[hash];
    if (target && scrollToIframeSection(target)) e.preventDefault();
  }, true);

  // Shadow-DOM side menu binding (omi-nav.js)
  var sideTries = 0;
  var sideInt = setInterval(function () {
    var host = document.getElementById('omi-nav-host');
    if (host && host.shadowRoot && !host.__omiExtrasBound) {
      host.__omiExtrasBound = true;
      host.shadowRoot.addEventListener('click', function (e) {
        var a = e.composedPath().find(function (n) { return n && n.tagName === 'A'; });
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        var target = NAV_MAP[href.slice(1)];
        if (target && scrollToIframeSection(target)) e.preventDefault();
      }, true);
      LOG('shadow nav bound');
      clearInterval(sideInt);
    } else if (++sideTries > 30) clearInterval(sideInt);
  }, 300);

  // ============================================================
  // 2. Legal footer strip — full-width band BEFORE the dark footer
  // ============================================================
  function injectFooterStrip() {
    if (document.getElementById('omi-legal-strip')) return true;

    // Find the dark Rexity footer section (the one that holds .footer-grid).
    var grid = document.querySelector('.footer-grid');
    if (!grid) return false;

    // Walk up to the nearest <section> so we land OUTSIDE the grid layout.
    var section = grid;
    while (section && section.tagName && section.tagName.toLowerCase() !== 'section') {
      section = section.parentElement;
    }
    if (!section || !section.parentNode) return false;

    // Append our strip at the BOTTOM of the footer section (after the grid),
    // as a full-width band — sibling of the grid, not a grid child (avoids
    // the Webflow CSS Grid item-styles fighting us).
    var bar = document.createElement('div');
    bar.id = 'omi-legal-strip';
    bar.setAttribute('role', 'navigation');
    bar.setAttribute('aria-label', 'Legal');
    bar.style.cssText =
      'width:100%;box-sizing:border-box;' +
      'background:#070707;color:#fff;' +
      'padding:28px clamp(20px, 6vw, 80px);' +
      'border-top:1px solid rgba(255,255,255,.12);' +
      'display:flex;flex-wrap:wrap;gap:14px 28px;' +
      'justify-content:space-between;align-items:center;' +
      'font:13px/1.5 Inter, system-ui, -apple-system, sans-serif;';

    var copy = document.createElement('span');
    copy.textContent = '© ' + new Date().getFullYear() + ' Rexity Labs UG (haftungsbeschränkt) i. Gr.';
    copy.style.cssText = 'color:rgba(255,255,255,.7);font-weight:500;letter-spacing:.01em';

    var nav = document.createElement('nav');
    nav.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px 22px;align-items:center';

    [
      ['/impressum',        'Impressum'],
      ['/datenschutz',      'Datenschutz'],
      ['/agb',              'AGB'],
      ['/aeb',              'AEB'],
      ['/barrierefreiheit', 'Erklärung zur Barrierefreiheit'],
    ].forEach(function (pair, i, arr) {
      var a = document.createElement('a');
      a.href = pair[0];
      a.textContent = pair[1];
      a.style.cssText =
        'color:rgba(255,255,255,.85);text-decoration:none;' +
        'padding:2px 0;border-bottom:1px solid transparent;' +
        'transition:color .15s,border-color .15s;';
      a.onmouseover = function () { a.style.color = '#fff'; a.style.borderBottomColor = 'rgba(255,255,255,.5)'; };
      a.onmouseout  = function () { a.style.color = 'rgba(255,255,255,.85)'; a.style.borderBottomColor = 'transparent'; };
      nav.appendChild(a);
      if (i < arr.length - 1) {
        var dot = document.createElement('span');
        dot.textContent = '·';
        dot.style.cssText = 'color:rgba(255,255,255,.35);user-select:none';
        nav.appendChild(dot);
      }
    });

    bar.appendChild(copy);
    bar.appendChild(nav);
    // Bottom of the footer: last child of the footer section.
    section.appendChild(bar);
    LOG('legal strip appended at bottom of footer section');
    return true;
  }

  var fTries = 0;
  var fInt = setInterval(function () {
    if (injectFooterStrip() || ++fTries > 60) clearInterval(fInt);
  }, 200);

  // ============================================================
  // 3. Hide Webflow template artifacts ("Footer", "©Edition 10", "©Systems N")
  // ============================================================
  // These are visible labels inside .top-text / .top-text.gray divs that the
  // template used to mark sections ("Footer", "Edition 10", etc.). We hide
  // them when their text content matches our blocklist.
  function hideArtifacts() {
    var hits = 0;
    var rules = [
      function (s) { return s === 'Footer'; },
      function (s) { return /^©\s*Edition\s+\d+$/i.test(s); },
      function (s) { return /^©\s*Systems\s+\d+$/i.test(s); },
    ];
    // Look ONLY inside .top-text variants so we don't touch any real copy.
    var nodes = document.querySelectorAll('.top-text, .top-text.gray');
    nodes.forEach(function (n) {
      var txt = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (rules.some(function (r) { return r(txt); })) {
        n.style.display = 'none';
        hits++;
      }
    });
    if (hits) LOG('artifacts hidden: ' + hits);
    return hits;
  }
  var aTries = 0;
  var aInt = setInterval(function () {
    var n = hideArtifacts();
    if (++aTries > 40) clearInterval(aInt);
  }, 250);

  // ============================================================
  // 4. Footer placeholder cleanup (per request):
  //    remove the "©AI systems for ambitious teams." tagline,
  //    the placeholder email + phone, and the "© 2026 Rexity" line.
  //    Our own legal strip already carries the real copyright.
  // ============================================================
  function cleanFooter() {
    var hits = 0;
    // 4a. "© 2026 Rexity" template copyright
    document.querySelectorAll('.copywrith-dark').forEach(function (n) {
      if (n.style.display !== 'none') { n.style.display = 'none'; hits++; }
    });
    // 4b. "©AI systems for ambitious teams." H2 tagline
    document.querySelectorAll('h2.for-h2, .footer-grid h2, .footer-grid .h1').forEach(function (n) {
      var t = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (/systems for ambitious teams/i.test(t) && n.style.display !== 'none') {
        n.style.display = 'none'; hits++;
      }
    });
    // 4c. placeholder email + phone contact buttons (match by aria-label)
    document.querySelectorAll('[aria-label]').forEach(function (n) {
      var al = n.getAttribute('aria-label') || '';
      if ((/@rexity\.ai/i.test(al) || /\+?1\s*100\s*300\s*404/.test(al)) && n.style.display !== 'none') {
        // hide the whole clickable button wrapper, not just the label
        var wrap = n.closest('a, .button-small, .small-vt-flex > *') || n;
        wrap.style.display = 'none'; hits++;
      }
    });
    if (hits) LOG('footer placeholders hidden: ' + hits);
    return hits;
  }
  var fcTries = 0;
  var fcInt = setInterval(function () {
    cleanFooter();
    if (++fcTries > 40) clearInterval(fcInt);
  }, 250);

  LOG('omi-extras.js loaded');
})();
