/* website-check.js — Sprint 27, /website-check only (loaded with defer by scripts/pages/30-services.mjs).
   Drives the tool rendered by scripts/pages/lib-services/check-tool.mjs: sends the address to /api/check,
   shows progress in one status line, fills the result frame that is already in the HTML (nothing below the
   tool moves), sends the report by e-mail on request. No data is stored in the browser.

   Accessibility: the status line is a polite live region; errors are announced (role="alert") and focus goes
   to the field; when a result arrives, focus moves to the result heading. Reduced motion: no spinner turn,
   no smooth scroll (website-check.css, and the check below). */
(function () {
  "use strict";
  var doc = document;
  var root = doc.querySelector("[data-wc]");
  if (!root || !window.fetch) return;
  var q = function (sel, el) { return (el || root).querySelector(sel); };
  var form = q("[data-wc-form]");
  var mail = q("[data-wc-mail]");
  var statusText = q("[data-wc-status-text]");
  var errorBox = q("[data-wc-error]");
  var submit = q("[data-wc-submit]");
  var mailSubmit = q("[data-wc-mail-submit]");
  var mailStatus = q("[data-wc-mail-status]");
  var title = q("[data-wc-title]");
  var urlInput = doc.getElementById("wc-url");
  var emailInput = doc.getElementById("wc-email");
  if (!form || !mail || !urlInput) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var S = {
    de: {
      idle: "Noch nicht geprüft. Geben Sie oben die Adresse ein.",
      steps: [
        "Die Seite wird abgerufen …",
        "Das Tempo wird auf einem simulierten Handy gemessen. Das dauert am längsten …",
        "Auffindbarkeit, Anfrage-Wege und Pflichtseiten werden geprüft …",
        "Die Messung läuft noch. Bis zu etwa einer Minute ist normal …",
        "Gleich fertig: Das Kurzfazit wird geschrieben …"
      ],
      seconds: function (n) { return " (seit " + n + " Sekunden)"; },
      done: function (host, score) { return "Prüfung abgeschlossen: " + host + (score === null ? " – kein Gesamtwert, weil kein Bereich geprüft werden konnte." : " erreicht insgesamt " + score + " von 100 Punkten."); },
      cached: " Ergebnis der letzten 24 Stunden.",
      empty: "Bitte geben Sie die Adresse Ihrer Website ein.",
      network: "Die Prüfung ist fehlgeschlagen. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.",
      timeout: "Die Prüfung hat zu lange gedauert. Bitte versuchen Sie es in ein paar Minuten erneut.",
      notChecked: "nicht prüfbar",
      site: function (host, date) { return host + ", geprüft am " + date; },
      metrics: "Laborwerte: ",
      metricsNone: "Laborwerte: LCP –, CLS –, TBT –",
      band: { good: "gut", mid: "mittel", low: "schwach" },
      status: { ok: "erfüllt", partial: "teilweise", fail: "offen", info: "Hinweis", unknown: "nicht prüfbar" },
      rankIn: function (qy, p) { return "Platz " + p + " bei Google für „" + qy + "“ (Deutschland)"; },
      rankOut: function (qy) { return "Für „" + qy + "“ nicht in den ersten 20 Ergebnissen bei Google (Deutschland)"; },
      rankFail: function (qy) { return "Platz bei Google für „" + qy + "“: nicht prüfbar"; },
      rankOff: "Die Platz-Abfrage bei Google ist derzeit nicht verfügbar.",
      rankLabel: "Platz bei Google (Hinweis)",
      truncated: "Die Seite ist sehr groß; ausgewertet wurden die ersten 1,5 MB.",
      summaryPh: "Nach der Prüfung steht hier in fünf Sätzen, was an Ihrer Seite auffällt.",
      fixPh: "Hier steht der Schritt, der Ihrer Seite nach unserer Regel am meisten bringt.",
      noFix: "In den geprüften Punkten haben wir nichts gefunden, das Sie dringend ändern müssten.",
      more: function (n) { return n === 1 ? "Ein weiterer Schritt steht im Bericht per E-Mail." : n + " weitere Schritte stehen im Bericht per E-Mail."; },
      ai: "Kurzfazit von einer KI aus den Messwerten oben formuliert.",
      itemsNone: "Die Befunde erscheinen nach der Prüfung.",
      mailIdle: "Der Bericht lässt sich senden, sobald ein Ergebnis da ist.",
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
      idle: "Not checked yet. Enter the address above.",
      steps: [
        "Fetching the page …",
        "Measuring speed on a simulated phone. This takes longest …",
        "Checking findability, ways to enquire and mandatory pages …",
        "The measurement is still running. Up to about a minute is normal …",
        "Almost done: writing the short verdict …"
      ],
      seconds: function (n) { return " (" + n + " seconds so far)"; },
      done: function (host, score) { return "Check finished: " + host + (score === null ? " – no overall value because no area could be checked." : " reaches " + score + " out of 100 points overall."); },
      cached: " Result from the last 24 hours.",
      empty: "Please enter the address of your website.",
      network: "The check failed. Please check your internet connection and try again.",
      timeout: "The check took too long. Please try again in a few minutes.",
      notChecked: "could not be checked",
      site: function (host, date) { return host + ", checked on " + date; },
      metrics: "Lab values: ",
      metricsNone: "Lab values: LCP –, CLS –, TBT –",
      band: { good: "good", mid: "medium", low: "weak" },
      status: { ok: "met", partial: "partly", fail: "open", info: "note", unknown: "could not be checked" },
      rankIn: function (qy, p) { return "Position " + p + " on Google for “" + qy + "” (Germany)"; },
      rankOut: function (qy) { return "Not in the first 20 results on Google for “" + qy + "” (Germany)"; },
      rankFail: function (qy) { return "Position on Google for “" + qy + "”: could not be checked"; },
      rankOff: "The Google position lookup is not available at the moment.",
      rankLabel: "Position on Google (note)",
      truncated: "The page is very large; the first 1.5 MB were evaluated.",
      summaryPh: "After the check, five sentences here tell you what stands out on your page.",
      fixPh: "This is where the step appears that, by our rule, helps your page most.",
      noFix: "In the points we checked we found nothing that you urgently need to change.",
      more: function (n) { return n === 1 ? "One more step is in the report by e-mail." : n + " more steps are in the report by e-mail."; },
      ai: "Short verdict worded by an AI from the measurements above.",
      itemsNone: "The findings appear after the check.",
      mailIdle: "The report can be sent as soon as there is a result.",
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
  var MARK = { ok: "✓", partial: "~", fail: "✗", info: "i", unknown: "?" };
  var BLOCKS = ["tempo", "find", "contact", "trust"];

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
  function setState(name) {
    root.classList.toggle("is-busy", name === "busy");
    root.classList.toggle("is-done", name === "done");
  }

  var state = { busy: false, last: null, lastInput: null, timer: null, mailState: "idle" };

  // ---------------------------------------------------------------- render
  function band(score) { return score >= 80 ? "good" : score >= 50 ? "mid" : "low"; }
  function setScore(card, score, pending) {
    var num = q("[data-wc-score]", card);
    var bar = q("[data-wc-bar]", card);
    num.classList.remove("wc-num--text");
    if (pending) { num.textContent = "…"; bar.style.width = "0"; card.removeAttribute("data-band"); return; }
    if (score === null || score === undefined) {
      num.textContent = state.last ? L().notChecked : "–";
      if (state.last) num.classList.add("wc-num--text");
      bar.style.width = "0";
      card.removeAttribute("data-band");
      return;
    }
    num.textContent = String(score);
    bar.style.width = score + "%";
    card.setAttribute("data-band", band(score));
  }
  function itemNode(it) {
    var li = el("li", "wc-item");
    li.setAttribute("data-status", it.status);
    var mark = el("span", "wc-item__mark", MARK[it.status] || "");
    mark.setAttribute("aria-hidden", "true");
    var label = el("span", "wc-item__label", it.label);
    var sr = el("span", "u-sr", " (" + L().status[it.status] + ")");
    sr.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    label.appendChild(sr);
    li.appendChild(mark);
    li.appendChild(label);
    li.appendChild(el("span", "wc-item__detail", it.detail));
    return li;
  }
  function renderPlaceholders() {
    var t = L();
    if (!state.busy) { statusText.textContent = t.idle; }
    fill(q("[data-wc-summary]"), [el("p", "wc-placeholder", t.summaryPh)]);
    fill(q("[data-wc-fix]"), [el("p", "wc-placeholder", t.fixPh)]);
    q("[data-wc-ai]").textContent = " ";
    q("[data-wc-site]").textContent = " ";
    var cards = root.querySelectorAll("[data-wc-block]");
    for (var i = 0; i < cards.length; i++) {
      setScore(cards[i], null, state.busy);
      var items = q("[data-wc-items]", cards[i]);
      if (items) fill(items, [el("li", "wc-item wc-item--none", t.itemsNone)]);
      var m = q("[data-wc-metrics]", cards[i]);
      if (m) m.textContent = t.metricsNone;
      var d = q("[data-wc-desc]", cards[i]);
      if (d && d.firstElementChild) d.firstElementChild.hidden = false;
      if (d) { var r = q("[data-wc-reason]", d); if (r) d.removeChild(r); }
    }
    setMail("idle");
  }
  function render(data) {
    var t = L();
    var overall = q('[data-wc-block="overall"]');
    setScore(overall, data.overall.score, false);
    var date = "";
    try { date = new Intl.DateTimeFormat(lang() === "en" ? "en-GB" : "de-DE", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.checkedAt)); } catch (e) { date = data.checkedAt; }
    q("[data-wc-site]").textContent = t.site(data.host, date);
    for (var i = 0; i < BLOCKS.length; i++) {
      var id = BLOCKS[i];
      var b = data.blocks[id];
      var card = q('[data-wc-block="' + id + '"]');
      setScore(card, b.score, false);
      var desc = q("[data-wc-desc]", card);
      var old = q("[data-wc-reason]", desc);
      if (old) desc.removeChild(old);
      if (desc.firstElementChild) desc.firstElementChild.hidden = !b.checked;
      if (!b.checked) {
        var reason = el("span", "", b.reason || t.notChecked);
        reason.setAttribute("data-wc-reason", "");
        desc.appendChild(reason);
      }
      var nodes = [];
      if (id === "find") {
        if (b.ranking) {
          var r = b.ranking;
          nodes.push(itemNode({ status: "info", label: t.rankLabel, detail: !r.checked ? t.rankFail(r.query) : r.position ? t.rankIn(r.query, r.position) : t.rankOut(r.query) }));
        } else if (b.checked && state.lastInput && state.lastInput.trade && state.lastInput.town) {
          nodes.push(itemNode({ status: "unknown", label: t.rankLabel, detail: t.rankOff }));
        }
      }
      for (var k = 0; k < b.items.length; k++) nodes.push(itemNode(b.items[k]));
      if (id === "trust" && data.truncated) nodes.push(itemNode({ status: "info", label: t.truncated, detail: "" }));
      if (!nodes.length) nodes.push(el("li", "wc-item wc-item--none", t.notChecked));
      fill(q("[data-wc-items]", card), nodes);
      var m = q("[data-wc-metrics]", card);
      if (m) {
        var mt = b.metrics || {};
        m.textContent = b.checked ? t.metrics + "LCP " + (mt.lcp || "–") + ", CLS " + (mt.cls || "–") + ", TBT " + (mt.tbt || "–") : t.metricsNone;
      }
    }
    var ps = [];
    var sentences = (data.summary && data.summary.sentences) || [];
    for (var s = 0; s < sentences.length; s++) ps.push(el("p", "", sentences[s]));
    fill(q("[data-wc-summary]"), ps.length ? ps : [el("p", "wc-placeholder", t.summaryPh)]);
    q("[data-wc-ai]").textContent = data.summary && data.summary.source === "model" ? t.ai : " ";
    var fix = [el("p", "", data.firstFix || t.noFix)];
    if (data.moreFixes > 0) fix.push(el("p", "wc-more", t.more(data.moreFixes)));
    fill(q("[data-wc-fix]"), fix);
    var offer = q("[data-wc-offer]");
    var o = t.offer[data.offer] || t.offer.design;
    var od = S.de.offer[data.offer] || S.de.offer.design;
    var oe = S.en.offer[data.offer] || S.en.offer.design;
    offer.setAttribute("href", o[1]);
    var span = offer.firstElementChild;
    if (span) { span.setAttribute("data-de", od[0]); span.setAttribute("data-en", oe[0]); span.textContent = o[0]; }
    if (state.mailState === "idle") setMail("ready");
    else setMail(state.mailState);
  }
  function setMail(name) {
    var t = L();
    state.mailState = name;
    mailStatus.setAttribute("data-state", name === "idle" || name === "ready" ? "idle" : name);
    mailStatus.textContent = name === "idle" ? t.mailIdle : name === "ready" ? t.mailReady : name === "sending" ? t.mailSending : name === "sent" ? t.mailSent : name === "bad" ? t.mailBad : t.mailFail;
    mailSubmit.disabled = name === "idle" || name === "sending";
  }
  function showError(message, field) {
    errorBox.textContent = message;
    if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
  }
  function clearError() {
    errorBox.textContent = "";
    urlInput.removeAttribute("aria-invalid");
  }

  // ---------------------------------------------------------------- check
  function progress(start) {
    var t = L();
    var n = Math.round((Date.now() - start) / 1000);
    var i = n < 4 ? 0 : n < 18 ? 1 : n < 30 ? 2 : n < 50 ? 3 : 4;
    // the text changes five times at most; the seconds are appended visually without re-announcing every second
    var msg = t.steps[i];
    if (statusText.getAttribute("data-step") !== String(i) + lang()) {
      statusText.setAttribute("data-step", String(i) + lang());
      statusText.textContent = msg;
    }
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
    var t = L();
    clearError();
    state.busy = true;
    state.lastInput = input;
    submit.disabled = true;
    if (!quiet) {
      state.last = null;
      state.mailState = "idle";
      setState("busy");
      renderPlaceholders();
      var start = Date.now();
      statusText.removeAttribute("data-step");
      progress(start);
      state.timer = setInterval(function () { progress(start); }, 1000);
    }
    post({ url: input.url, trade: input.trade, town: input.town, lang: lang() }, 100000).then(function (r) {
      finish();
      if (r.data && r.data.ok) {
        state.last = r.data;
        setState("done");
        render(r.data);
        statusText.removeAttribute("data-step");
        statusText.textContent = L().done(r.data.host, r.data.overall.score) + (r.data.cached ? L().cached : "");
        if (!quiet && title) {
          try { title.focus({ preventScroll: true }); } catch (e) { title.focus(); }
          var top = title.getBoundingClientRect().top;
          if (top < 0 || top > window.innerHeight * 0.6) title.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
        return;
      }
      if (quiet) return;
      setState("idle");
      state.last = null;
      renderPlaceholders();
      statusText.textContent = L().idle;
      var code = r.data && r.data.error;
      var fieldError = code === "bad_url" || code === "bad_scheme" || code === "bad_port" || code === "private_host" || code === "dns";
      showError((r.data && r.data.message) || t.network, fieldError ? urlInput : null);
    }, function (e) {
      finish();
      if (quiet) return;
      setState("idle");
      state.last = null;
      renderPlaceholders();
      statusText.textContent = L().idle;
      showError(e && e.name === "AbortError" ? L().timeout : L().network, null);
    });
  }
  function finish() {
    state.busy = false;
    submit.disabled = false;
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var url = urlInput.value.trim();
    if (!url) { showError(L().empty, urlInput); return; }
    if (form.elements.company_website && form.elements.company_website.value) return;
    run({ url: url, trade: (form.elements.trade.value || "").trim(), town: (form.elements.town.value || "").trim() }, false);
  });
  urlInput.addEventListener("input", function () { if (errorBox.textContent) clearError(); });

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
    post({ url: state.last.url, email: email, consent: !!mail.elements.consent.checked, lang: lang(), company_website: mail.elements.company_website.value }, 100000).then(function (r) {
      if (r.data && r.data.ok) { setMail("sent"); return; }
      setMail("fail");
      if (r.data && r.data.message) mailStatus.textContent = r.data.message;
      if (r.data && r.data.error === "email") { emailInput.setAttribute("aria-invalid", "true"); emailInput.focus(); }
    }, function () { setMail("fail"); });
  });
  emailInput.addEventListener("input", function () { emailInput.removeAttribute("aria-invalid"); if (state.mailState === "bad" || state.mailState === "fail" || state.mailState === "sent") setMail(state.last ? "ready" : "idle"); });

  // ---------------------------------------------------------------- language switch: same result in the other language
  window.addEventListener("rexity:languagechange", function () {
    if (state.busy) return;
    if (state.last && state.lastInput) {
      var keep = state.mailState;
      render(state.last); // labels that live in this file switch at once …
      statusText.textContent = L().done(state.last.host, state.last.overall.score);
      state.mailState = keep;
      run(state.lastInput, true); // … the report's own texts come from the function (24-hour cache, no new check)
    } else {
      renderPlaceholders();
    }
  });

  if (lang() === "en") renderPlaceholders();
})();
