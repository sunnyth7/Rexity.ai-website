/* omi-cleanup.js — Sprint 1 runtime fixes inside the iframe body.
   1. Makes the dead "Learn More" button (a bare <div>, no <a>) scroll to the
      contact section like the other CTAs.
   2. Belt-and-suspenders: neutralizes any anchor still pointing to an
      external origin (in case cached/older markup slips through).
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
    document.querySelectorAll('a[href^="http"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        if (!/(^|\.)rexity\.ai$/.test(u.hostname)) a.setAttribute("href", "#contact-us");
      } catch (e) {}
    });
  }

  // The contact form is hidden (Sprint 1). Drop a clear email CTA into the
  // contact section so it still gives visitors a way to reach us. Bilingual
  // via the same lang signal the rest of the page uses, with a pre-filled
  // mailto so one click opens a ready email.
  function mailtoHref(de) {
    var subject = de ? "Anfrage über rexity.ai" : "Enquiry from rexity.ai";
    var body = de
      ? "Hallo Rexity-Team,\n\nich interessiere mich für Ihre Services und würde gerne mehr erfahren.\n\nViele Grüße"
      : "Hi Rexity team,\n\nI'm interested in your services and would like to know more.\n\nBest regards";
    return "mailto:info@rexity.ai?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }
  function injectContactCta() {
    var sec = document.getElementById("contact-us");
    if (!sec || sec.querySelector("#omi-contact-cta")) return;
    var de = false;
    try { de = (window.rexityGetLang && window.rexityGetLang()) === "de"; } catch (e) {}
    var wrap = document.createElement("div");
    wrap.id = "omi-contact-cta";
    wrap.style.cssText = "margin-top:18px;font:16px/1.6 Inter,system-ui,sans-serif;";
    var a = document.createElement("a");
    a.href = mailtoHref(de);
    a.textContent = "info@rexity.ai";
    a.style.cssText = "color:inherit;font-weight:700;text-decoration:underline;text-underline-offset:3px;";
    wrap.appendChild(document.createTextNode(de
      ? "Schreiben Sie uns direkt an "
      : "Write to us directly at "));
    wrap.appendChild(a);
    wrap.appendChild(document.createTextNode(de
      ? " — oder nutzen Sie den Rexity-Chat unten rechts."
      : " — or use the Rexity chat at the bottom right."));
    // place it where the form was (after the subtext heading block)
    var anchor = sec.querySelector(".oxy-ou-cf7-styler") || sec.querySelector("form") || sec;
    (anchor.parentNode || sec).appendChild(wrap);
  }

  function boot() {
    var tries = 0;
    var iv = setInterval(function () {
      wire();
      injectContactCta();
      if (++tries > 40) clearInterval(iv);
    }, 300);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
