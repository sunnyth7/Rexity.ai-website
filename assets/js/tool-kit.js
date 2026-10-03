/* tool-kit.js — shared by the two tools of Sprint 39: the RPA demo on /automation/rpa (assets/js/rpa-demo.js) and
   the Automatisierungs-Check (assets/js/automation-check.js). Loaded with defer before them.

   window.RexityTool
     lang()                 "de" | "en": the language the site's switch has stored (as assets/js/website-check.js reads it)
     el(tag, cls?, text?)   a new element; text is set as textContent (never as HTML)
     fill(node, children)   replaces the node's children
     show(node, on)         sets or removes the hidden attribute
     reduce                 true when the visitor prefers reduced motion
     guard(opts)            the bot check of one form, the same behaviour as on /website-check:
                            Cloudflare Turnstile, rendered explicitly into opts.box with appearance "always" (the
                            widget is visible; its place is reserved by the stylesheet), script loaded only when
                            the visitor touches opts.form (or load() is called), never on localhost / 127.0.0.1.
                            A token is single-use and sent as `turnstileToken`; a verified answer carries a `pass`
                            (30 minutes) that later requests send instead. A 403 `bot_check` gets one retry with a
                            fresh token.
                            opts: { form, box, siteKey, theme?: "light" | "dark", onAsk?(): void }
                            -> { on, load(), relang(), send(url, body, timeoutMs) -> Promise<{ status, data }> }
   Nothing is stored in the browser. */
(function () {
  "use strict";
  var doc = document;
  var TS_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var host = location.hostname;
  var LOCAL = host === "localhost" || host === "127.0.0.1";

  function lang() {
    try { return localStorage.getItem("rexity_lang") === "en" ? "en" : "de"; } catch (e) { return doc.documentElement.lang === "en" ? "en" : "de"; }
  }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function fill(node, children) {
    while (node.firstChild) node.removeChild(node.firstChild);
    for (var i = 0; i < children.length; i++) if (children[i]) node.appendChild(children[i]);
  }
  function show(node, on) { if (!node) return; if (on) node.removeAttribute("hidden"); else node.setAttribute("hidden", ""); }

  function guard(opts) {
    var box = opts.box;
    var bot = { on: !!(opts.siteKey && box) && !LOCAL, id: null, token: null, stale: false, loading: false, waiters: [] };
    var state = { pass: null, passUntil: 0, noCheck: false };
    if (box && !bot.on) box.hidden = true; // no widget here (localhost): do not keep its reserved place

    function settle(token) {
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
    function reset() {
      bot.token = null;
      bot.stale = false;
      try { if (bot.id !== null && window.turnstile) window.turnstile.reset(bot.id); } catch (e) { /* nothing */ }
    }
    function render() {
      if (!bot.on || bot.id !== null || !window.turnstile) return;
      try {
        bot.id = window.turnstile.render(box, {
          sitekey: opts.siteKey,
          theme: opts.theme || "light",
          language: lang(),
          size: "flexible",
          appearance: "always",
          "refresh-expired": "manual",
          callback: function (token) { bot.stale = false; settle(token); },
          "expired-callback": function () { reset(); }, // a token lives five minutes: get a fresh one
          "timeout-callback": function () { reset(); },
          "error-callback": function () { bot.token = null; settle(null); return true; },
          "before-interactive-callback": function () { if (bot.waiters.length && opts.onAsk) opts.onAsk(); }
        });
        box.setAttribute("data-on", "");
      } catch (e) { bot.id = null; settle(null); }
    }
    function load() {
      if (!bot.on || bot.id !== null || bot.loading) return;
      if (window.turnstile) { render(); return; }
      bot.loading = true;
      var tries = 0;
      var poll = setInterval(function () {
        if (window.turnstile) { clearInterval(poll); bot.loading = false; render(); }
        else if (++tries > 100) { clearInterval(poll); bot.loading = false; settle(null); }
      }, 150);
      if (doc.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]')) return; // the chat form loads the same file
      var s = doc.createElement("script");
      s.src = TS_SRC;
      s.async = true;
      s.onerror = function () { clearInterval(poll); bot.loading = false; if (s.parentNode) s.parentNode.removeChild(s); settle(null); };
      doc.head.appendChild(s);
    }
    /* -> Promise<string|null>: a token nobody has used yet, or null when none could be had in time */
    function token() {
      return new Promise(function (resolve) {
        if (bot.token) { var tk = bot.token; bot.token = null; bot.stale = true; resolve(tk); return; }
        var done = false;
        var timer = setTimeout(function () { if (done) return; done = true; resolve(null); }, 60000);
        bot.waiters.push(function (t) { if (done) return; done = true; clearTimeout(timer); resolve(t); });
        if (bot.id === null) load();
        else if (bot.stale) reset();
      });
    }
    /* -> Promise<object|null>: the fields that prove the bot check ({} when none is needed), or null */
    function proof(force) {
      if (!bot.on) return Promise.resolve({});
      if (!force && state.pass && state.passUntil > Date.now() + 5000) return Promise.resolve({ pass: state.pass });
      if (!force && state.noCheck) return Promise.resolve({}); // the server answered without issuing a pass: its check is off
      return token().then(function (t) { return t ? { turnstileToken: t } : null; });
    }
    function post(url, body, timeoutMs) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs) : null;
      return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
        .then(function (resp) { return resp.json().catch(function () { return null; }).then(function (data) { return { status: resp.status, data: data }; }); })
        .then(function (r) { if (timer) clearTimeout(timer); return r; }, function (e) { if (timer) clearTimeout(timer); throw e; });
    }
    /* one request with the bot check's proof; a 403 bot_check is repeated once with a fresh token */
    function send(url, body, timeoutMs, retried) {
      return proof(!!retried).then(function (p) {
        if (!p) return { status: 403, data: { ok: false, error: "bot_check", message: "" } };
        var b = {};
        var k;
        for (k in body) if (Object.prototype.hasOwnProperty.call(body, k)) b[k] = body[k];
        for (k in p) if (Object.prototype.hasOwnProperty.call(p, k)) b[k] = p[k];
        return post(url, b, timeoutMs).then(function (r) {
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
            if (bot.on && !retried) return send(url, body, timeoutMs, true);
          }
          return r;
        });
      });
    }
    /* the widget speaks the page's language: render it again (not while a request is waiting for its token) */
    function relang() {
      if (bot.on && bot.id !== null && window.turnstile && !bot.waiters.length) {
        try { window.turnstile.remove(bot.id); } catch (e) { /* nothing */ }
        bot.id = null;
        bot.token = null;
        bot.stale = false;
        render();
      }
    }
    if (bot.on && opts.form) {
      opts.form.addEventListener("focusin", load);
      opts.form.addEventListener("pointerdown", load);
    }
    return { on: bot.on, load: load, relang: relang, send: send };
  }

  window.RexityTool = {
    lang: lang, el: el, fill: fill, show: show, guard: guard,
    reduce: !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  };
})();
