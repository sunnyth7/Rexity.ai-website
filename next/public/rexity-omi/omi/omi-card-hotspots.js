/* omi-card-hotspots.js — runs in the SHELL (root index.html).
   The homepage service cards live inside #omi-it-frame, which is
   pointer-events:none (the shell drives the iframe's scroll via omi-scroll.js,
   so the iframe must not capture wheel/clicks). That also means the cards'
   "Mehr erfahren" buttons can't be clicked.

   This lays transparent clickable anchors in the SHELL, kept aligned over each
   service button every frame, so clicking "Mehr erfahren" opens the matching
   service page. Same-origin lets us read the buttons' live positions from the
   iframe. Scrolling is unaffected: the tiny overlays don't capture wheel
   (it bubbles to the document), they only capture the click.
   Reversible: delete this file + its <script> include. */
(function () {
  var MAP = [
    [/website[-\s]?(development|entwicklung)/i, '/web/web-development'],
    [/mobile app/i,                            '/web/mobile-apps'],
    [/business process|geschäftsprozess/i,     '/automation'],
    [/whatsapp/i,                              '/automation'],
    [/testing/i,                               '/testing-support'],
    [/seo|video[-\s]?marketing/i,              '/marketing']
  ];
  function urlFor(t) { for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(t)) return MAP[i][1]; return null; }

  var frame = document.getElementById('omi-it-frame');
  if (!frame) return;
  var layer = null;
  var spots = []; // { btn, url, el }

  function ensureLayer() {
    if (layer) return;
    layer = document.createElement('div');
    layer.id = 'omi-hotspot-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:500';
    document.body.appendChild(layer);
  }

  function build() {
    var d; try { d = frame.contentDocument; } catch (e) { return false; }
    if (!d) return false;
    var heads = [].slice.call(d.querySelectorAll('h2.ct-headline'));
    var links = [].slice.call(d.querySelectorAll('a.ct-link'));
    if (!heads.length || !links.length) return false;
    ensureLayer();
    heads.forEach(function (h) {
      if (h.__rxSpot) return;
      var url = urlFor((h.textContent || '').replace(/\s+/g, ' ').trim());
      if (!url) return;
      h.__rxSpot = 1;
      var btn = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].__rxSpot) continue;
        if (h.compareDocumentPosition(links[i]) & Node.DOCUMENT_POSITION_FOLLOWING) { btn = links[i]; break; }
      }
      if (!btn) return;
      btn.__rxSpot = 1;
      var a = document.createElement('a');
      a.href = url;
      a.setAttribute('aria-label', 'Mehr erfahren');
      a.style.cssText = 'position:fixed;display:none;pointer-events:auto;cursor:pointer;background:transparent';
      layer.appendChild(a);
      spots.push({ btn: btn, url: url, el: a });
    });
    return spots.length > 0;
  }

  function place() {
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i], r = null;
      try { r = s.btn.getBoundingClientRect(); } catch (e) {}
      var vis = r && r.width > 4 && r.height > 4 &&
        r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      if (vis) {
        s.el.style.left = r.left + 'px';
        s.el.style.top = r.top + 'px';
        s.el.style.width = r.width + 'px';
        s.el.style.height = r.height + 'px';
        s.el.style.display = 'block';
      } else {
        s.el.style.display = 'none';
      }
    }
  }

  // Drive positioning from several sources — the cards move via the parent
  // scroll proxy (omi-scroll.js), so 'scroll' is the primary trigger. A
  // setInterval heartbeat covers contexts where requestAnimationFrame is
  // throttled; an rAF loop adds smoothness where it does fire.
  var started = false;
  function start() {
    if (started) return;
    started = true;
    place();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    setInterval(place, 100);
    (function raf() { place(); requestAnimationFrame(raf); })();
  }

  var tries = 0;
  var iv = setInterval(function () {
    if (build()) { clearInterval(iv); start(); }
    else if (++tries > 80) clearInterval(iv);
  }, 300);
  frame.addEventListener('load', function () { build(); });
})();
