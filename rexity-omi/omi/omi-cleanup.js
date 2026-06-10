/* omi-cleanup.js — Sprint 1 runtime fixes inside the iframe body.
   1. Makes the dead "Learn More" button (a bare <div>, no <a>) scroll to the
      contact section like the other CTAs.
   2. Belt-and-suspenders: neutralizes any anchor still pointing off-site to
      workspace-it.com (in case a cached/older markup slips through).
   No structural/layout changes — only event wiring. */
(function () {
  function scrollToContact() {
    try {
      if (window._mp_smoother && typeof window._mp_smoother.scrollTo === "function") {
        window._mp_smoother.scrollTo("#contact-us", true, "top top");
        return;
      }
    } catch (e) {}
    var el = document.getElementById("contact-us");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }

  function wire() {
    // "Learn More" — match the visible bare-div button by its exact text.
    var nodes = document.querySelectorAll("div, span");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.__rxWired) continue;
      var t = (n.textContent || "").replace(/\s+/g, " ").trim();
      if (t === "Learn More" && !n.closest("a")) {
        n.__rxWired = true;
        n.style.cursor = "pointer";
        n.setAttribute("role", "button");
        n.setAttribute("tabindex", "0");
        n.addEventListener("click", function (e) { e.preventDefault(); scrollToContact(); });
        n.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); scrollToContact(); } });
      }
    }
    // Any straggler off-site link -> contact section.
    document.querySelectorAll('a[href*="workspace-it.com"]').forEach(function (a) {
      a.setAttribute("href", "#contact-us");
    });
  }

  function boot() {
    var tries = 0;
    var iv = setInterval(function () {
      wire();
      if (++tries > 40) clearInterval(iv);
    }, 300);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
