/* omi-services-nav.js — repoints the homepage "Services / Leistungen" nav item
   from the in-page anchor (#services, which smooth-scrolled to the services
   section inside the iframe) to the new /services overview page, which links
   out to every per-service page (/web, /automation, /marketing, /sap,
   /testing-support).

   The homepage already renders a "Services" entry in both the desktop Webflow
   nav and the omi-nav.js Shadow-DOM mobile menu. We only change its href —
   text, styling and animation are left untouched. Two retrying injectors so
   script order doesn't matter. Fully reversible: delete this file + its
   <script> include (the nav item reverts to its #services anchor). */
(function () {
  var FROM = '#services';
  var TO = '/services';

  function repointIn(root) {
    if (!root || !root.querySelectorAll) return false;
    var hit = false;
    root.querySelectorAll('a[href="' + FROM + '"]').forEach(function (a) {
      a.setAttribute('href', TO);
      a.setAttribute('data-rx-services', '1');
      hit = true;
    });
    return hit;
  }

  // 1. Desktop Webflow nav (light DOM).
  var t1 = 0;
  var i1 = setInterval(function () {
    var done = repointIn(document) || document.querySelector('a[href="' + TO + '"][data-rx-services]');
    if (done || ++t1 > 60) clearInterval(i1);
  }, 200);

  // 2. Mobile Shadow-DOM side menu (omi-nav.js) — built after harvest, retry.
  var t2 = 0;
  var i2 = setInterval(function () {
    var host = document.getElementById('omi-nav-host');
    if (host && host.shadowRoot) repointIn(host.shadowRoot);
    if (++t2 > 60) clearInterval(i2);
  }, 300);
})();
