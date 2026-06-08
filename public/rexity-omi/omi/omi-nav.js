/* omi-nav.js — Rexity (Omi) hamburger menu.
   Why custom: the page's GSAP "timeline-actions" framework created the menu open/close
   timeline but never bound the hamburger click to play it, and .fixed-menu is pinned
   closed by persistent GSAP tweens that survive killTweensOf / CSS / inline !important.
   So we hide the broken native slide-in and render our OWN menu inside a Shadow DOM
   (fully isolated from the page's CSS/JS — verified reliable), wired to the real
   hamburger trigger. Opens on ≡; closes on ✕, backdrop, link, or Escape. */
(function () {
  function clean(t) {
    t = (t || '').replace(/\s+/g, ' ').trim();
    var c = t.replace(/\s+/g, '');
    for (var k = Math.floor(c.length / 2); k >= 1; k--) {
      if (c.slice(0, k) === c.slice(k, 2 * k)) return (c.slice(0, k) + c.slice(2 * k)).trim();
    }
    return t;
  }
  function init() {
    if (document.getElementById('omi-nav-host')) return;
    var hamburgers = document.querySelectorAll('.hamburger-wrapper, .hamburger-flex');
    if (!hamburgers.length) return;

    // collect main nav links
    var seen = {}, links = [];
    document.querySelectorAll('.nav-menu.first a, .nav-menu a, .w-nav-menu a').forEach(function (a) {
      var t = clean(a.innerText || a.textContent), href = a.getAttribute('href') || '#';
      if (t && t.length < 24 && !seen[href]) { seen[href] = 1; links.push({ t: t, href: href }); }
    });
    if (!links.length) return;

    // hide the broken native slide-in (static rule — applies reliably)
    var hide = document.createElement('style');
    hide.textContent = '.fixed-menu{display:none!important;pointer-events:none!important}';
    document.head.appendChild(hide);

    // Shadow DOM host (isolated from page CSS/JS)
    var host = document.createElement('div');
    host.id = 'omi-nav-host';
    document.body.appendChild(host);
    var sh = host.attachShadow({ mode: 'open' });

    var linksHtml = links.map(function (l) { return '<a href="' + l.href + '">' + l.t + '</a>'; }).join('');
    sh.innerHTML =
      '<style>' +
      '.ov{position:fixed;inset:0;z-index:2147483646;background:#f7f7f4;transition:opacity .35s ease,visibility .35s ease;' +
      '  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-family:Inter,system-ui,sans-serif}' +
      '.ov a{font-size:clamp(2rem,6vw,3.4rem);font-weight:600;color:#070707;text-decoration:none;letter-spacing:-.02em;' +
      '  line-height:1.18;opacity:.55;transition:opacity .2s}' +
      '.ov a:hover{opacity:1}' +
      '.x{position:fixed;top:28px;right:32px;width:50px;height:50px;border:0;border-radius:999px;background:#070707;color:#fff;' +
      '  font-size:22px;line-height:50px;text-align:center;cursor:pointer;padding:0}' +
      '</style>' +
      '<div class="ov" style="opacity:0;visibility:hidden"><button class="x" aria-label="Close menu">&#10005;</button>' + linksHtml + '</div>';

    var ov = sh.querySelector('.ov');
    var isOpen = false, lastT = 0;
    function open() { isOpen = true; ov.style.opacity = '1'; ov.style.visibility = 'visible'; document.documentElement.style.overflow = 'hidden'; }
    function close() { isOpen = false; ov.style.opacity = '0'; ov.style.visibility = 'hidden'; document.documentElement.style.overflow = ''; }
    function toggle(e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      var now = (e && e.timeStamp) || (window.performance ? performance.now() : 0);
      if (now && now - lastT < 350) return;   // debounce nested-element double fire
      lastT = now;
      isOpen ? close() : open();
    }

    // bind to the outermost hamburger only (avoid nested .wrapper+.flex double-toggle)
    var bound = [];
    hamburgers.forEach(function (h) {
      if (bound.some(function (b) { return b.contains(h) || h.contains(b); })) return;
      bound.push(h); h.style.cursor = 'pointer'; h.addEventListener('click', toggle);
    });
    sh.querySelector('.x').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    sh.querySelectorAll('.ov a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
