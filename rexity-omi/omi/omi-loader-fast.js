/* omi-loader-fast.js — shell. The Webflow intro loader (.intro, full-screen
   overlay) sits on top of the hero and is the LCP gate: the hero background
   video can't paint until the loader clears, which the GSAP/IX2 sequence does
   late. This caps how long the loader holds the paint — after a short beat the
   brand wordmark gets, it fades the loader out and reveals the hero. The hero
   text animations (Webflow IX2) run on their own and are unaffected; the bg
   video autoplays underneath regardless. Also signals loader-complete so the
   chatbot can init. Reversible: delete this file + its include. */
(function () {
  var CAP = 4200; // ms — failsafe only: normal teardown at 3760ms; fires only if the inline loader script failed (≈ DOMContentLoaded)
  function reveal() {
    var el = document.querySelector(".intro");
    if (!el || el.__rxFast) return;
    el.__rxFast = 1;
    el.style.transition = "opacity .35s ease";
    el.style.opacity = "0";
    el.classList.add("rexity-loader-complete");
    window.setTimeout(function () { try { el.style.display = "none"; } catch (e) {} }, 400);
  }
  function arm() { window.setTimeout(reveal, CAP); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();
})();
