/* omi-booking.js — runs in the SHELL (root index.html).
   Every "Termin buchen" / "Book a call" button inside #omi-it-frame is a dead
   anchor (href="#contact-us", target=_blank — it used to open the raw iframe
   page in a new tab). This script:
   1. lays transparent hotspot overlays over those buttons (same pattern as
      omi-card-hotspots.js, works on both mouse and touch devices), and
   2. neutralizes the original anchors inside the iframe (same-origin),
   so clicking opens a booking modal instead. The modal POSTs to /api/book,
   which persists a Lead + Appointment row in Supabase. Bilingual via the
   shell's rexity:languagechange event. Reversible: delete file + include. */
(function () {
  var T = {
    de: {
      title: "Termin buchen",
      copy: "Hinterlassen Sie Ihre Daten und Ihren Wunschtermin — wir bestätigen per E-Mail.",
      name: "Ihr Name*",
      email: "E-Mail*",
      phone: "Telefon (optional)",
      when: "Wunschtermin*",
      msg: "Worum geht es? (optional)",
      submit: "Termin anfragen",
      sending: "Wird gesendet…",
      ok: "Danke! Ihre Terminanfrage ist eingegangen — wir bestätigen in Kürze per E-Mail.",
      invalid: "Bitte Name, gültige E-Mail und Wunschtermin angeben.",
      err: "Etwas ist schiefgelaufen. Bitte schreiben Sie an info@rexity.ai.",
      close: "Schließen",
      privacy: "Ihre Daten werden DSGVO-konform in der EU gespeichert und nur zur Terminabstimmung verwendet."
    },
    en: {
      title: "Book a call",
      copy: "Leave your details and preferred time — we confirm by email.",
      name: "Your name*",
      email: "Email*",
      phone: "Phone (optional)",
      when: "Preferred date & time*",
      msg: "What is it about? (optional)",
      submit: "Request appointment",
      sending: "Sending…",
      ok: "Thanks! Your request is in — we will confirm by email shortly.",
      invalid: "Please provide your name, a valid email and a preferred time.",
      err: "Something went wrong. Please email info@rexity.ai.",
      close: "Close",
      privacy: "Your data is stored GDPR-compliant in the EU and only used to arrange the appointment."
    }
  };
  function lang() {
    try { return (window.rexityGetLang && window.rexityGetLang()) === "en" ? "en" : "de"; }
    catch (e) { return "de"; }
  }
  function t(k) { return (T[lang()] || T.de)[k]; }

  var frame = document.getElementById("omi-it-frame");
  if (!frame) return;

  /* ---------- modal ---------- */
  var modal = null, form = null, statusEl = null, fields = {};
  function buildModal() {
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "rexity-booking";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.style.cssText = "position:fixed;inset:0;z-index:1200;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(7,26,64,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)";
    modal.innerHTML =
      '<div data-book-card style="background:#F7F3EA;color:#10233F;border-radius:22px;max-width:440px;width:100%;max-height:92vh;overflow:auto;padding:28px 26px 24px;box-shadow:0 30px 90px rgba(4,18,50,.45);font-family:Inter,system-ui,sans-serif">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">' +
          '<h3 data-book-title style="margin:0;font-size:22px;font-weight:800"></h3>' +
          '<button type="button" data-book-close aria-label="close" style="border:0;background:#10233F;color:#fff;width:32px;height:32px;border-radius:50%;font-size:16px;cursor:pointer;line-height:1">&times;</button>' +
        '</div>' +
        '<p data-book-copy style="margin:10px 0 16px;font-size:14px;line-height:1.55;opacity:.85"></p>' +
        '<form data-book-form novalidate style="display:grid;gap:10px">' +
          '<input name="company_website" tabindex="-1" autocomplete="off" style="position:absolute;left:-5000px" aria-hidden="true">' +
          '<input data-f="name" type="text" maxlength="120" autocomplete="name" style="padding:12px 14px;border:1px solid rgba(16,35,63,.25);border-radius:12px;font:500 15px Inter,system-ui,sans-serif;background:#fff;color:#10233F">' +
          '<input data-f="email" type="email" maxlength="200" autocomplete="email" style="padding:12px 14px;border:1px solid rgba(16,35,63,.25);border-radius:12px;font:500 15px Inter,system-ui,sans-serif;background:#fff;color:#10233F">' +
          '<input data-f="phone" type="tel" maxlength="30" autocomplete="tel" style="padding:12px 14px;border:1px solid rgba(16,35,63,.25);border-radius:12px;font:500 15px Inter,system-ui,sans-serif;background:#fff;color:#10233F">' +
          '<label data-book-whenlabel style="font-size:13px;font-weight:600;margin-bottom:-6px"></label>' +
          '<input data-f="start" type="datetime-local" style="padding:12px 14px;border:1px solid rgba(16,35,63,.25);border-radius:12px;font:500 15px Inter,system-ui,sans-serif;background:#fff;color:#10233F">' +
          '<textarea data-f="message" rows="3" maxlength="2000" style="padding:12px 14px;border:1px solid rgba(16,35,63,.25);border-radius:12px;font:500 15px Inter,system-ui,sans-serif;background:#fff;color:#10233F;resize:vertical"></textarea>' +
          '<button data-book-submit type="submit" style="margin-top:2px;padding:13px 16px;border:0;border-radius:12px;background:#0E479B;color:#fff;font:700 15px Inter,system-ui,sans-serif;cursor:pointer"></button>' +
          '<p data-book-status style="margin:0;font-size:13.5px;line-height:1.5;display:none"></p>' +
          '<p data-book-privacy style="margin:2px 0 0;font-size:11.5px;line-height:1.5;opacity:.65"></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);

    form = modal.querySelector("[data-book-form]");
    statusEl = modal.querySelector("[data-book-status]");
    ["name", "email", "phone", "start", "message"].forEach(function (k) {
      fields[k] = modal.querySelector('[data-f="' + k + '"]');
    });

    modal.addEventListener("click", function (e) { if (e.target === modal) hide(); });
    modal.querySelector("[data-book-close]").addEventListener("click", hide);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var name = fields.name.value.trim();
      var email = fields.email.value.trim();
      var start = fields.start.value;
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !start) {
        setStatus(t("invalid"), "#b42318");
        return;
      }
      var btn = modal.querySelector("[data-book-submit]");
      btn.disabled = true;
      btn.textContent = t("sending");
      try {
        var resp = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            email: email,
            phone: fields.phone.value.trim(),
            start: new Date(start).toISOString(),
            message: fields.message.value.trim(),
            company_website: form.querySelector('[name="company_website"]').value
          })
        });
        var data = await resp.json().catch(function () { return {}; });
        if (!resp.ok || !data.ok) throw new Error(data.error || "request failed");
        form.querySelectorAll("input,textarea,button").forEach(function (el) { el.style.display = "none"; });
        setStatus(t("ok"), "#116e3e");
      } catch (err) {
        setStatus(t("err"), "#b42318");
      } finally {
        btn.disabled = false;
        btn.textContent = t("submit");
      }
    });
  }
  function setStatus(text, color) {
    statusEl.textContent = text;
    statusEl.style.color = color;
    statusEl.style.display = "block";
  }
  function render() {
    if (!modal) return;
    modal.querySelector("[data-book-title]").textContent = t("title");
    modal.querySelector("[data-book-copy]").textContent = t("copy");
    modal.querySelector("[data-book-whenlabel]").textContent = t("when");
    modal.querySelector("[data-book-privacy]").textContent = t("privacy");
    modal.querySelector("[data-book-submit]").textContent = t("submit");
    fields.name.placeholder = t("name");
    fields.email.placeholder = t("email");
    fields.phone.placeholder = t("phone");
    fields.message.placeholder = t("msg");
  }
  function show() {
    buildModal();
    // reset to a fresh form on every open
    form.querySelectorAll("input,textarea,button").forEach(function (el) { el.style.display = ""; });
    statusEl.style.display = "none";
    render();
    var min = new Date(Date.now() + 60 * 60 * 1000);
    min.setMinutes(0, 0, 0);
    fields.start.min = min.toISOString().slice(0, 16);
    modal.style.display = "flex";
    setTimeout(function () { fields.name.focus(); }, 60);
  }
  function hide() { if (modal) modal.style.display = "none"; }
  window.addEventListener("rexity:languagechange", render);

  /* ---------- hotspot overlays over the iframe's booking buttons ---------- */
  var layer = null, spots = [];
  function ensureLayer() {
    if (layer) return;
    layer = document.createElement("div");
    layer.id = "rexity-booking-hotspots";
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:520";
    document.body.appendChild(layer);
  }
  function build() {
    var d;
    try { d = frame.contentDocument; } catch (e) { return false; }
    if (!d || !d.body) return false;
    var btns = [].slice.call(d.querySelectorAll('a.anchor-button[href="#contact-us"], a.anchor-button[href*="#contact-us"]'));
    if (!btns.length) return false;
    ensureLayer();
    btns.forEach(function (a) {
      // neutralize the original anchor (it opened the bare iframe page in a new tab)
      a.removeAttribute("target");
      a.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); show(); });
      var el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", "Termin buchen");
      el.style.cssText = "position:fixed;pointer-events:auto;background:transparent;border:0;cursor:pointer;padding:0;display:none";
      el.addEventListener("click", show);
      layer.appendChild(el);
      spots.push({ btn: a, el: el });
    });
    return true;
  }
  function tick() {
    var fr = frame.getBoundingClientRect();
    spots.forEach(function (s) {
      var r;
      try { r = s.btn.getBoundingClientRect(); } catch (e) { return; }
      if (!r.width || !r.height || r.bottom < 0 || r.top > window.innerHeight) {
        s.el.style.display = "none";
        return;
      }
      s.el.style.display = "block";
      s.el.style.left = (fr.left + r.left) + "px";
      s.el.style.top = (fr.top + r.top) + "px";
      s.el.style.width = r.width + "px";
      s.el.style.height = r.height + "px";
    });
    requestAnimationFrame(tick);
  }
  var started = false;
  function start() {
    if (started) return;
    started = true;
    var tries = 0;
    var iv = setInterval(function () {
      if (build()) { clearInterval(iv); tick(); }
      else if (++tries > 40) clearInterval(iv);
    }, 500);
  }
  frame.addEventListener("load", start);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
