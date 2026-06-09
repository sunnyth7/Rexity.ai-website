/* omi-lead.js — runs inside the iframe body (it-page-anim.html).
   The contact section uses a dead Contact Form 7 form (action points at a
   WordPress endpoint that doesn't exist on this static site). This hook
   intercepts the submit, POSTs the fields to /api/lead (which persists a Lead
   row in Supabase), and shows an inline success/error message. Bilingual via
   window.rexityGetLang() (see omi-i18n.js). No template markup is changed. */
(function () {
  var T = {
    en: {
      sending: "Sending…",
      ok: "Thanks — we’ve got your message and will be in touch shortly.",
      invalid: "Please enter your name and a valid email.",
      err: "Something went wrong. Please email sunny@rexity.ai.",
      submit: "Submit"
    },
    de: {
      sending: "Wird gesendet…",
      ok: "Danke — wir haben Ihre Nachricht erhalten und melden uns in Kürze.",
      invalid: "Bitte geben Sie Ihren Namen und eine gültige E-Mail an.",
      err: "Etwas ist schiefgelaufen. Bitte schreiben Sie an sunny@rexity.ai.",
      submit: "Absenden"
    }
  };
  function lang() {
    try { return (window.rexityGetLang && window.rexityGetLang()) === "de" ? "de" : "en"; }
    catch (e) { return "en"; }
  }
  function t(k) { return (T[lang()] || T.en)[k]; }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function findForm() {
    var scope = document.getElementById("contact-us") || document;
    return scope.querySelector("form.wpcf7-form") || scope.querySelector("form");
  }

  function ensureStatusEl(form) {
    var el = form.querySelector(".omi-lead-status");
    if (!el) {
      el = document.createElement("div");
      el.className = "omi-lead-status";
      el.setAttribute("role", "status");
      el.style.cssText = "margin-top:14px;font:14px/1.5 Inter,system-ui,sans-serif;min-height:1em;";
      form.appendChild(el);
    }
    return el;
  }

  function val(form, name) {
    var f = form.querySelector('[name="' + name + '"]');
    return f ? String(f.value || "").trim() : "";
  }

  // Inject a honeypot field bots tend to fill; humans never see it.
  function ensureHoneypot(form) {
    if (form.querySelector('[name="company_website"]')) return;
    var hp = document.createElement("input");
    hp.type = "text";
    hp.name = "company_website";
    hp.tabIndex = -1;
    hp.setAttribute("autocomplete", "off");
    hp.setAttribute("aria-hidden", "true");
    hp.style.cssText = "position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0;";
    form.appendChild(hp);
  }

  function bind(form) {
    if (form.__omiLeadBound) return;
    form.__omiLeadBound = true;
    ensureHoneypot(form);
    var status = ensureStatusEl(form);
    var submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      e.stopPropagation();

      var payload = {
        "your-name": val(form, "your-name") || val(form, "name"),
        "your-email": val(form, "your-email") || val(form, "email"),
        "your-subject": val(form, "your-subject") || val(form, "subject"),
        "your-message": val(form, "your-message") || val(form, "message"),
        company_website: val(form, "company_website")
      };

      status.style.color = "";
      if (!payload["your-name"] || !EMAIL_RE.test(payload["your-email"])) {
        status.style.color = "#b91c1c";
        status.textContent = t("invalid");
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; }
      status.style.color = "";
      status.textContent = t("sending");

      try {
        var r = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await r.json().catch(function () { return {}; });
        if (r.ok && data.ok) {
          form.reset();
          status.style.color = "#15803d";
          status.textContent = t("ok");
        } else {
          status.style.color = "#b91c1c";
          status.textContent = (data && data.error) || t("err");
        }
      } catch (_err) {
        status.style.color = "#b91c1c";
        status.textContent = t("err");
      } finally {
        if (submitBtn) { submitBtn.disabled = false; }
      }
    }, true);
  }

  function boot() {
    var tries = 0;
    var iv = setInterval(function () {
      var form = findForm();
      if (form) { bind(form); clearInterval(iv); }
      else if (++tries > 40) clearInterval(iv);
    }, 200);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
