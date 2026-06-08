/* omi-nav.js — Rexity (Omi) nav safety.
   The Webflow export's slide-in (.fixed-menu) is GSAP/IX-controlled and gets stuck
   open with no working close (no full IX runtime). This page's Webflow Interactions
   engine (w-mod-ix) also re-asserts styles on injected elements every frame, so a
   custom JS-driven panel can't reliably win. The reliable, non-breaking fix:
   statically hide the broken slide-in so it can never get stuck open. The inline
   header nav (Home/About/Work/Services/Contact) remains visible and functional.
   NOTE: a fully custom animated menu needs in-browser DevTools debugging of the
   page's IX/GSAP style-reset loop — tracked as a follow-up. */
(function () {
  function init() {
    if (document.getElementById('omi-nav-style')) return;
    var style = document.createElement('style');
    style.id = 'omi-nav-style';
    // static rules apply reliably (only dynamic class-overrides get reset by IX)
    style.textContent = '.fixed-menu{display:none!important;pointer-events:none!important}';
    document.head.appendChild(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
