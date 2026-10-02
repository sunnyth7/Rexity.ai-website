/* website-check.js — Sprint 27 / 27b, /website-check only (loaded with defer by scripts/pages/30-services.mjs).
   Drives the tool rendered by scripts/pages/lib-services/check-tool.mjs: the address form in the hero, the report
   card below it. Sends the address to /api/check, shows a calm step list while the check runs, then fills the
   report: overall ring, Kurzfazit, "Was jetzt am meisten bringt", four area cards with every check open, and the
   report-by-mail form. No data is stored in the browser.

   Layout: the report card is shown in the same task as the visitor's click and keeps one screen of height while
   the check runs (website-check.css, .is-busy); the result then fills space below the fold.

   Accessibility: one polite live region announces the step that is running and the finished result; errors are
   announced (role="alert") and focus goes to the field; when a result arrives, focus moves to the report heading.
   Every check carries a mark and a word for its state (never colour alone). Reduced motion: no pulse, no ring
   transition, no smooth scroll (website-check.css, and the check below).

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
  var mailSubmit = q("[data-wc-mail-submit]");
  var mailStatus = q("[data-wc-mail-status]");
  var title = q("[data-wc-title]");
  var urlInput = doc.getElementById("wc-url");
  var emailInput = doc.getElementById("wc-email");
  if (!report || !mail || !urlInput || !emailInput) return;
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
  form.addEventListener("focusin", addCss);
  form.addEventListener("pointerdown", addCss);
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var S = {
    de: {
      steps: ["Die Seite wird abgerufen.", "Die Kontaktwege werden geprüft, auch auf verlinkten Kontakt- und Buchungsseiten.", "Auffindbarkeit und Pflichtseiten werden geprüft.", "Das Tempo wird gemessen. Das dauert am längsten, bis zu etwa einer Minute.", "Das Ergebnis wird zusammengestellt."],
      running: "Die Prüfung läuft",
      resultFor: "Ihr Ergebnis",
      checking: function (u) { return u; },
      done: function (host, score) { return "Prüfung abgeschlossen: " + host + (score === null ? " – kein Gesamtwert, weil kein Bereich geprüft werden konnte." : " erreicht insgesamt " + score + " von 100 Punkten."); },
      cached: "Ergebnis der letzten 24 Stunden",
      empty: "Bitte geben Sie die Adresse Ihrer Website ein.",
      network: "Die Prüfung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      timeout: "Die Prüfung hat zu lange gedauert. Bitte versuchen Sie es in ein paar Minuten erneut.",
      notChecked: "nicht prüfbar",
      when: function (date) { return "geprüft am " + date; },
      wait: "Bitte einen Moment Geduld",
      metrics: "Laborwerte von Lighthouse: ",
      band: { good: "gut", mid: "mittel", low: "schwach" },
      of100: function (n) { return n + " von 100"; },
      overallOf: function (n) { return n === 4 ? "von 100 Punkten, aus allen vier Bereichen" : "von 100 Punkten, aus " + n + " von vier Bereichen"; },
      overallNone: "Kein Gesamtwert: Kein Bereich ließ sich prüfen.",
      status: { ok: "erfüllt", partial: "teilweise", fail: "offen", info: "Hinweis", unknown: "nicht prüfbar", na: "entfällt" },
      pts: function (p, m) { return p + " von " + m; },
      ptsNone: "ohne Punkte",
      pages: function (list) { return "Mitgeprüfte Seiten: " + list.join(", "); },
      rankIn: function (qy, p) { return "Platz " + p + " bei Google für „" + qy + "“ (Deutschland)"; },
      rankOut: function (qy) { return "Für „" + qy + "“ nicht in den ersten 20 Ergebnissen bei Google (Deutschland)"; },
      rankFail: function (qy) { return "Platz bei Google für „" + qy + "“: nicht prüfbar"; },
      rankOff: "Die Platz-Abfrage bei Google ist derzeit nicht verfügbar.",
      rankLabel: "Platz bei Google",
      truncated: "Die Seite ist sehr groß; ausgewertet wurden die ersten 1,5 MB.",
      noFix: "In den geprüften Punkten haben wir nichts gefunden, das Sie dringend ändern müssten.",
      ai: "Kurzfazit von einer KI aus den Messwerten dieses Ergebnisses formuliert.",
      mailReady: "Der Bericht ist bereit zum Versand.",
      mailSending: "Der Bericht wird gesendet …",
      mailSent: "Gesendet. Der Bericht ist unterwegs an Ihre Adresse.",
      mailBad: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      mailFail: "Der Bericht konnte gerade nicht versendet werden. Bitte schreiben Sie uns an info@rexity.ai.",
      offer: {
        design: ["Webdesign: Websites, die Anfragen bringen", "/web/web-design"],
        relaunch: ["Website-Relaunch: neue Technik, gleiche Adresse", "/web/website-umzug"],
        care: ["Website-Wartung: damit die Werte so bleiben", "/website-wartung"]
      }
    },
    en: {
      steps: ["Fetching the page.", "Checking the ways to get in touch, also on linked contact and booking pages.", "Checking findability and mandatory pages.", "Measuring speed. This takes longest, up to about a minute.", "Putting the result together."],
      running: "The check is running",
      resultFor: "Your result",
      checking: function (u) { return u; },
      done: function (host, score) { return "Check finished: " + host + (score === null ? " – no overall value because no area could be checked." : " reaches " + score + " out of 100 points overall."); },
      cached: "result from the last 24 hours",
      empty: "Please enter the address of your website.",
      network: "The check failed. Please check your internet connection and try again.",
      timeout: "The check took too long. Please try again in a few minutes.",
      notChecked: "could not be checked",
      when: function (date) { return "checked on " + date; },
      wait: "One moment, please",
      metrics: "Lighthouse lab values: ",
      band: { good: "good", mid: "medium", low: "weak" },
      of100: function (n) { return n + " out of 100"; },
      overallOf: function (n) { return n === 4 ? "out of 100 points, from all four areas" : "out of 100 points, from " + n + " of four areas"; },
      overallNone: "No overall value: no area could be checked.",
      status: { ok: "met", partial: "partly", fail: "open", info: "note", unknown: "could not be checked", na: "does not apply" },
      pts: function (p, m) { return p + " of " + m; },
      ptsNone: "no points",
      pages: function (list) { return "Pages read as well: " + list.join(", "); },
      rankIn: function (qy, p) { return "Position " + p + " on Google for “" + qy + "” (Germany)"; },
      rankOut: function (qy) { return "Not in the first 20 results on Google for “" + qy + "” (Germany)"; },
      rankFail: function (qy) { return "Position on Google for “" + qy + "”: could not be checked"; },
      rankOff: "The Google position lookup is not available at the moment.",
      rankLabel: "Position on Google",
      truncated: "The page is very large; the first 1.5 MB were evaluated.",
      noFix: "In the points we checked we found nothing that you urgently need to change.",
      ai: "Short verdict worded by an AI from the measurements of this result.",
      mailReady: "The report is ready to send.",
      mailSending: "Sending the report …",
      mailSent: "Sent. The report is on its way to your address.",
      mailBad: "Please enter a valid e-mail address.",
      mailFail: "The report could not be sent just now. Please write to info@rexity.ai.",
      offer: {
        design: ["Web design: websites that bring enquiries", "/web/web-design"],
        relaunch: ["Website relaunch: new technology, same address", "/web/website-umzug"],
        care: ["Website maintenance: so the values stay this way", "/website-wartung"]
      }
    }
  };
  var MARK = { ok: "✓", partial: "~", fail: "✕", info: "i", unknown: "?", na: "–" };
  var BLOCKS = ["tempo", "find", "contact", "trust"];
  var STEP_AT = [0, 1.2, 2.6, 4.2, 48]; // seconds at which each step becomes the active one

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
  function num(n, lg) { return lg === "de" ? String(n).replace(".", ",") : String(n); }

  var state = { busy: false, last: null, lastInput: null, timer: null, mailState: "idle", step: -1 };

  // ---------------------------------------------------------------- render
  function band(score) { return score >= 80 ? "good" : score >= 50 ? "mid" : "low"; }
  function setRing(card, score) {
    var n = q("[data-wc-score]", card);
    var arc = q("[data-wc-arc]", card);
    if (score === null || score === undefined) {
      n.textContent = "–";
      arc.setAttribute("stroke-dasharray", "0 100");
      card.removeAttribute("data-band");
      return;
    }
    n.textContent = String(score);
    arc.setAttribute("stroke-dasharray", Math.max(0, Math.min(100, score)) + " 100");
    card.setAttribute("data-band", band(score));
  }
  function itemNode(it) {
    var t = L();
    var li = el("li", "wc-item");
    li.setAttribute("data-status", it.status);
    var mark = el("span", "wc-item__mark", MARK[it.status] || "");
    mark.setAttribute("aria-hidden", "true");
    var label = el("p", "wc-item__label", it.label + " ");
    label.appendChild(el("span", "wc-item__state", t.status[it.status] || ""));
    li.appendChild(mark);
    li.appendChild(label);
    if (it.detail) li.appendChild(el("p", "wc-item__detail", it.detail));
    if (it.max > 0 && it.status !== "unknown" && it.status !== "na") li.appendChild(el("p", "wc-item__pts", t.pts(num(it.points, lang()), it.max)));
    else if (it.status === "info") li.appendChild(el("p", "wc-item__pts", t.ptsNone));
    return li;
  }
  function render(data) {
    var t = L();
    var lg = lang();
    var date = "";
    try { date = new Intl.DateTimeFormat(lg === "en" ? "en-GB" : "de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.checkedAt)); } catch (e) { date = data.checkedAt; }
    var site = q("[data-wc-site]");
    site.textContent = data.finalUrl || data.url;
    site.setAttribute("title", data.finalUrl || data.url);
    q("[data-wc-when]").textContent = t.when(date);

    var overall = q('[data-wc-block="overall"]');
    setRing(overall, data.overall.score);
    var has = data.overall.score !== null && data.overall.score !== undefined;
    q("[data-wc-band]", overall).textContent = has ? t.band[band(data.overall.score)] : t.notChecked;
    q("[data-wc-of]", overall).textContent = (has ? t.overallOf(data.overall.blocksUsed.length) : t.overallNone) + (data.cached ? " · " + t.cached : "");
    q("[data-wc-sr]", overall).textContent = has ? t.of100(data.overall.score) + ". " : "";

    for (var i = 0; i < BLOCKS.length; i++) {
      var id = BLOCKS[i];
      var b = data.blocks[id];
      var card = q('[data-wc-block="' + id + '"]');
      setRing(card, b.score);
      var scored = b.score !== null && b.score !== undefined;
      q("[data-wc-sr]", card).textContent = scored ? t.of100(b.score) + ", " + t.band[band(b.score)] + ". " : t.notChecked + ". ";
      q("[data-wc-verdict]", card).textContent = b.checked ? (b.verdict || "") : (b.reason || t.notChecked);
      var method = q("[data-wc-method]", card);
      method.textContent = b.methodLabel || "";
      show(method, !!b.methodLabel);
      var nodes = [];
      if (id === "find") {
        if (b.ranking) {
          var r = b.ranking;
          nodes.push(itemNode({ status: "info", label: t.rankLabel, detail: !r.checked ? t.rankFail(r.query) : r.position ? t.rankIn(r.query, r.position) : t.rankOut(r.query), max: 0 }));
        } else if (b.checked && state.lastInput && state.lastInput.trade && state.lastInput.town) {
          nodes.push(itemNode({ status: "unknown", label: t.rankLabel, detail: t.rankOff, max: 0 }));
        }
      }
      for (var k = 0; k < b.items.length; k++) nodes.push(itemNode(b.items[k]));
      if (!nodes.length) nodes.push(el("li", "wc-item--none", b.reason || t.notChecked));
      fill(q("[data-wc-items]", card), nodes);
      // above the list: the method's note (for the own measurement: that it does not replace a Lighthouse run)
      var note = q("[data-wc-note]", card);
      note.textContent = b.note || "";
      show(note, !!b.note);
      // under the list: Lighthouse lab values (only when Lighthouse ran), the pages read as well
      var extras = [];
      var mt = b.metrics || null;
      if (mt && (mt.lcp || mt.cls || mt.tbt)) {
        var parts = [];
        if (mt.lcp) parts.push("LCP " + mt.lcp);
        if (mt.cls) parts.push("CLS " + mt.cls);
        if (mt.tbt) parts.push("TBT " + mt.tbt);
        extras.push(t.metrics + parts.join(" · ") + ".");
      }
      if (b.pages && b.pages.length) extras.push(t.pages(b.pages) + ".");
      if (id === "trust" && data.truncated) extras.push(t.truncated);
      var extra = q("[data-wc-extra]", card);
      extra.textContent = extras.join(" ");
      show(extra, extras.length > 0);
    }

    var ps = [];
    var sentences = (data.summary && data.summary.sentences) || [];
    for (var s = 0; s < sentences.length; s++) ps.push(el("p", "", sentences[s]));
    fill(q("[data-wc-summary]"), ps);
    var ai = q("[data-wc-ai]");
    var byModel = !!(data.summary && data.summary.source === "model");
    ai.textContent = byModel ? t.ai : "";
    show(ai, byModel);

    var fixes = data.fixes && data.fixes.length ? data.fixes : (data.firstFix ? [data.firstFix] : []);
    var lis = [];
    for (var f = 0; f < fixes.length; f++) lis.push(el("li", "", fixes[f]));
    if (!lis.length) lis.push(el("li", "wc-fixes__none", t.noFix));
    fill(q("[data-wc-fixes]"), lis);

    var offer = q("[data-wc-offer]");
    var o = t.offer[data.offer] || t.offer.design;
    var od = S.de.offer[data.offer] || S.de.offer.design;
    var oe = S.en.offer[data.offer] || S.en.offer.design;
    offer.setAttribute("href", o[1]);
    var span = offer.firstElementChild;
    if (span) { span.setAttribute("data-de", od[0]); span.setAttribute("data-en", oe[0]); span.textContent = o[0]; }
    setMail(state.mailState === "idle" ? "ready" : state.mailState);
  }
  function setMail(name) {
    var t = L();
    state.mailState = name;
    mailStatus.setAttribute("data-state", name === "idle" || name === "ready" ? "idle" : name);
    mailStatus.textContent = name === "idle" ? "" : name === "ready" ? t.mailReady : name === "sending" ? t.mailSending : name === "sent" ? t.mailSent : name === "bad" ? t.mailBad : t.mailFail;
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
    q("[data-wc-site]").textContent = L().checking(input.url);
    q("[data-wc-when]").textContent = L().wait;
    state.step = -1;
  }
  function toIdle() {
    report.classList.remove("is-busy");
    show(report, false);
    show(areas, true);
    statusText.textContent = "";
  }
  function post(body, timeoutMs) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
    return fetch("/api/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
      .then(function (resp) { return resp.json().catch(function () { return null; }).then(function (data) { return { status: resp.status, data: data }; }); })
      .then(function (r) { if (timer) clearTimeout(timer); return r; }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }
  function run(input, quiet) {
    if (state.busy) return;
    clearError();
    state.busy = true;
    state.lastInput = input;
    submit.setAttribute("aria-disabled", "true");
    if (!quiet) {
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
    post({ url: input.url, trade: input.trade, town: input.town, lang: lang() }, 100000).then(function (r) {
      finish();
      if (r.data && r.data.ok) {
        state.last = r.data;
        render(r.data);
        if (!quiet) {
          show(runBox, false);
          show(outBox, true);
          report.classList.remove("is-busy");
          setTitle("resultFor");
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
      finish();
      if (quiet) return;
      state.last = null;
      toIdle();
      showError(e && e.name === "AbortError" ? L().timeout : L().network, null);
    });
  }
  function finish() {
    state.busy = false;
    submit.removeAttribute("aria-disabled");
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
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

  // ---------------------------------------------------------------- report by e-mail
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
    post({ url: state.last.url, email: email, lang: lang(), company_website: mail.elements.company_website.value }, 100000).then(function (r) {
      if (r.data && r.data.ok) { setMail("sent"); return; }
      setMail("fail");
      if (r.data && r.data.message) mailStatus.textContent = r.data.message;
      if (r.data && r.data.error === "email") { emailInput.setAttribute("aria-invalid", "true"); emailInput.focus(); }
    }, function () { setMail("fail"); });
  });
  emailInput.addEventListener("input", function () { emailInput.removeAttribute("aria-invalid"); if (state.mailState === "bad" || state.mailState === "fail" || state.mailState === "sent") setMail(state.last ? "ready" : "idle"); });

  // ---------------------------------------------------------------- language switch: same result in the other language
  window.addEventListener("rexity:languagechange", function () {
    if (state.busy) {
      if (state.step >= 0) statusText.textContent = L().steps[state.step];
      q("[data-wc-when]").textContent = L().wait;
      return;
    }
    if (state.last && state.lastInput) {
      var keep = state.mailState;
      render(state.last); // labels that live in this file switch at once …
      state.mailState = keep;
      setMail(keep);
      run(state.lastInput, true); // … the report's own texts come from the function (24-hour cache, no new check)
    }
  });
})();
