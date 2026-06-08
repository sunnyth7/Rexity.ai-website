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
      // dim backdrop (click to close)
      '.bd{position:fixed;inset:0;z-index:2147483645;background:rgba(9,9,9,.45);transition:opacity .35s ease,visibility .35s ease}' +
      // right-side sidebar panel
      '.panel{position:fixed;top:0;height:100vh;width:min(420px,86vw);z-index:2147483646;background:#f7f7f4;' +
      '  box-shadow:-24px 0 70px rgba(0,0,0,.22);' +
      '  display:flex;flex-direction:column;justify-content:center;gap:6px;padding:64px 52px;box-sizing:border-box;' +
      '  font-family:Inter,system-ui,sans-serif}' +
      '.panel a{font-size:clamp(1.7rem,4vw,2.4rem);font-weight:600;color:#070707;text-decoration:none;letter-spacing:-.01em;' +
      '  line-height:1.5;opacity:.85;transition:opacity .2s}' +
      '.panel a:hover{opacity:1}' +
      '.x{position:absolute;top:26px;right:30px;width:46px;height:46px;border:0;border-radius:999px;background:#070707;color:#fff;' +
      '  font-size:21px;line-height:46px;text-align:center;cursor:pointer;padding:0}' +
      '</style>' +
      '<div class="bd" style="opacity:0;visibility:hidden"></div>' +
      '<div class="panel" style="right:-460px"><button class="x" aria-label="Close menu">&#10005;</button>' + linksHtml + '</div>';

    var bd = sh.querySelector('.bd');
    var panel = sh.querySelector('.panel');
    var xBtn = sh.querySelector('.x');
    var isOpen = false, lastT = 0;
    function open() { isOpen = true; bd.style.opacity = '1'; bd.style.visibility = 'visible'; panel.style.right = '0px'; document.documentElement.style.overflow = 'hidden'; }
    function close() { isOpen = false; bd.style.opacity = '0'; bd.style.visibility = 'hidden'; panel.style.right = '-460px'; document.documentElement.style.overflow = ''; }
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
    xBtn.addEventListener('click', close);
    bd.addEventListener('click', close);
    sh.querySelectorAll('.panel a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
