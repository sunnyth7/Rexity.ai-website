/* omi-service-links.js — runs INSIDE the iframe body (it-page-anim.html).
   The homepage services carousel has 6 cards, each a big <h2 class="ct-headline
   port-heading"> title plus a per-card CTA <a class="ct-link"> that pointed at
   #contact-us. This repoints each card's CTA (and makes the title clickable) to
   the matching dedicated service page, navigating the TOP window (out of the
   iframe). Only the 6 known service titles are touched; every other ct-link /
   heading on the page is left alone. Reversible: delete this file + its include. */
(function () {
  // Bilingual matchers — omi-i18n translates titles to German, so each must
  // match EN and DE. Kept precise so unrelated headings (e.g. "Digitale
  // Arbeitsplätze und Automatisierung") are never caught.
  var MAP = [
    [/website[-\s]?(development|entwicklung)/i, '/web/web-development'],
    [/mobile app/i,                            '/web/mobile-apps'],
    [/business process|geschäftsprozess/i,     '/automation'],
    [/whatsapp/i,                              '/automation'],
    [/testing/i,                               '/testing-support'],
    [/seo|video[-\s]?marketing/i,              '/marketing']
  ];
  var EXPECTED = 6;
  function urlFor(t) {
    for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(t)) return MAP[i][1];
    return null;
  }
  function go(url) {
    try { (window.top || window).location.href = url; }
    catch (e) { window.location.href = url; }
  }
  var wired = 0;
  function wire() {
    var heads = [].slice.call(document.querySelectorAll('h2.ct-headline'));
    var links = [].slice.call(document.querySelectorAll('a.ct-link'));
    if (!heads.length || !links.length) return wired;
    heads.forEach(function (h) {
      if (h.__rxSvc) return;
      var url = urlFor((h.textContent || '').replace(/\s+/g, ' ').trim());
      if (!url) return;
      h.__rxSvc = 1;
      // pair with the first not-yet-claimed ct-link that follows this title
      var link = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].__rxSvc) continue;
        if (h.compareDocumentPosition(links[i]) & Node.DOCUMENT_POSITION_FOLLOWING) { link = links[i]; break; }
      }
      if (link) {
        link.__rxSvc = 1;
        link.setAttribute('href', url);
        link.setAttribute('target', '_top');
        link.addEventListener('click', function (e) { e.preventDefault(); go(url); }, true);
      }
      h.style.cursor = 'pointer';
      h.addEventListener('click', function () { go(url); });
      wired++;
    });
    return wired;
  }
  // Keep retrying until all 6 are wired (titles may still be translating /
  // the carousel may still be hydrating), then stop. Idempotent per element.
  var tries = 0;
  var iv = setInterval(function () { if (wire() >= EXPECTED || ++tries > 80) clearInterval(iv); }, 250);
  if (document.readyState !== 'loading') wire();
  else document.addEventListener('DOMContentLoaded', wire);
})();
