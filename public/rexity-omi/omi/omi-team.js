/* omi-team.js — runs inside the iframe body (it-page-anim.html).
   The team section ("Das Team hinter Rexity") is a GSAP pinned HORIZONTAL
   scroll (.p-scroll-trigger, timeline _mp_1700738999) that slides the profile
   card left→right while pinned. The owner wants a normal vertical scroll.

   This neutralises that one timeline (leaving the services h-scroll, stats
   counter, etc. untouched), reflows the section to normal vertical flow via
   CSS, and hides the leftover placeholder team members (Team Member 02/03/04)
   so only the real founder card remains. Fully reversible: delete this file +
   its <script> include. */
(function () {
  // 1. CSS override — reflow the pinned horizontal section as normal flow.
  var css = document.createElement('style');
  css.id = 'omi-team-normal';
  css.textContent =
    '.p-scroll-trigger{overflow:visible!important;height:auto!important;min-height:0!important}' +
    '.p-scroll-section{position:static!important;transform:none!important;left:auto!important;width:100%!important}' +
    '.p-scroll-section>.ct-section-inner-wrap{display:flex!important;flex-direction:column!important;width:100%!important}';
  (document.head || document.documentElement).appendChild(css);

  // 2. Hide the placeholder team members (keep only the real founder card).
  function hidePlaceholders() {
    var hidden = 0;
    document.querySelectorAll('.p-scroll-section .team-item, .p-scroll-section .p-item').forEach(function (card) {
      if (card.__omiTeamHid) return;
      var t = (card.textContent || '').replace(/\s+/g, ' ');
      if (/\[Team Member 0[234]\]|Role — placeholder|placeholder copy|\bColin\b|\bDaniel\b|\bDan\b|\bJanet\b/.test(t)) {
        card.style.display = 'none';
        card.__omiTeamHid = 1;
        hidden++;
      }
    });
    return hidden;
  }

  // 3. Kill the horizontal-pin timeline + its ScrollTrigger (revert transforms).
  function neutralize() {
    try {
      var tl = window._mp_1700738999;
      if (tl) {
        if (tl.scrollTrigger && tl.scrollTrigger.kill) tl.scrollTrigger.kill(true);
        if (tl.kill) tl.kill();
      }
    } catch (e) {}
    hidePlaceholders();
    try { if (window.ScrollTrigger && window.ScrollTrigger.refresh) window.ScrollTrigger.refresh(); } catch (e) {}
  }

  // Hide placeholders as soon as the DOM is ready (they don't depend on GSAP).
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hidePlaceholders);
  else hidePlaceholders();

  // Wait for the timeline to exist (created on load), then neutralise it,
  // re-applying a couple of times to survive the page's own load+refresh pass.
  var tries = 0;
  var iv = setInterval(function () {
    if (window._mp_1700738999 || ++tries > 60) {
      clearInterval(iv);
      neutralize();
      setTimeout(neutralize, 350);
      setTimeout(neutralize, 1300);
    }
  }, 150);
  window.addEventListener('load', function () { setTimeout(neutralize, 200); });
})();
