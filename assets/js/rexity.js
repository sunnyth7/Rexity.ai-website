/* rexity.js — site behaviour on top of the Vaxel template (plan §4).
 *
 * Loaded on every page after the vendored scripts, with `defer`, so it runs
 * after parsing and BEFORE DOMContentLoaded — i.e. before the Webflow runtime
 * initialises its interactions and GSAP SplitText splits any text.
 *
 *  1. Language toggle (identical to production, localStorage "rexity_lang",
 *     default "de", cross-tab "storage" sync, <html lang>, window.rexityGetLang /
 *     rexitySetLang, "rexity:languagechange" event that the chatbot listens to).
 *     Text:        [data-de][data-en]            -> textContent (TITLE: text, META: content)
 *                  add data-rx-i18n="html"      -> innerHTML instead (static, authored markup only)
 *     Attributes:  data-de-<attr> / data-en-<attr> for placeholder, aria-label, alt,
 *                  title, content, value, href (prefilled mailto links, scripts/lib/mailto.mjs);
 *                  production's data-alt-de / data-alt-en too.
 *     Toggles:     any [data-rx-lang-toggle] (and #rx-lang); its [data-lang] spans get .on.
 *  2. Forms:       form[data-rx-form="lead"] -> POST /api/lead
 *                  form[data-rx-form="book"] -> POST /api/book
 *                  payload, validation and DE/EN messages as production
 *                  (rexity-omi/omi/omi-lead.js, omi-booking.js).
 *                  Sprint 31: the lead form carries a bot check (Cloudflare Turnstile): the widget
 *                  is rendered into the form when the visitor first touches it, its token is sent
 *                  as `turnstileToken` (api/lead.js verifies it when TURNSTILE_SECRET_KEY is set).
 *                  Never on localhost / 127.0.0.1 (the widget's host name is rexity.ai).
 *  3. Booking modal: [data-rx-open="booking"] opens [data-rx-modal="booking"];
 *                  Esc / [data-rx-close] / backdrop close it; focus trap; focus restore.
 *  4. /styleguide only: [data-rx-palette-set] and [data-rx-fontset-set] switchers
 *     (localStorage "rexity_palette" / "rexity_fontset").
 *  5. Sprint 12 global fixes:
 *     a. template buttons whose label wraps get [data-rx-wrap] (rexity.css shows one
 *        label row, no hover roll) — the roll box is one line high and garbled them;
 *     b. safety net: SplitText line splits whose lines wrap again after fonts/page
 *        load are split once more (root cause of B-5 fixed in rexity.css §11);
 *     c. below 992 px the fixed header hides while scrolling down, returns on scroll up;
 *     d. <html> gets .rx-menu-open while the menu overlay is open (the chat pill hides).
 *
 * SplitText: the language is applied before Webflow/GSAP start, so text is
 * split in the stored language. Toggling later reverts the SplitText splits
 * that contain translated nodes, swaps the text and splits again (see
 * activeSplits); entrance animations that already ran stay at their end state.
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var KEY = "rexity_lang";

  /* ------------------------------------------------------------ 1. language */
  function get() {
    try {
      return localStorage.getItem(KEY) === "en" ? "en" : "de";
    } catch (e) {
      return "de";
    }
  }

  var ATTRS = ["placeholder", "aria-label", "alt", "title", "content", "value", "href"];

  // GSAP SplitText keeps its instance on the split element under a private Symbol and, with
  // autoSplit (used by the template's IX3 line splits), restores the HTML it captured when it
  // first split as soon as the element's width changes. Text swapped inside a split element
  // therefore flipped back to the load language ~200 ms after a toggle (Sprint 6B QA). Fix:
  // revert the affected splits, swap the text, split again (IX3 rebuilds its timelines on
  // onSplit and keeps their progress, exactly as on a window resize).
  function splitOf(el) {
    if (!Object.getOwnPropertySymbols) return null;
    var syms = Object.getOwnPropertySymbols(el);
    for (var i = 0; i < syms.length; i++) {
      var v = el[syms[i]];
      if (v && v.isSplit && typeof v.revert === "function" && typeof v.split === "function") return v;
    }
    return null;
  }
  function activeSplits() {
    var out = [];
    var els = doc.querySelectorAll("[data-de][data-en]");
    for (var i = 0; i < els.length; i++) {
      for (var e = els[i]; e && e !== doc.body; e = e.parentElement) {
        var s = splitOf(e);
        if (s && out.indexOf(s) < 0) out.push(s);
      }
    }
    return out;
  }

  function apply(l, opts) {
    l = l === "en" ? "en" : "de";
    root.lang = l;
    var skipText = opts && opts.skipText;
    if (!skipText) {
      var splits = activeSplits();
      for (var r = 0; r < splits.length; r++) {
        try { splits[r].revert(); } catch (e) {}
      }
      var els = doc.querySelectorAll("[data-de][data-en]");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var v = el.getAttribute("data-" + l);
        if (v == null) continue;
        if (el.tagName === "TITLE") el.textContent = v;
        else if (el.tagName === "META") el.setAttribute("content", v);
        else if (el.getAttribute("data-rx-i18n") === "html") {
          if (el.innerHTML !== v) el.innerHTML = v;
        } else if (el.textContent !== v) el.textContent = v;
      }
      for (var a = 0; a < ATTRS.length; a++) {
        var name = ATTRS[a];
        var list = doc.querySelectorAll("[data-de-" + name + "][data-en-" + name + "]");
        for (var j = 0; j < list.length; j++) {
          var val = list[j].getAttribute("data-" + l + "-" + name);
          if (val != null) list[j].setAttribute(name, val);
        }
      }
      var alts = doc.querySelectorAll("[data-alt-de][data-alt-en]");
      for (var k = 0; k < alts.length; k++) {
        var alt = alts[k].getAttribute("data-alt-" + l);
        if (alt != null) alts[k].setAttribute("alt", alt);
      }
      for (var sp = 0; sp < splits.length; sp++) {
        try { splits[sp].split(splits[sp].vars); } catch (e) {}
      }
    }
    var spans = doc.querySelectorAll("[data-rx-lang-toggle] [data-lang], #rx-lang [data-lang]");
    for (var s = 0; s < spans.length; s++) {
      spans[s].classList.toggle("on", spans[s].getAttribute("data-lang") === l);
    }
    current = l;
  }

  var current = null;

  function set(l) {
    l = l === "en" ? "en" : "de";
    try {
      localStorage.setItem(KEY, l);
    } catch (e) {}
    apply(l);
    try {
      window.dispatchEvent(new CustomEvent("rexity:languagechange", { detail: { lang: l } }));
    } catch (e) {}
  }

  // The HTML is authored in German, so on a German load only the state is set
  // (no text is rewritten -> nothing for SplitText to trip over).
  var initial = get();
  apply(initial, { skipText: initial === "de" });

  doc.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest("[data-rx-lang-toggle], #rx-lang");
    if (!btn) return;
    e.preventDefault();
    set(get() === "de" ? "en" : "de");
  });
  window.addEventListener("storage", function (e) {
    if (e.key === KEY && e.newValue) apply(e.newValue);
  });
  window.addEventListener("rexity:languagechange", function (e) {
    if (e && e.detail && e.detail.lang && e.detail.lang !== current) apply(e.detail.lang);
  });
  window.rexityGetLang = get;
  window.rexitySetLang = set;

  // SplitText (aria: "auto", as IX3 calls it) moves the text of every split element into an
  // aria-label on that element (usually a generic <div>, where aria-label is not allowed) and
  // marks every word/line <div> it creates aria-hidden. Result (Sprint 6B QA): the h1/h2 inside
  // .section-header-heading-box had an empty accessible name, and screen readers lost every
  // section heading. Undo only that ARIA: drop the label SplitText added and un-hide the
  // gsap_split_* nodes it created, so the real headings and paragraphs are read again.
  // Visual output and motion are unchanged (attributes only).
  var SPLIT_NODES = ".gsap_split_word[aria-hidden], .gsap_split_line[aria-hidden], .gsap_split_letter[aria-hidden], .gsap_split_char[aria-hidden]";
  function fixSplitAria(el) {
    var s = splitOf(el);
    if (!s) return;
    var orig = null;
    var o = s._data && s._data.orig;
    for (var i = 0; o && i < o.length; i++) if (o[i].element === el) orig = o[i].ariaL;
    if (!orig) el.removeAttribute("aria-label");
    else if (el.getAttribute("aria-label") !== orig) el.setAttribute("aria-label", orig);
    var kids = el.querySelectorAll(SPLIT_NODES);
    for (var k = 0; k < kids.length; k++) kids[k].removeAttribute("aria-hidden");
  }
  if (window.MutationObserver) {
    new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var t = records[i].target;
        if (t.nodeType === 1 && t.hasAttribute("aria-label") && splitOf(t)) fixSplitAria(t);
      }
    }).observe(root, { attributes: true, attributeFilter: ["aria-label"], subtree: true });
  }

  /* ------------------------------------------------------------ 2. forms */
  var EMAIL = "info@rexity.ai";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Copy exactly as production (omi-lead.js / omi-booking.js).
  var T = {
    lead: {
      de: {
        sending: "Wird gesendet…",
        ok: "Danke — wir haben Ihre Nachricht erhalten und melden uns in Kürze.",
        invalid: "Bitte geben Sie Ihren Namen und eine gültige E-Mail an.",
        bot: "Die Sicherheitsprüfung (Schutz vor automatischen Anfragen) ist nicht durchgelaufen. Bitte senden Sie das Formular noch einmal ab oder schreiben Sie an info@rexity.ai.",
        err: "Etwas ist schiefgelaufen. Bitte schreiben Sie an info@rexity.ai."
      },
      en: {
        sending: "Sending…",
        ok: "Thanks — we’ve got your message and will be in touch shortly.",
        invalid: "Please enter your name and a valid email.",
        bot: "The security check (protection against automated requests) did not complete. Please send the form once more or email info@rexity.ai.",
        err: "Something went wrong. Please email info@rexity.ai."
      }
    },
    book: {
      de: {
        sending: "Wird gesendet…",
        ok: "Danke! Ihre Terminanfrage ist eingegangen — wir bestätigen in Kürze per E-Mail.",
        invalid: "Bitte Name, gültige E-Mail und Wunschtermin angeben.",
        past: "Bitte wählen Sie einen Termin in der Zukunft.",
        err: "Etwas ist schiefgelaufen. Bitte schreiben Sie an info@rexity.ai."
      },
      en: {
        sending: "Sending…",
        ok: "Thanks! Your request is in — we will confirm by email shortly.",
        invalid: "Please provide your name, a valid email and a preferred time.",
        past: "Please pick a date and time in the future.",
        err: "Something went wrong. Please email info@rexity.ai."
      }
    }
  };
  function t(kind, key) {
    var set_ = T[kind] || T.lead;
    return (set_[get()] || set_.de)[key];
  }

  function mailtoHref() {
    var de = get() === "de";
    var subject = de ? "Ich benötige mehr Informationen" : "I need more info on this topic";
    var body = de
      ? "Hallo Rexity-Team,\n\nich interessiere mich für mehr Informationen zu Ihren Tools, zum Zeitrahmen, zu Kosten und Paketen — und gerne eine Demo.\n\nViele Grüße"
      : "Hey Rexity,\n\nI am interested in getting more info about your tools, timeline, costs etc and a demo?\n\nBest regards";
    return "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }
  // info@rexity.ai inside a message becomes a pre-filled mailto link (as production).
  function setText(el, text) {
    el.textContent = "";
    String(text).split(EMAIL).forEach(function (part, i, arr) {
      if (part) el.appendChild(doc.createTextNode(part));
      if (i < arr.length - 1) {
        var a = doc.createElement("a");
        a.textContent = EMAIL;
        a.href = mailtoHref();
        a.style.cssText = "color:inherit;font-weight:600;text-decoration:underline";
        el.appendChild(a);
      }
    });
  }

  var uid = 0;
  function box(form, which) {
    // [data-rx-success] / [data-rx-error] next to the form (template .w-form-done / .w-form-fail),
    // or created on the fly after the form.
    var scope = form.parentNode;
    var el = scope && scope.querySelector("[data-rx-" + which + "]");
    if (!el) {
      el = doc.createElement("div");
      el.setAttribute("data-rx-" + which, "");
      el.className = which === "success" ? "form-message-success-2 w-form-done" : "form-message-error-3 w-form-fail";
      el.setAttribute("role", which === "success" ? "status" : "alert");
      form.parentNode.insertBefore(el, form.nextSibling);
    }
    if (!el.id) el.id = "rx-msg-" + ++uid;
    return el;
  }
  function show(el, text) {
    var target = el.querySelector("[data-rx-message]") || el;
    setText(target, text);
    el.style.display = "block";
  }
  function hide(el) {
    el.style.display = "";
  }

  function field(form, names) {
    for (var i = 0; i < names.length; i++) {
      var f = form.querySelector('[name="' + names[i] + '"]');
      if (f) return f;
    }
    return null;
  }
  function val(form, names) {
    var f = field(form, names);
    return f ? String(f.value || "").trim() : "";
  }
  function markInvalid(form, fields, errEl) {
    var all = form.querySelectorAll("[aria-invalid]");
    for (var i = 0; i < all.length; i++) {
      all[i].removeAttribute("aria-invalid");
      if (all[i].getAttribute("aria-describedby") === errEl.id) all[i].removeAttribute("aria-describedby");
    }
    for (var j = 0; j < fields.length; j++) {
      if (!fields[j]) continue;
      fields[j].setAttribute("aria-invalid", "true");
      if (!fields[j].getAttribute("aria-describedby")) fields[j].setAttribute("aria-describedby", errEl.id);
    }
    if (fields[0] && fields[0].focus) fields[0].focus();
  }

  function submitButton(form) {
    return form.querySelector('[type="submit"]') || form.querySelector("button:not([type])");
  }
  function labelEls(btn) {
    if (!btn) return [];
    if (btn.hasAttribute("data-de")) return [btn];
    var l = btn.querySelectorAll("[data-de][data-en]");
    if (l.length) return [].slice.call(l);
    return [btn];
  }
  function busy(form, on, kind) {
    var btn = submitButton(form);
    if (!btn) return;
    btn.disabled = on;
    btn.setAttribute("aria-busy", on ? "true" : "false");
    labelEls(btn).forEach(function (el) {
      if (on) {
        if (!el.hasAttribute("data-rx-label")) el.setAttribute("data-rx-label", el.textContent);
        el.textContent = t(kind, "sending");
      } else {
        var v = el.getAttribute("data-" + get()) || el.getAttribute("data-rx-label");
        if (v != null) el.textContent = v;
        el.removeAttribute("data-rx-label");
      }
    });
  }

  function post(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "same-origin"
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        return { ok: r.ok && data && data.ok, status: r.status, data: data || {} };
      });
    });
  }

  // Europe/Berlin wall time -> Date (the slot list is in German time).
  function berlinOffset(ms) {
    var parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(ms)).forEach(function (p) { parts[p.type] = p.value; });
    return (Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second) - ms) / 60000;
  }
  function berlinDate(dateStr, timeStr) {
    var d = dateStr.split("-"), h = timeStr.split(":");
    if (d.length !== 3 || h.length < 2) return null;
    try {
      var guess = Date.UTC(+d[0], +d[1] - 1, +d[2], +h[0], +h[1]);
      var ms = guess - berlinOffset(guess) * 60000;
      ms = guess - berlinOffset(ms) * 60000;
      return new Date(ms);
    } catch (e) {
      var local = new Date(dateStr + "T" + timeStr);
      return isNaN(local.getTime()) ? null : local;
    }
  }
  function berlinToday(offsetDays) {
    var ms = Date.now() + (offsetDays || 0) * 86400000;
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day;
    } catch (e) {
      return new Date(ms).toISOString().slice(0, 10);
    }
  }

  function common(form) {
    return {
      company_website: val(form, ["company_website", "_gotcha"]),
      lang: get(),
      source: form.getAttribute("data-rx-source") || form.id || "form",
      page: location.pathname
    };
  }

  // ---- bot check for the lead form (Cloudflare Turnstile; public site key, the secret is in Vercel) ----
  // Explicit rendering: the script from challenges.cloudflare.com is loaded when the visitor first touches the
  // form, the widget sits above the button and is always visible (founder, 2 Oct 2026; its place is the form's
  // <div class="rx-form__bot" data-rx-bot>, 65 px reserved in rexity.css, so nothing moves when it appears). A token
  // is single-use and lives five minutes: after a submit or on expiry the widget is reset.
  var TS_KEY = "0x4AAAAAAFMB5KSMA-E1D8vB";
  var TS_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var TS_OFF = !TS_KEY || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  function botSettle(b, token) {
    if (b.waiters.length) {
      var w = b.waiters;
      b.waiters = [];
      b.token = "";
      if (token) b.stale = true;
      for (var i = 0; i < w.length; i++) w[i](i === 0 ? token : "");
    } else b.token = token || "";
  }
  function botReset(b) {
    b.token = "";
    b.stale = false;
    try { if (b.id !== null && window.turnstile) window.turnstile.reset(b.id); } catch (e) {}
  }
  function botRender(b) {
    if (b.id !== null || !window.turnstile) return;
    var compact = b.box.clientWidth > 0 && b.box.clientWidth < 300; // "flexible" needs 300 px
    try {
      b.id = window.turnstile.render(b.box, {
        sitekey: TS_KEY,
        theme: doc.documentElement.hasAttribute("data-palette") ? "light" : "dark",
        language: get(),
        size: compact ? "compact" : "flexible",
        appearance: "always",
        "refresh-expired": "manual",
        callback: function (token) { b.stale = false; botSettle(b, token); },
        "expired-callback": function () { botReset(b); },
        "timeout-callback": function () { botReset(b); },
        "error-callback": function () { botSettle(b, ""); return true; }
      });
    } catch (e) { b.id = null; botSettle(b, ""); }
  }
  /* the form's bot check (created on first use), or null where it is off */
  function botFor(form) {
    if (TS_OFF) return null;
    if (form.__rxBot) return form.__rxBot;
    var holder = form.querySelector("[data-rx-bot]"); // the reserved place in the markup
    if (!holder) {
      holder = doc.createElement("div");
      holder.className = "rx-form__bot";
      var actions = form.querySelector(".rx-actions");
      if (actions && actions.parentNode === form) form.insertBefore(holder, actions);
      else form.appendChild(holder);
    }
    var b = (form.__rxBot = { box: holder, id: null, token: "", stale: false, waiters: [], loading: false });
    if (window.turnstile) { botRender(b); return b; }
    b.loading = true;
    var tries = 0;
    var poll = setInterval(function () {
      if (window.turnstile) { clearInterval(poll); b.loading = false; botRender(b); }
      else if (++tries > 100) { clearInterval(poll); b.loading = false; form.__rxBot = null; holder.remove(); botSettle(b, ""); }
    }, 150);
    if (!doc.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]')) {
      var sc = doc.createElement("script");
      sc.src = TS_SRC;
      sc.async = true;
      sc.onerror = function () { clearInterval(poll); b.loading = false; form.__rxBot = null; sc.remove(); holder.remove(); botSettle(b, ""); };
      doc.head.appendChild(sc);
    }
    return b;
  }
  /* cb(token): a token nobody has used yet; "" when none could be had (or the check is off here: cb(null)) */
  function botToken(form, cb) {
    var b = botFor(form);
    if (!b) { cb(null); return; }
    if (b.token) { var tk = b.token; b.token = ""; b.stale = true; cb(tk); return; }
    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; cb(""); } }, 45000);
    b.waiters.push(function (token) { if (done) return; done = true; clearTimeout(timer); cb(token); });
    if (b.id !== null && b.stale) botReset(b);
  }
  // no widget here (localhost): do not keep its reserved place
  if (TS_OFF) Array.prototype.forEach.call(doc.querySelectorAll("[data-rx-bot]"), function (el) { el.hidden = true; });
  doc.addEventListener("focusin", function (e) {
    var f = e.target && e.target.closest ? e.target.closest('form[data-rx-form="lead"]') : null;
    if (f) botFor(f);
  });

  function handleLead(form) {
    var ok = box(form, "success"), err = box(form, "error");
    hide(err);
    var nameF = field(form, ["name", "your-name"]);
    var emailF = field(form, ["email", "your-email"]);
    var payload = common(form);
    payload.name = val(form, ["name", "your-name"]);
    payload.email = val(form, ["email", "your-email"]);
    payload.phone = val(form, ["phone", "tel"]);
    payload.company = val(form, ["company"]);
    payload.service = val(form, ["service", "your-subject", "subject"]);
    payload.subject = val(form, ["subject", "your-subject"]);
    payload.message = val(form, ["message", "your-message"]);
    var bad = [];
    if (!payload.name) bad.push(nameF);
    if (!EMAIL_RE.test(payload.email)) bad.push(emailF);
    if (bad.length) {
      show(err, t("lead", "invalid"));
      markInvalid(form, bad, err);
      return;
    }
    markInvalid(form, [], err);
    busy(form, true, "lead");
    botToken(form, function (token) {
      if (token === "") { // the bot check is on here and gave no token
        show(err, t("lead", "bot"));
        busy(form, false, "lead");
        return;
      }
      if (token) payload.turnstileToken = token;
      post("/api/lead", payload)
        .then(function (res) {
          if (res.ok) {
            form.reset();
            form.style.display = "none";
            show(ok, t("lead", "ok"));
          } else if (res.status === 403 && res.data.code === "bot_check") {
            show(err, t("lead", "bot")); // the next submit gets a fresh token (the used one is reset on demand)
          } else {
            // The API answers in English; show its text only in English, the production DE copy otherwise.
            show(err, get() === "en" && res.data.error ? res.data.error : t("lead", "err"));
          }
        })
        .catch(function () {
          show(err, t("lead", "err"));
        })
        .then(function () {
          busy(form, false, "lead");
        });
    });
  }

  function handleBook(form) {
    var ok = box(form, "success"), err = box(form, "error");
    hide(err);
    var nameF = field(form, ["name"]), emailF = field(form, ["email"]);
    var dateF = field(form, ["date"]), timeF = field(form, ["time"]), startF = field(form, ["start"]);
    var payload = common(form);
    payload.name = val(form, ["name"]);
    payload.email = val(form, ["email"]);
    payload.phone = val(form, ["phone"]);
    payload.message = val(form, ["message"]);
    var start = null;
    if (dateF || timeF) {
      if (dateF && dateF.value && timeF && timeF.value) start = berlinDate(dateF.value, timeF.value);
    } else if (startF && startF.value) {
      start = new Date(startF.value); // datetime-local, local time (as production)
    }
    var bad = [];
    if (!payload.name) bad.push(nameF);
    if (!EMAIL_RE.test(payload.email)) bad.push(emailF);
    if (!start || isNaN(start.getTime())) bad.push(dateF && !dateF.value ? dateF : timeF || startF);
    if (bad.length) {
      show(err, t("book", "invalid"));
      markInvalid(form, bad, err);
      return;
    }
    if (start.getTime() < Date.now()) {
      show(err, t("book", "past"));
      markInvalid(form, [dateF || startF, timeF], err);
      return;
    }
    markInvalid(form, [], err);
    payload.start = start.toISOString();
    busy(form, true, "book");
    post("/api/book", payload)
      .then(function (res) {
        if (!res.ok) throw new Error((res.data && res.data.error) || "request failed");
        form.reset();
        form.style.display = "none";
        show(ok, t("book", "ok"));
      })
      .catch(function () {
        show(err, t("book", "err"));
      })
      .then(function () {
        busy(form, false, "book");
      });
  }

  // Capture phase + stopImmediatePropagation: the Webflow forms module
  // (delegated on document for ".w-form form") never sees these forms.
  doc.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!form || !form.matches || !form.matches("form[data-rx-form]")) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var kind = form.getAttribute("data-rx-form");
      var sb = submitButton(form);
      if (sb && sb.getAttribute("aria-busy") === "true") return;
      if (kind === "book") handleBook(form);
      else handleLead(form);
    },
    true
  );
  // clear the invalid state as soon as the visitor edits the field
  doc.addEventListener("input", function (e) {
    var f = e.target;
    if (f && f.getAttribute && f.getAttribute("aria-invalid") === "true" && f.closest("form[data-rx-form]")) f.removeAttribute("aria-invalid");
  });

  /* ------------------------------------------------------------ 3. booking modal */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';
  var openModal = null, opener = null;

  // The template creates its Lenis instance as a top-level `const lenis` (global lexical binding).
  function smoothScroll(method) {
    try {
      /* global lenis */
      var l = typeof lenis !== "undefined" ? lenis : window.lenis;
      if (l && typeof l[method] === "function") l[method]();
    } catch (e) {}
  }
  function focusables(modal) {
    return [].slice.call(modal.querySelectorAll(FOCUSABLE)).filter(function (el) {
      return el.getClientRects().length > 0;
    });
  }
  function resetBooking(modal) {
    var form = modal.querySelector("form[data-rx-form]");
    if (!form) return;
    form.style.display = "";
    var msgs = modal.querySelectorAll("[data-rx-success], [data-rx-error]");
    for (var i = 0; i < msgs.length; i++) hide(msgs[i]);
    var date = form.querySelector('[name="date"]');
    if (date) {
      date.min = berlinToday(0);
      date.max = berlinToday(365);
    }
    var start = form.querySelector('[name="start"]');
    if (start && start.type === "datetime-local") {
      var min = new Date(Date.now() + 3600000);
      min.setMinutes(0, 0, 0);
      start.min = new Date(min.getTime() - min.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
  }
  function open(name, from) {
    var modal = doc.querySelector('[data-rx-modal="' + (name || "booking") + '"]');
    if (!modal) return false;
    if (openModal) close();
    opener = from || doc.activeElement;
    resetBooking(modal);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    root.classList.add("rx-modal-open");
    smoothScroll("stop");
    openModal = modal;
    setTimeout(function () {
      var first = modal.querySelector("input:not([type=hidden]):not([tabindex='-1']), select, textarea") || focusables(modal)[0];
      if (first) first.focus();
    }, 40);
    return true;
  }
  function close() {
    if (!openModal) return;
    var modal = openModal;
    openModal = null;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    root.classList.remove("rx-modal-open");
    smoothScroll("start");
    if (opener && opener.focus && doc.contains(opener)) {
      try { opener.focus({ preventScroll: true }); } catch (e) { opener.focus(); }
    }
    opener = null;
  }

  doc.addEventListener("click", function (e) {
    var t_ = e.target;
    if (!t_ || !t_.closest) return;
    var trigger = t_.closest("[data-rx-open]");
    if (trigger) {
      if (open(trigger.getAttribute("data-rx-open"), trigger)) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }
    if (openModal && t_.closest("[data-rx-close]") && openModal.contains(t_)) {
      e.preventDefault();
      close();
    }
  }, true);
  doc.addEventListener("keydown", function (e) {
    if (!openModal) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    var f = focusables(openModal);
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    var active = doc.activeElement;
    if (e.shiftKey && (active === first || !openModal.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !openModal.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  });
  doc.addEventListener("focusin", function (e) {
    if (openModal && !openModal.contains(e.target)) {
      var f = focusables(openModal);
      if (f[0]) f[0].focus();
    }
  });

  /* ------------------------------------------------------------ 3b. menu overlay: keyboard (Sprint 6B QA) */
  // The template's full-screen menu (≤991 px) opens and closes through its own IX2 click
  // interactions on .menu-open-button / .menu-close-button-2; that motion is untouched here.
  // Closed, the panel only sits translated off-screen, so its 14 links stayed in the Tab order
  // and Esc did nothing. Now: the closed panel is `inert`; opening moves focus to its close
  // button; Tab stays inside while it is open; Esc closes it through the template's own close
  // button and focus returns to the burger.
  var menuPanel = doc.querySelector(".menu-wrapper .menu");
  var menuWrap = menuPanel && menuPanel.closest(".menu-wrapper");
  var menuOpenBtn = doc.querySelector(".menu-open-button");
  var menuCloseBtn = menuPanel && menuPanel.querySelector(".menu-close-button-2");
  var menuWasOpen = false;
  function menuIsOpen() {
    if (!menuPanel || getComputedStyle(menuWrap).display === "none") return false;
    var r = menuPanel.getBoundingClientRect();
    return r.width > 0 && r.left < window.innerWidth - 1 && r.right > 1;
  }
  function syncMenu() {
    if (!menuPanel) return;
    var isOpen = menuIsOpen();
    var active = doc.activeElement;
    if (!isOpen && menuWasOpen && menuOpenBtn && (!active || active === doc.body || menuPanel.contains(active))) {
      try { menuOpenBtn.focus({ preventScroll: true }); } catch (e) {}
    }
    if (isOpen) menuPanel.removeAttribute("inert");
    else menuPanel.setAttribute("inert", "");
    root.classList.toggle("rx-menu-open", isOpen);
    if (isOpen && !menuWasOpen && menuCloseBtn && !openModal) {
      try { menuCloseBtn.focus({ preventScroll: true }); } catch (e) {}
    }
    menuWasOpen = isOpen;
  }
  if (menuPanel && window.MutationObserver) {
    syncMenu();
    new MutationObserver(syncMenu).observe(menuPanel, { attributes: true, attributeFilter: ["style", "class"] });
    window.addEventListener("resize", syncMenu);
    doc.addEventListener("keydown", function (e) {
      if (openModal || !menuIsOpen()) return;
      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        if (menuCloseBtn) menuCloseBtn.click();
        if (menuOpenBtn) {
          try { menuOpenBtn.focus({ preventScroll: true }); } catch (err) {}
        }
        return;
      }
      if (e.key !== "Tab") return;
      var f = focusables(menuPanel);
      if (!f.length) return;
      var active = doc.activeElement;
      if (e.shiftKey && (active === f[0] || !menuPanel.contains(active))) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && (active === f[f.length - 1] || !menuPanel.contains(active))) {
        e.preventDefault();
        f[0].focus();
      }
    });
  }

  /* ------------------------------------------------------------ 5. Sprint 12 global fixes */
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function lineHeight(el) {
    var cs = getComputedStyle(el);
    var lh = parseFloat(cs.lineHeight);
    return isNaN(lh) ? parseFloat(cs.fontSize) * 1.3 : lh;
  }

  // 5a. The template's hover roll puts the label twice into a box one line high
  // (.button-text-col, overflow hidden); a label that wraps overflows it and both
  // copies show up garbled. Mark those buttons; rexity.css then shows one full
  // label row and switches the roll off for them only. Re-checked on resize,
  // font load and language change, so a label that fits again gets its roll back.
  function checkWraps() {
    var cols = doc.querySelectorAll(".button-text-col");
    for (var i = 0; i < cols.length; i++) {
      var col = cols[i];
      var btn = col.closest("a, button") || col.parentElement;
      var label = col.querySelector(".button-text") || col.firstElementChild;
      if (!btn || !label || !label.getClientRects().length) continue;
      var wraps = label.getBoundingClientRect().height > lineHeight(label) * 1.5;
      if (wraps !== btn.hasAttribute("data-rx-wrap")) {
        if (wraps) btn.setAttribute("data-rx-wrap", "");
        else btn.removeAttribute("data-rx-wrap");
      }
    }
  }

  // 5b. Safety net for IX3's SplitText line splits (the root cause of B-5, a flex
  // box whose width changed with the split, is fixed in rexity.css §11): after the
  // web fonts and the page have loaded, any split whose lines wrap again (a line
  // box taller than 1.6 lines, no <br>) is split once more. IX3 rebuilds its
  // timeline on split and keeps its progress. Width changes are autoSplit's job.
  function healSplits() {
    var lines = doc.querySelectorAll(".gsap_split_line");
    var hosts = [];
    for (var i = 0; i < lines.length; i++) {
      var h = lines[i].parentElement;
      for (var up = 0; h && up < 3 && !splitOf(h); up++) h = h.parentElement;
      if (h && splitOf(h) && hosts.indexOf(h) < 0) hosts.push(h);
    }
    hosts.forEach(function (host) {
      var own = host.querySelectorAll(".gsap_split_line");
      for (var k = 0; k < own.length; k++) {
        var probe = own[k].firstElementChild || own[k];
        if (!own[k].querySelector("br") && own[k].getBoundingClientRect().height > lineHeight(probe) * 1.6) {
          var s = splitOf(host);
          try { s.revert(); s.split(s.vars); } catch (e) {}
          return;
        }
      }
    });
  }
  function settle() { healSplits(); checkWraps(); }
  var settleSoon = debounce(settle, 200);
  doc.addEventListener("DOMContentLoaded", function () { setTimeout(checkWraps, 0); });
  window.addEventListener("load", function () { setTimeout(settle, 60); setTimeout(settle, 1500); });
  window.addEventListener("resize", debounce(checkWraps, 200)); // width changes: SplitText autoSplit re-splits itself
  window.addEventListener("rexity:languagechange", function () { setTimeout(settle, 60); });
  if (doc.fonts) {
    if (doc.fonts.ready) doc.fonts.ready.then(function () { setTimeout(settle, 60); });
    if (doc.fonts.addEventListener) doc.fonts.addEventListener("loadingdone", settleSoon);
  }

  // 5c. Below 992 px the header is fixed (rexity.css); hide it while scrolling
  // down, bring it back on any upward scroll, near the top and while the menu is open.
  var lastY = window.pageYOffset || 0;
  var navTick = false;
  function navScroll() {
    navTick = false;
    var y = window.pageYOffset || 0;
    var hide = window.innerWidth < 992 && y > 160 && y > lastY + 4 && !root.classList.contains("rx-menu-open");
    if (hide) root.classList.add("rx-nav-hidden");
    else if (y < lastY - 4 || y <= 160) root.classList.remove("rx-nav-hidden");
    lastY = y;
  }
  window.addEventListener("scroll", function () {
    if (!navTick) { navTick = true; requestAnimationFrame(navScroll); }
  }, { passive: true });
  doc.addEventListener("focusin", function (e) {
    if (e.target && e.target.closest && e.target.closest(".header")) root.classList.remove("rx-nav-hidden");
  });

  // 5d. Keyboard (C N-15): entrance reveals (IX footer cards, page reveals) can still be at
  // opacity 0 when Tab reaches their links. A focused element's hidden ancestors snap to their
  // end state at once (rexity.css .rx-shown); on "/" the first Tab also ends the intro.
  doc.addEventListener("focusin", function (e) {
    var el = e.target;
    if (!el || el === doc.body || el === root || !el.parentElement) return;
    for (var n = el; n && n !== doc.body; n = n.parentElement) {
      if (n.classList.contains("rx-shown")) continue;
      if (parseFloat(getComputedStyle(n).opacity) < 0.99) {
        n.classList.add("rx-shown");
        if (n.style && n.style.transform) n.classList.add("rx-shown-t");
      }
    }
  }, true);
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Tab") root.classList.add("rx-intro-done");
  }, { capture: true, once: true });

  window.Rexity = {
    getLang: get,
    setLang: set,
    applyLang: apply,
    openBooking: function (from) { return open("booking", from); },
    closeModal: close,
    checkWraps: checkWraps,
    healSplits: healSplits
  };

  /* ------------------------------------------------------------ 4. styleguide switchers */
  function pick(key, attr, value, allowed, def) {
    if (allowed.indexOf(value) < 0) value = def;
    if (value === def) root.removeAttribute(attr);
    else root.setAttribute(attr, value);
    try { localStorage.setItem(key, value); } catch (e) {}
    var btns = doc.querySelectorAll("[" + attr + "-set]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute(attr + "-set") === value;
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
      btns[i].classList.toggle("w--current", on); // the template's own "current" look for .secondary-button
    }
    if (attr === "data-palette") {
      var meta = doc.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", value === "dark" ? "#1d1d1d" : "#f7f7f4");
    }
  }
  var SWITCH = [
    ["rexity_palette", "data-palette", ["dark", "light", "contrast"], "dark"],
    ["rexity_fontset", "data-fontset", ["template", "rexity"], "template"]
  ];
  SWITCH.forEach(function (s) {
    if (!doc.querySelector("[" + s[1] + "-set]")) return; // switchers exist on /styleguide only
    var stored = null;
    try { stored = localStorage.getItem(s[0]); } catch (e) {}
    pick(s[0], s[1], stored || root.getAttribute(s[1]) || s[3], s[2], s[3]);
    doc.addEventListener("click", function (e) {
      var b = e.target && e.target.closest && e.target.closest("[" + s[1] + "-set]");
      if (!b) return;
      e.preventDefault();
      pick(s[0], s[1], b.getAttribute(s[1] + "-set"), s[2], s[3]);
    });
  });
})();
