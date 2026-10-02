/* website-check.js — /website-check only (loaded with defer by scripts/pages/30-services.mjs).
   Drives the tool rendered by scripts/pages/lib-services/check-tool.mjs: the address form in the hero, the report
   card below it. Contract: docs/CHECK_API.md. No data is stored in the browser.

   What the page shows (Sprint 36, founder: "show everything in Ergebnis"): the whole result. An overall ring with its
   band word and the Kurzfazit, six area cards (small ring, verdict line, how many checks ended in which state and
   the full list of checks, open by default: state with its word, label, measured value, points), the speed card's
   method and, when Lighthouse ran, its four category scores and LCP/CLS/TBT, the disclaimer under the two
   security-related areas, and the pages read. The report by e-mail (confirmed address) is a copy of the same
   content. No advice anywhere.

   Bot check (Cloudflare Turnstile): the widget is always visible (founder, 2 Oct 2026; its place under the address
   field is reserved by the stylesheet, so nothing moves when it appears). It is rendered explicitly into [data-wc-ts], the script from
   challenges.cloudflare.com is loaded only when the visitor touches the form, and never on localhost / 127.0.0.1
   (the widget's host name is rexity.ai; a local run sends no token and works when the server has no secret).
   A token is single-use and sent as `turnstileToken`; a verified answer carries a `pass` (30 minutes) that the
   later requests of the visit send instead (language switch, report request). A 403 `bot_check` gets one retry
   with a fresh token, then a clear message.

   Layout: the report card is shown in the same task as the visitor's click and keeps one screen of height while
   the check runs (website-check-report.css, .is-busy); the result then fills space below the fold.

   Accessibility: one polite live region announces the step that is running and the finished result; errors are
   announced (role="alert") and focus goes to the field; when a result arrives, focus moves to the report heading.
   Every state carries a word (never colour alone). Reduced motion: no pulse, no ring draw-in, no counting up, no
   smooth scroll. The lists of checks are native disclosures (details/summary): keyboard and screen readers get them
   for free, and a list a visitor closed stays closed when the language is switched.

   The steps follow the clock, not the server (the function answers once, at the end): they say what is being
   done, in the order the parts usually finish. */
(function () {
  "use strict";
  var doc = document;
  var root = doc.querySelector("[data-wc]");
  var form = doc.querySelector("[data-wc-form]");
  if (!root || !form || !window.fetch) return;
  var q = function (sel, el) { return (el || root).querySelector(sel); };
  var report = q("[data-wc-report]");
  var runBox = q("[data-wc-run]");
  var outBox = q("[data-wc-out]");
  var areas = q("[data-wc-areas]");
  var mail = q("[data-wc-mail]");
  var statusText = q("[data-wc-status-text]");
  var errorBox = form.querySelector("[data-wc-error]");
  var submit = form.querySelector("[data-wc-submit]");
  var tsBox = form.querySelector("[data-wc-ts]");
  var mailSubmit = q("[data-wc-mail-submit]");
  var mailStatus = q("[data-wc-mail-status]");
  var mailAsk = q("[data-wc-mail-ask]");
  var mailDone = q("[data-wc-mail-done]");
  var title = q("[data-wc-title]");
  var urlInput = doc.getElementById("wc-url");
  var emailInput = doc.getElementById("wc-email");
  if (!report || !mail || !urlInput || !emailInput || !mailAsk || !mailDone) return;
  // The report card's stylesheet: the card is hidden until a check starts, so the file is fetched after the page
  // has loaded (or as soon as the visitor touches the form), never in competition with the first paint.
  var cssHref = form.getAttribute("data-wc-css");
  var cssAdded = false;
  function addCss() {
    if (cssAdded || !cssHref) return;
    cssAdded = true;
    var link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    doc.head.appendChild(link);
  }
  if (doc.readyState === "complete") setTimeout(addCss, 0);
  else window.addEventListener("load", function () { setTimeout(addCss, 0); });
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var S = {
    de: {
      steps: ["Die Seite wird abgerufen.", "Die Kontaktwege werden geprüft, auch auf verlinkten Kontakt- und Buchungsseiten.", "Auffindbarkeit und Pflichtseiten werden geprüft.", "Schutzeinstellungen und E-Mail-Domain werden von außen gelesen.", "Das Tempo wird gemessen. Das dauert am längsten, bis zu etwa einer Minute.", "Das Ergebnis wird zusammengestellt."],
      running: "Die Prüfung läuft",
      resultFor: "Ihr Ergebnis",
      done: function (host, score) { return "Prüfung abgeschlossen: " + host + (score === null ? " – kein Gesamtwert, weil kein Bereich geprüft werden konnte." : " erreicht insgesamt " + score + " von 100 Punkten."); },
      cached: "Ergebnis der letzten 24 Stunden",
      empty: "Bitte geben Sie die Adresse Ihrer Website ein.",
      network: "Die Prüfung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      timeout: "Die Prüfung hat zu lange gedauert. Bitte versuchen Sie es in ein paar Minuten erneut.",
      notChecked: "nicht prüfbar",
      when: function (date) { return "geprüft am " + date; },
      wait: "Bitte einen Moment Geduld",
      band: { good: "gut", mid: "mittel", low: "schwach" },
      of100: function (n) { return n + " von 100"; },
      overallOf: function (n) { return n === 6 ? "aus allen sechs Bereichen" : "aus " + n + " von sechs Bereichen"; },
      checks: function (n) { return n === 1 ? "1 Prüfpunkt" : n + " Prüfpunkte"; },
      noPoints: "ohne Punkte",
      overallNone: "Kein Gesamtwert: Kein Bereich ließ sich prüfen.",
      status: { ok: "erfüllt", partial: "teilweise", fail: "offen", info: "Hinweis", unknown: "nicht prüfbar", na: "entfällt" },
      pages: function (list) { return "Mitgelesene Seiten: " + list.join(", ") + "."; },
      truncated: "Die Seite ist sehr groß; ausgewertet wurden die ersten 1,5 MB.",
      ai: "Kurzfazit von einer KI aus den Werten dieses Ergebnisses formuliert.",
      lh: { performance: "Leistung", accessibility: "Barrierefreiheit", bestPractices: "Best Practices", seo: "SEO" },
      mailSending: "Wird gesendet …",
      mailBad: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      mailFail: "Die E-Mail konnte gerade nicht versendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns an info@rexity.ai.",
      confirmH: "Bestätigungs-Mail unterwegs",
      confirmP: function (email, hours) { return "Wir haben eine E-Mail an " + email + " geschickt. Öffnen Sie den Link darin und bestätigen Sie dort den Versand; dann senden wir Ihnen den Bericht als Kopie dieses Ergebnisses. Der Link gilt " + hours + " Stunden. Nichts angekommen? Bitte sehen Sie auch im Spam-Ordner nach."; },
      sentH: "Bericht unterwegs",
      sentP: function (email) { return "Der Bericht, eine Kopie dieses Ergebnisses, ist unterwegs an " + email + "."; },
      botWait: "Kurze Sicherheitsprüfung …",
      botAsk: "Bitte bestätigen Sie kurz im Feld unter der Adresse, dass Sie kein automatisches Programm sind.",
      botFail: "Die Sicherheitsprüfung (Schutz vor automatischen Anfragen) ist nicht durchgelaufen. Bitte versuchen Sie es noch einmal. Hilft das nicht, laden Sie die Seite neu; ein Inhaltsblocker kann die Prüfung verhindern.",
      offer: {
        design: ["Webdesign: Websites, die Anfragen bringen", "/web/web-design"],
        relaunch: ["Website-Relaunch: neue Technik, gleiche Adresse", "/web/website-umzug"],
        care: ["Website-Wartung: damit die Werte so bleiben", "/website-wartung"]
      }
    },
    en: {
      steps: ["Fetching the page.", "Checking the ways to get in touch, also on linked contact and booking pages.", "Checking findability and mandatory pages.", "Reading protection settings and the e-mail domain from outside.", "Measuring speed. This takes longest, up to about a minute.", "Putting the result together."],
      running: "The check is running",
      resultFor: "Your result",
      done: function (host, score) { return "Check finished: " + host + (score === null ? " – no overall value because no area could be checked." : " reaches " + score + " out of 100 points overall."); },
      cached: "result from the last 24 hours",
      empty: "Please enter the address of your website.",
      network: "The check failed. Please check your internet connection and try again.",
      timeout: "The check took too long. Please try again in a few minutes.",
      notChecked: "could not be checked",
      when: function (date) { return "checked on " + date; },
      wait: "One moment, please",
      band: { good: "good", mid: "medium", low: "weak" },
      of100: function (n) { return n + " out of 100"; },
      overallOf: function (n) { return n === 6 ? "from all six areas" : "from " + n + " of six areas"; },
      checks: function (n) { return n === 1 ? "1 check" : n + " checks"; },
      noPoints: "no points",
      overallNone: "No overall value: no area could be checked.",
      status: { ok: "met", partial: "partly", fail: "open", info: "note", unknown: "could not be checked", na: "does not apply" },
      pages: function (list) { return "Pages read as well: " + list.join(", ") + "."; },
      truncated: "The page is very large; the first 1.5 MB were evaluated.",
      ai: "Short verdict worded by an AI from the values of this result.",
      lh: { performance: "Performance", accessibility: "Accessibility", bestPractices: "Best practices", seo: "SEO" },
      mailSending: "Sending …",
      mailBad: "Please enter a valid e-mail address.",
      mailFail: "The e-mail could not be sent just now. Please try again later or write to info@rexity.ai.",
      confirmH: "Confirmation e-mail on its way",
      confirmP: function (email, hours) { return "We have sent an e-mail to " + email + ". Open the link in it and confirm the dispatch there; then we send you the report as a copy of this result. The link is valid for " + hours + " hours. Nothing arrived? Please look in your spam folder as well."; },
      sentH: "Report on its way",
      sentP: function (email) { return "The report, a copy of this result, is on its way to " + email + "."; },
      botWait: "A short security check …",
      botAsk: "Please confirm briefly in the box under the address that you are not an automated program.",
      botFail: "The security check (protection against automated requests) did not complete. Please try once more. If that does not help, reload the page; a content blocker can prevent the check.",
      offer: {
        design: ["Web design: websites that bring enquiries", "/web/web-design"],
        relaunch: ["Website relaunch: new technology, same address", "/web/website-umzug"],
        care: ["Website maintenance: so the values stay this way", "/website-wartung"]
      }
    }
  };
  var BLOCKS = ["tempo", "find", "contact", "trust", "security", "mail"];
  var ORDER = ["ok", "partial", "fail", "info", "unknown", "na"];
  var MARK = { ok: "✓", partial: "~", fail: "✗", info: "i", unknown: "?", na: "–" }; // the same marks as in the report e-mail
  var STEP_AT = [0, 1.2, 2.6, 3.8, 5.2, 48]; // seconds at which each step becomes the active one

  function lang() {
    try { return localStorage.getItem("rexity_lang") === "en" ? "en" : "de"; } catch (e) { return doc.documentElement.lang === "en" ? "en" : "de"; }
  }
  function L() { return S[lang()]; }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function fill(node, children) {
    while (node.firstChild) node.removeChild(node.firstChild);
    for (var i = 0; i < children.length; i++) node.appendChild(children[i]);
  }
  function show(node, on) { if (on) node.removeAttribute("hidden"); else node.setAttribute("hidden", ""); }

  var state = { busy: false, last: null, lastInput: null, timer: null, mailState: "idle", mailTo: "", mailHours: 48, step: -1, pass: null, passUntil: 0, noCheck: false };

  // ---------------------------------------------------------------- bot check (Cloudflare Turnstile)
  var host = location.hostname;
  var LOCAL = host === "localhost" || host === "127.0.0.1";
  var siteKey = form.getAttribute("data-wc-sitekey") || "";
  var bot = { on: !!(siteKey && tsBox) && !LOCAL, id: null, token: null, stale: false, loading: false, waiters: [], asking: false };
  if (tsBox && !bot.on) tsBox.hidden = true; // no widget here (localhost): do not keep its reserved place
  var TS_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

  function botSettle(token) {
    if (bot.waiters.length) {
      var w = bot.waiters;
      bot.waiters = [];
      bot.token = null;
      if (token) bot.stale = true; // handed out: the widget must be reset before the next token
      for (var i = 0; i < w.length; i++) w[i](i === 0 ? token : null);
    } else {
      bot.token = token;
    }
  }
  function botReset() {
    bot.token = null;
    bot.stale = false;
    try { if (bot.id !== null && window.turnstile) window.turnstile.reset(bot.id); } catch (e) { /* nothing */ }
  }
  function botRender() {
    if (!bot.on || bot.id !== null || !window.turnstile) return;
    try {
      bot.id = window.turnstile.render(tsBox, {
        sitekey: siteKey,
        theme: "light",
        language: lang(),
        size: "flexible",
        appearance: "always", // founder, 2 Oct 2026: the widget is visible everywhere (flexible: 100 % wide, 65 px high)
        "refresh-expired": "manual",
        callback: function (token) { bot.stale = false; botSettle(token); },
        "expired-callback": function () { botReset(); }, // a token lives five minutes: get a fresh one
        "timeout-callback": function () { botReset(); },
        "error-callback": function () { bot.token = null; botSettle(null); return true; },
        "before-interactive-callback": function () { bot.asking = true; if (bot.waiters.length) statusText.textContent = L().botAsk; },
        "after-interactive-callback": function () { bot.asking = false; }
      });
      tsBox.setAttribute("data-on", "");
    } catch (e) { bot.id = null; botSettle(null); }
  }
  function botLoad() {
    if (!bot.on || bot.id !== null || bot.loading) return;
    if (window.turnstile) { botRender(); return; }
    bot.loading = true;
    var tries = 0;
    var poll = setInterval(function () {
      if (window.turnstile) { clearInterval(poll); bot.loading = false; botRender(); }
      else if (++tries > 100) { clearInterval(poll); bot.loading = false; botSettle(null); }
    }, 150);
    if (doc.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]')) return; // the chat form loads the same file
    var s = doc.createElement("script");
    s.src = TS_SRC;
    s.async = true;
    s.onerror = function () { clearInterval(poll); bot.loading = false; if (s.parentNode) s.parentNode.removeChild(s); botSettle(null); };
    doc.head.appendChild(s);
  }
  /* -> Promise<string|null>: a token nobody has used yet, or null when none could be had in time */
  function botToken() {
    return new Promise(function (resolve) {
      if (bot.token) { var tk = bot.token; bot.token = null; bot.stale = true; resolve(tk); return; }
      var done = false;
      var timer = setTimeout(function () { if (done) return; done = true; resolve(null); }, 60000);
      bot.waiters.push(function (token) { if (done) return; done = true; clearTimeout(timer); resolve(token); });
      if (bot.id === null) botLoad();
      else if (bot.stale) botReset();
    });
  }
  /* -> Promise<object|null>: the fields that prove the bot check ({} when none is needed), or null */
  function proof(force) {
    if (!bot.on) return Promise.resolve({});
    if (!force && state.pass && state.passUntil > Date.now() + 5000) return Promise.resolve({ pass: state.pass });
    if (!force && state.noCheck) return Promise.resolve({}); // the server answered a request without issuing a pass: its check is off
    return botToken().then(function (token) { return token ? { turnstileToken: token } : null; });
  }
  if (bot.on) {
    form.addEventListener("focusin", botLoad);
    form.addEventListener("pointerdown", botLoad);
  }
  form.addEventListener("focusin", addCss);
  form.addEventListener("pointerdown", addCss);

  // ---------------------------------------------------------------- requests
  function post(body, timeoutMs) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
    return fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (resp) { return resp.json().catch(function () { return null; }).then(function (data) { return { status: resp.status, data: data }; }); })
      .then(function (r) { if (timer) clearTimeout(timer); return r; }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }
  /* one request with the bot check's proof; a 403 bot_check is repeated once with a fresh token */
  function send(body, timeoutMs, retried) {
    return proof(!!retried).then(function (p) {
      if (!p) return { status: 403, data: { ok: false, error: "bot_check", message: L().botFail } };
      var b = {};
      var k;
      for (k in body) if (Object.prototype.hasOwnProperty.call(body, k)) b[k] = body[k];
      for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) b[k] = p[k];
      return post(b, timeoutMs).then(function (r) {
        var d = r.data;
        if (d && d.pass) {
          state.pass = d.pass;
          state.passUntil = d.passExpiresAt ? Date.parse(d.passExpiresAt) || 0 : Date.now() + 25 * 60000;
          state.noCheck = false;
        } else if (d && d.ok && p.turnstileToken) {
          state.noCheck = true;
        }
        if (r.status === 403 && d && d.error === "bot_check") {
          state.pass = null;
          state.passUntil = 0;
          state.noCheck = false;
          if (bot.on && !retried) return send(body, timeoutMs, true);
          d.message = L().botFail; // our own sentence: it says what to do next
        }
        return r;
      });
    });
  }

  // ---------------------------------------------------------------- render
  function band(score) { return score >= 80 ? "good" : score >= 50 ? "mid" : "low"; }
  function count(node, to, animate) {
    if (!animate || reduce || !window.requestAnimationFrame) { node.textContent = String(to); return; }
    var t0 = null;
    var dur = 900;
    function frame(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      node.textContent = String(Math.round(to * eased));
      if (p < 1) window.requestAnimationFrame(frame);
    }
    node.textContent = "0";
    window.requestAnimationFrame(frame);
  }
  function setRing(card, score, animate) {
    var n = q("[data-wc-score]", card);
    var arc = q("[data-wc-arc]", card);
    if (score === null || score === undefined) {
      n.textContent = "–";
      arc.setAttribute("stroke-dasharray", "0 100");
      card.removeAttribute("data-band");
      return;
    }
    card.setAttribute("data-band", band(score));
    var dash = Math.max(0, Math.min(100, score)) + " 100";
    if (animate && !reduce) {
      arc.setAttribute("stroke-dasharray", "0 100");
      arc.getBoundingClientRect(); // the draw-in starts from an empty ring
    }
    arc.setAttribute("stroke-dasharray", dash);
    count(n, score, animate);
  }
  function pair(dl, label, value) {
    var d = el("div", "wc-lh__item");
    d.appendChild(el("dt", "", label));
    d.appendChild(el("dd", "", value));
    dl.appendChild(d);
  }
  // Sprint 34: the address of the score card for a result (same rule as cardPath() in api/_card.js).
  function shareUrl(data, lg) {
    var u;
    try { u = new URL(data.url); } catch (e) { return null; }
    var path = (u.pathname.replace(/\/+$/, "") || "/") + (u.search || "");
    var qs = [];
    if (path !== "/") qs.push("p=" + encodeURIComponent(path));
    if (lg === "en") qs.push("lang=en");
    return location.origin + "/website-check/ergebnis/" + encodeURIComponent(u.hostname.replace(/^www\./, "").toLowerCase()) + (qs.length ? "?" + qs.join("&") : "");
  }
  function wireShare(data, lg) {
    var box = document.querySelector("[data-wc-share]");
    if (!box) return;
    var url = data && data.overall && data.overall.score !== null ? shareUrl(data, lg) : null;
    box.hidden = !url;
    if (!url) return;
    var link = box.querySelector("[data-wc-share-link]");
    var status = box.querySelector("[data-wc-share-status]");
    var btn = box.querySelector("[data-wc-share-btn]");
    link.href = url;
    status.textContent = "";
    btn.onclick = function () {
      var en = lg === "en";
      var say = function (x) { status.textContent = x; };
      if (navigator.share) { navigator.share({ title: en ? "Website check: result" : "Website-Check: Ergebnis", url: url }).catch(function () {}); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { say(en ? "Link copied." : "Link kopiert."); },
          function () { say(en ? "Copying did not work. Please use the link next to the button." : "Kopieren hat nicht geklappt. Bitte den Link neben dem Button verwenden."); });
        return;
      }
      say(en ? "Please use the link next to the button." : "Bitte den Link neben dem Button verwenden.");
    };
  }

  function render(data, animate) {
    var t = L();
    var lg = lang();
    wireShare(data, lg);
    var date = "";
    try { date = new Intl.DateTimeFormat(lg === "en" ? "en-GB" : "de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.checkedAt)); } catch (e) { date = data.checkedAt; }
    var site = q("[data-wc-site]");
    site.textContent = data.finalUrl || data.url;
    site.setAttribute("title", data.finalUrl || data.url);
    q("[data-wc-when]").textContent = t.when(date) + (data.cached ? " · " + t.cached : "");

    var overall = q('[data-wc-block="overall"]');
    var has = data.overall.score !== null && data.overall.score !== undefined;
    setRing(overall, has ? data.overall.score : null, animate);
    q("[data-wc-band]", overall).textContent = has ? (data.overall.bandLabel || t.band[band(data.overall.score)]) : t.notChecked;
    q("[data-wc-of]", overall).textContent = has ? t.overallOf(data.overall.blocksUsed.length) : t.overallNone;
    q("[data-wc-sr]", overall).textContent = has ? t.of100(data.overall.score) + ". " : "";

    for (var i = 0; i < BLOCKS.length; i++) {
      var id = BLOCKS[i];
      var b = data.blocks[id];
      var card = q('[data-wc-block="' + id + '"]');
      if (!b || !card) continue;
      var scored = b.checked && b.score !== null && b.score !== undefined;
      setRing(card, scored ? b.score : null, animate);
      q("[data-wc-bandword]", card).textContent = scored ? (b.bandLabel || t.band[band(b.score)]) : b.notApplicable ? ((data.statusLabels && data.statusLabels.na) || t.status.na) : t.notChecked;
      q("[data-wc-sr]", card).textContent = scored ? ", " + t.of100(b.score) + "." : ".";
      q("[data-wc-verdict]", card).textContent = b.checked ? (b.verdict || "") : (b.reason || t.notChecked);
      // how many checks ended in which state
      var chips = [];
      var counts = b.counts || {};
      for (var k = 0; k < ORDER.length; k++) {
        var st = ORDER[k];
        if (!counts[st]) continue;
        var li = el("li", "wc-chip");
        li.setAttribute("data-status", st);
        var dot = el("span", "wc-chip__dot");
        dot.setAttribute("aria-hidden", "true");
        li.appendChild(dot);
        li.appendChild(el("b", "", String(counts[st])));
        li.appendChild(doc.createTextNode(" " + ((data.statusLabels && data.statusLabels[st]) || t.status[st])));
        chips.push(li);
      }
      var list = q("[data-wc-chips]", card);
      fill(list, chips);
      show(list, chips.length > 0);
      // every check: state (mark and word), label, measured value, points
      var rows = [];
      var items = b.items || [];
      for (var n = 0; n < items.length; n++) {
        var it = items[n];
        var row = el("li", "wc-item");
        row.setAttribute("data-status", it.status);
        var mark = el("span", "wc-item__mark");
        var sym = el("span", "wc-item__sym", MARK[it.status] || "");
        sym.setAttribute("aria-hidden", "true");
        mark.appendChild(sym);
        mark.appendChild(doc.createTextNode(it.statusLabel || t.status[it.status] || ""));
        row.appendChild(mark);
        var body = el("div", "wc-item__body");
        body.appendChild(el("p", "wc-item__label", it.label));
        body.appendChild(el("p", "wc-item__detail", it.detail));
        row.appendChild(body);
        var counted = it.max > 0 && it.status !== "unknown" && it.status !== "na";
        var pts = el("span", "wc-item__pts");
        var short = el("span", "", counted ? String(it.points).replace(".", lg === "en" ? "." : ",") + " / " + it.max : it.max > 0 ? "– / " + it.max : "–");
        short.setAttribute("aria-hidden", "true");
        pts.appendChild(short);
        pts.appendChild(el("span", "rx-visually-hidden", it.pointsLabel || t.noPoints));
        row.appendChild(pts);
        rows.push(row);
      }
      var box = q("[data-wc-checks]", card);
      fill(q("[data-wc-items]", box), rows);
      q("[data-wc-checks-label]", box).textContent = t.checks(rows.length);
      show(box, rows.length > 0);
      var blockNote = q("[data-wc-blocknote]", card);
      if (blockNote) { if (b.note) blockNote.textContent = b.note; show(blockNote, !!b.checked); }
      var rank = q("[data-wc-ranking]", card);
      if (rank) { rank.textContent = (b.ranking && b.ranking.text) || ""; show(rank, !!(b.ranking && b.ranking.text)); }
      show(q("[data-wc-main]", card), rows.length > 0 || (id === "tempo" && !!b.methodLabel));
      if (id !== "tempo") continue;
      // the speed card: the method, Lighthouse's four category scores and lab values (only when Lighthouse ran), the note
      var speed = q("[data-wc-speed]", card);
      q("[data-wc-method]", speed).textContent = b.methodLabel || "";
      var lh = q("[data-wc-lh]", speed);
      fill(lh, []);
      if (b.method === "lighthouse" && b.lighthouse) {
        var keys = ["performance", "accessibility", "bestPractices", "seo"];
        for (var x = 0; x < keys.length; x++) {
          var v = b.lighthouse[keys[x]];
          pair(lh, t.lh[keys[x]], v === null || v === undefined ? "–" : String(v));
        }
      }
      show(lh, lh.childNodes.length > 0);
      var mx = q("[data-wc-metrics]", speed);
      fill(mx, []);
      var mt = b.method === "lighthouse" ? b.metrics : null;
      if (mt) {
        if (mt.lcp) pair(mx, "LCP", mt.lcp);
        if (mt.cls) pair(mx, "CLS", mt.cls);
        if (mt.tbt) pair(mx, "TBT", mt.tbt);
      }
      show(mx, mx.childNodes.length > 0);
      var note = q("[data-wc-note]", speed);
      note.textContent = b.note || "";
      show(note, !!b.note);
      show(speed, !!b.methodLabel);
    }

    var extras = [];
    if (data.pages && data.pages.length) extras.push(t.pages(data.pages));
    if (data.truncated) extras.push(t.truncated);
    var pages = q("[data-wc-pages]");
    pages.textContent = extras.join(" ");
    show(pages, extras.length > 0);

    var ps = [];
    var sentences = (data.summary && data.summary.sentences) || [];
    for (var s = 0; s < sentences.length; s++) ps.push(el("p", "", sentences[s]));
    fill(q("[data-wc-summary]"), ps);
    var ai = q("[data-wc-ai]");
    var byModel = !!(data.summary && data.summary.source === "model");
    ai.textContent = byModel ? t.ai : "";
    show(ai, byModel);

    var offer = q("[data-wc-offer]");
    var o = t.offer[data.offer] || t.offer.design;
    var od = S.de.offer[data.offer] || S.de.offer.design;
    var oe = S.en.offer[data.offer] || S.en.offer.design;
    offer.setAttribute("href", o[1]);
    var span = offer.firstElementChild;
    if (span) { span.setAttribute("data-de", od[0]); span.setAttribute("data-en", oe[0]); span.textContent = o[0]; }
    setMail(state.mailState === "idle" ? "ready" : state.mailState);
  }
  /* report box: idle (no result yet) → ready → sending → confirm (confirmation mail sent) | sent | bad | fail */
  function setMail(name, message) {
    var t = L();
    state.mailState = name;
    var done = name === "confirm" || name === "sent";
    mail.setAttribute("data-state", name);
    show(mailAsk, !done);
    show(mailDone, done);
    if (done) {
      q("[data-wc-mail-done-h]", mailDone).textContent = name === "confirm" ? t.confirmH : t.sentH;
      q("[data-wc-mail-done-p]", mailDone).textContent = name === "confirm" ? t.confirmP(state.mailTo, state.mailHours) : t.sentP(state.mailTo);
    }
    mailStatus.setAttribute("data-state", name);
    mailStatus.textContent = name === "sending" ? t.mailSending : name === "bad" ? t.mailBad : name === "fail" ? (message || t.mailFail) : "";
    mailSubmit.disabled = name === "idle" || name === "sending";
  }
  function showError(message, field) {
    errorBox.textContent = message;
    if (field) field.setAttribute("aria-invalid", "true");
    try { urlInput.focus(); } catch (e) { /* nothing */ }
  }
  function clearError() {
    errorBox.textContent = "";
    urlInput.removeAttribute("aria-invalid");
  }
  function setTitle(key) {
    var span = title.firstElementChild || title;
    span.setAttribute("data-de", S.de[key]);
    span.setAttribute("data-en", S.en[key]);
    span.textContent = L()[key];
  }

  // ---------------------------------------------------------------- running state
  function progress(start) {
    var n = (Date.now() - start) / 1000;
    var i = 0;
    for (var k = 0; k < STEP_AT.length; k++) if (n >= STEP_AT[k]) i = k;
    if (i === state.step) return;
    state.step = i;
    var steps = runBox.querySelectorAll("[data-wc-step]");
    for (var s = 0; s < steps.length; s++) steps[s].setAttribute("data-state", s < i ? "done" : s === i ? "active" : "todo");
    statusText.textContent = L().steps[i]; // announced once per step, five times at most
  }
  function toRunning(input) {
    show(areas, false);
    show(outBox, false);
    show(runBox, true);
    show(report, true);
    report.classList.add("is-busy");
    setTitle("running");
    q("[data-wc-site]").textContent = input.url;
    q("[data-wc-when]").textContent = L().wait;
    state.step = -1;
  }
  function toIdle() {
    report.classList.remove("is-busy");
    show(report, false);
    show(areas, true);
    statusText.textContent = "";
  }
  function busy(on) {
    state.busy = on;
    if (on) submit.setAttribute("aria-disabled", "true"); else submit.removeAttribute("aria-disabled");
    if (!on && state.timer) { clearInterval(state.timer); state.timer = null; }
  }
  function run(input, quiet) {
    if (state.busy) return;
    clearError();
    busy(true);
    state.lastInput = input;
    var started = false;
    function begin() {
      if (quiet || started) return;
      started = true;
      state.last = null;
      state.mailState = "idle";
      toRunning(input);
      var start = Date.now();
      progress(start);
      state.timer = setInterval(function () { progress(start); }, 400);
      // the card is in view before the first paint after the click; the field keeps the focus until the result is there
      var top = report.getBoundingClientRect().top;
      if (top < 0 || top > 120) report.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    // With a token or a pass at hand (the usual case: the widget was loaded when the field got the focus) the
    // report card appears in the same task as the click. Otherwise the form says that the security check is
    // running; the widget, if it asks for anything, sits right under the field.
    var ready = !bot.on || bot.token || state.noCheck || (state.pass && state.passUntil > Date.now() + 5000);
    if (ready) begin();
    else if (!quiet) { form.setAttribute("data-wc-wait", ""); statusText.textContent = bot.asking ? L().botAsk : L().botWait; }
    var body = { url: input.url, trade: input.trade, town: input.town, lang: lang() };
    // the proof is fetched first (a pass, a token that is waiting, or a new one), then the check starts
    proof(false).then(function (p) {
      form.removeAttribute("data-wc-wait");
      if (!p) return { status: 403, data: { ok: false, error: "bot_check", message: L().botFail } };
      begin();
      if (p.turnstileToken) { bot.token = p.turnstileToken; bot.stale = false; } // hand it back: send() takes it
      return send(body, 100000);
    }).then(function (r) {
      busy(false);
      if (r.data && r.data.ok) {
        state.last = r.data;
        if (!quiet) {
          show(runBox, false);
          show(outBox, true);
          report.classList.remove("is-busy");
          setTitle("resultFor");
        }
        render(r.data, !quiet);
        if (!quiet) {
          try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
          var top = report.getBoundingClientRect().top;
          if (top < -40 || top > window.innerHeight * 0.5) report.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
        statusText.textContent = L().done(r.data.host, r.data.overall.score);
        return;
      }
      if (quiet) return;
      state.last = null;
      toIdle();
      var code = r.data && r.data.error;
      var fieldError = code === "bad_url" || code === "bad_scheme" || code === "bad_port" || code === "private_host" || code === "dns";
      showError((r.data && r.data.message) || L().network, fieldError ? urlInput : null);
    }, function (e) {
      form.removeAttribute("data-wc-wait");
      busy(false);
      if (quiet) return;
      state.last = null;
      toIdle();
      showError(e && e.name === "AbortError" ? L().timeout : L().network, null);
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.busy) return;
    addCss();
    var url = urlInput.value.trim();
    if (!url) { showError(L().empty, urlInput); return; }
    if (form.elements.company_website && form.elements.company_website.value) return;
    run({ url: url, trade: (form.elements.trade.value || "").trim(), town: (form.elements.town.value || "").trim() }, false);
  });
  urlInput.addEventListener("input", function () { if (errorBox.textContent) clearError(); });
  var again = q("[data-wc-again]");
  if (again) again.addEventListener("click", function () {
    urlInput.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    try { urlInput.focus({ preventScroll: true }); urlInput.select(); } catch (e) { urlInput.focus(); }
  });

  // ---------------------------------------------------------------- report by e-mail (double opt-in)
  mail.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!state.last || state.mailState === "sending") return;
    var email = (emailInput.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMail("bad");
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return;
    }
    emailInput.removeAttribute("aria-invalid");
    setMail("sending");
    send({ url: state.last.url, email: email, lang: lang(), company_website: mail.elements.company_website.value }, 60000).then(function (r) {
      if (r.data && r.data.ok) {
        state.mailTo = email;
        state.mailHours = r.data.expiresInHours || 48;
        setMail(r.data.status === "confirmation_sent" ? "confirm" : "sent");
        try { mailDone.focus({ preventScroll: true }); } catch (e2) { mailDone.focus(); }
        return;
      }
      setMail("fail", r.data && r.data.message);
      if (r.data && r.data.error === "email") { emailInput.setAttribute("aria-invalid", "true"); emailInput.focus(); }
    }, function () { setMail("fail"); });
  });
  emailInput.addEventListener("input", function () {
    emailInput.removeAttribute("aria-invalid");
    if (state.mailState === "bad" || state.mailState === "fail") setMail(state.last ? "ready" : "idle");
  });
  var mailReset = q("[data-wc-mail-reset]");
  if (mailReset) mailReset.addEventListener("click", function () {
    setMail(state.last ? "ready" : "idle");
    try { emailInput.focus(); emailInput.select(); } catch (e) { /* nothing */ }
  });

  // ---------------------------------------------------------------- language switch: same result in the other language
  window.addEventListener("rexity:languagechange", function () {
    // the widget speaks the page's language: render it again (not while a request is waiting for its token)
    if (bot.on && bot.id !== null && window.turnstile && !bot.waiters.length) {
      try { window.turnstile.remove(bot.id); } catch (e) { /* nothing */ }
      bot.id = null;
      bot.token = null;
      bot.stale = false;
      botRender();
    }
    if (state.busy) {
      if (state.step >= 0) statusText.textContent = L().steps[state.step];
      q("[data-wc-when]").textContent = L().wait;
      return;
    }
    if (state.last && state.lastInput) {
      var keep = state.mailState;
      render(state.last, false); // labels that live in this file switch at once …
      setMail(keep);
      run(state.lastInput, true); // … the report's own texts come from the function (24-hour cache, no new check)
    }
  });
})();
