/* articles.js — interactive article blocks on /artikel and /artikel/<slug> (Sprint 13-B).
 * Loaded with defer by scripts/pages/43-articles.mjs only. Vanilla, no requests, nothing is sent
 * anywhere; every block is readable and usable (as far as possible) without it.
 *   1. :::steps      steps reveal one by one on scroll (off under prefers-reduced-motion)
 *   2. :::checklist  "n von N treffen zu – …" result line (+ the unticked points as a to-do list)
 *   3. :::calculator recomputes every output from the reader's own inputs (number, checkbox = 0/1,
 *                    select = option value); the formula grammar is the one of
 *                    scripts/pages/lib-articles/formula.mjs (numbers, input names, + - * / ( ),
 *                    min, max, round) — parsed here, never eval'd. unit "€"/"$" = currency format.
 *   4. :::decision   one question at a time (Ja/Nein or the node's answers), back + restart; the
 *                    static nested list stays in the HTML for no-JS readers
 *   5. :::scorecard  weighted totals per option, editable names, print only the scorecard
 *   6. /artikel      kind filter chips; ?vorschau=1 lists unpublished articles (+ noindex)
 * Everything that shows text follows the DE/EN switch (rexity:languagechange).
 */
(function () {
  "use strict";
  var doc = document;
  var lang = function () {
    return doc.documentElement.lang === "en" ? "en" : "de";
  };
  var T = {
    de: { yes: "Ja", no: "Nein", back: "Zurück", restart: "Neu starten", question: "Frage", result: "Ergebnis" },
    en: { yes: "Yes", no: "No", back: "Back", restart: "Start again", question: "Question", result: "Result" },
  };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var each = function (list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  };
  var fmt = function (n, dec, currency) {
    var o = { maximumFractionDigits: dec, minimumFractionDigits: 0 };
    if (currency) { o.style = "currency"; o.currency = currency; }
    return new Intl.NumberFormat(lang() === "en" ? "en-GB" : "de-DE", o).format(n);
  };

  /* ------------------------------------------------------------ 1. steps */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        each(entries, function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    each(doc.querySelectorAll("[data-ax-steps] .ax-steps__item"), function (item) {
      // items already on screen stay visible (no flash); the rest reveal on scroll
      if (item.getBoundingClientRect().top < (window.innerHeight || 800) * 0.88) return;
      item.classList.add("ax-reveal");
      io.observe(item);
    });
  }

  /* ------------------------------------------------------------ 2. checklist */
  function checkUpdate(box) {
    var res = box.querySelector(".ax-check__result");
    if (!res) return;
    var inputs = box.querySelectorAll(".ax-check__list .ax-check__box");
    var n = 0;
    var open = [];
    each(inputs, function (inp) {
      if (inp.checked) n++;
      else open.push(inp.parentNode.querySelector(".ax-check__text").textContent);
    });
    var todo = box.querySelector("[data-ax-todo]");
    if (!n) {
      res.hidden = true;
      if (todo) todo.hidden = true;
      return;
    }
    var tpl = res.getAttribute("data-ax-tpl-" + lang()) || "";
    res.querySelector(".ax-check__sum").textContent = tpl.replace(/\{n\}/g, String(n)).replace(/\{total\}/g, res.getAttribute("data-ax-total"));
    res.hidden = false;
    if (todo) {
      var ol = todo.querySelector("ol");
      ol.textContent = "";
      each(open, function (txt) {
        var li = doc.createElement("li");
        li.textContent = txt;
        ol.appendChild(li);
      });
      todo.hidden = !open.length;
    }
  }
  var checks = doc.querySelectorAll("[data-ax-check]");
  each(checks, function (box) {
    box.addEventListener("change", function () { checkUpdate(box); });
    checkUpdate(box);
  });

  /* ------------------------------------------------------------ 3. calculator */
  var FUNCS = { min: [2, 99], max: [2, 99], round: [1, 1] };
  function parse(src) {
    var toks = [];
    var s = String(src);
    var i = 0;
    while (i < s.length) {
      var ch = s.charAt(i);
      var m;
      if (/\s/.test(ch)) { i++; continue; }
      if ((m = /^(\d+(\.\d+)?|\.\d+)/.exec(s.slice(i)))) { toks.push({ t: "num", v: Number(m[0]) }); i += m[0].length; continue; }
      if ((m = /^[a-z_][a-z0-9_]*/i.exec(s.slice(i)))) { toks.push({ t: "name", v: m[0] }); i += m[0].length; continue; }
      if ("+-*/(),".indexOf(ch) >= 0) { toks.push({ t: ch }); i++; continue; }
      throw new Error("bad formula");
    }
    var p = 0;
    function expr() {
      var n = term();
      while (toks[p] && (toks[p].t === "+" || toks[p].t === "-")) { var op = toks[p++].t; n = { op: op, a: n, b: term() }; }
      return n;
    }
    function term() {
      var n = factor();
      while (toks[p] && (toks[p].t === "*" || toks[p].t === "/")) { var op = toks[p++].t; n = { op: op, a: n, b: factor() }; }
      return n;
    }
    function factor() {
      var k = toks[p];
      if (!k) throw new Error("bad formula");
      if (k.t === "num") { p++; return { num: k.v }; }
      if (k.t === "name" && FUNCS[k.v] && toks[p + 1] && toks[p + 1].t === "(") {
        p += 2;
        var args = [expr()];
        while (toks[p] && toks[p].t === ",") { p++; args.push(expr()); }
        if (!toks[p] || toks[p].t !== ")") throw new Error("bad formula");
        p++;
        if (args.length < FUNCS[k.v][0] || args.length > FUNCS[k.v][1]) throw new Error("bad formula");
        return { fn: k.v, args: args };
      }
      if (k.t === "name") { p++; return { name: k.v }; }
      if (k.t === "(") { p++; var n = expr(); if (!toks[p] || toks[p].t !== ")") throw new Error("bad formula"); p++; return n; }
      if (k.t === "-") { p++; return { op: "neg", a: factor() }; }
      throw new Error("bad formula");
    }
    var ast = expr();
    if (p !== toks.length) throw new Error("bad formula");
    return ast;
  }
  function evaluate(n, v) {
    if ("num" in n) return n.num;
    if ("name" in n) return v[n.name];
    if (n.fn) {
      var a = [];
      for (var i = 0; i < n.args.length; i++) a.push(evaluate(n.args[i], v));
      return n.fn === "min" ? Math.min.apply(null, a) : n.fn === "max" ? Math.max.apply(null, a) : Math.round(a[0]);
    }
    if (n.op === "neg") return -evaluate(n.a, v);
    var x = evaluate(n.a, v);
    var y = evaluate(n.b, v);
    if (n.op === "+") return x + y;
    if (n.op === "-") return x - y;
    if (n.op === "*") return x * y;
    return y === 0 ? NaN : x / y;
  }
  function calcUpdate(box) {
    var vars = {};
    var ok = true;
    each(box.querySelectorAll("[data-ax-var]"), function (inp) {
      var x;
      if (inp.type === "checkbox") x = inp.checked ? 1 : 0;
      else {
        var raw = String(inp.value).replace(",", ".");
        x = raw === "" ? NaN : Number(raw);
      }
      if (!isFinite(x)) ok = false;
      vars[inp.getAttribute("data-ax-var")] = x;
    });
    var cards = [];
    each(box.querySelectorAll(".ax-calc__val"), function (out) {
      if (!out._ast) return;
      var r = ok ? evaluate(out._ast, vars) : NaN;
      out.textContent = isFinite(r) ? fmt(r, Number(out.getAttribute("data-ax-decimals")) || 0, out.getAttribute("data-ax-currency")) : "–";
      cards.push({ el: out.closest(".ax-calc__out"), v: isFinite(r) ? r : -Infinity });
    });
    var outs = box.querySelector("[data-ax-rank]");
    if (outs) {
      cards.sort(function (a, b) { return b.v - a.v; });
      each(cards, function (c) { outs.appendChild(c.el); });
    }
  }
  var calcs = doc.querySelectorAll("[data-ax-calc]");
  each(calcs, function (box) {
    var good = true;
    each(box.querySelectorAll(".ax-calc__val"), function (out) {
      try { out._ast = parse(out.getAttribute("data-ax-formula")); } catch (e) { good = false; }
    });
    if (!good) return;
    box.addEventListener("input", function () { calcUpdate(box); });
    box.addEventListener("change", function () { calcUpdate(box); });
    calcUpdate(box);
  });

  /* ------------------------------------------------------------ 4. decision */
  function decisionInit(box) {
    var data;
    try { data = JSON.parse(box.querySelector("[data-ax-ddata]").textContent); } catch (e) { return; }
    var app = box.querySelector("[data-ax-dapp]");
    var stat = box.querySelector("[data-ax-dstatic]");
    var path = [data.start];
    var result = null;
    function btn(label, cls, fn) {
      var b = doc.createElement("button");
      b.type = "button";
      b.className = cls;
      b.textContent = label;
      b.addEventListener("click", fn);
      return b;
    }
    function render(focus) {
      var l = lang();
      app.textContent = "";
      var node = data.nodes[path[path.length - 1]];
      if (!result) {
        var step = doc.createElement("p");
        step.className = "ax-decision__step";
        step.textContent = T[l].question + " " + path.length;
        var q = doc.createElement("p");
        q.className = "ax-decision__q";
        q.tabIndex = -1;
        q.textContent = node.q[l];
        var row = doc.createElement("div");
        row.className = "ax-decision__answers";
        each(node.answers, function (a) {
          row.appendChild(
            btn(a.label[l], "rx-chip ax-decision__answer", function () {
              if (a.to) path.push(a.to);
              else result = a;
              render(true);
            })
          );
        });
        app.appendChild(step);
        app.appendChild(q);
        app.appendChild(row);
        if (focus) q.focus();
      } else {
        var head = doc.createElement("p");
        head.className = "ax-decision__step";
        head.textContent = T[l].result;
        var r = doc.createElement("p");
        r.className = "ax-decision__result";
        r.tabIndex = -1;
        r.textContent = result.result[l];
        app.appendChild(head);
        app.appendChild(r);
        if (result.link) {
          var a = doc.createElement("a");
          a.className = "rx-link";
          a.href = result.link;
          if (/^https:/.test(result.link)) { a.target = "_blank"; a.rel = "noopener"; }
          a.textContent = result.more[l];
          app.appendChild(a);
        }
        if (focus) r.focus();
      }
      var nav = doc.createElement("div");
      nav.className = "ax-decision__nav";
      if (path.length > 1 || result) {
        nav.appendChild(btn(T[l].back, "ax-decision__navbtn", function () {
          if (result) result = null;
          else path.pop();
          render(true);
        }));
        nav.appendChild(btn(T[l].restart, "ax-decision__navbtn", function () {
          path = [data.start];
          result = null;
          render(true);
        }));
      }
      app.appendChild(nav);
    }
    stat.hidden = true;
    app.hidden = false;
    box._render = function () { render(false); };
    render(false);
  }
  var decisions = doc.querySelectorAll("[data-ax-decision]");
  each(decisions, decisionInit);

  /* ------------------------------------------------------------ 5. scorecard */
  function scoreUpdate(box) {
    var names = box.querySelectorAll("[data-ax-name]");
    each(names, function (inp) {
      var k = inp.getAttribute("data-ax-name");
      var v = inp.value.trim() || inp.getAttribute("data-ax-name-" + lang());
      each(box.querySelectorAll('[data-ax-optname="' + k + '"]'), function (s) { s.textContent = v; });
    });
    var totals = [];
    var rated = [];
    each(box.querySelectorAll("tr[data-ax-row]"), function (tr) {
      var w = Number(tr.querySelector("[data-ax-weight]").value) || 1;
      each(tr.querySelectorAll("[data-ax-pts]"), function (sel) {
        var k = Number(sel.getAttribute("data-ax-pts"));
        totals[k] = (totals[k] || 0) + (sel.value === "" ? 0 : Number(sel.value) * w);
        if (sel.value !== "") rated[k] = true;
      });
    });
    var max = 0;
    each(box.querySelectorAll("tr[data-ax-row] [data-ax-weight]"), function (s) { max += (Number(s.value) || 1) * 2; });
    each(box.querySelectorAll("[data-ax-max]"), function (s) { s.textContent = String(max); });
    each(box.querySelectorAll("[data-ax-total]"), function (o) {
      var k = Number(o.getAttribute("data-ax-total"));
      o.textContent = rated[k] ? String(totals[k] || 0) : "–";
    });
  }
  var scores = doc.querySelectorAll("[data-ax-score]");
  each(scores, function (box) {
    each(box.querySelectorAll("[data-ax-name]"), function (inp) {
      inp.addEventListener("input", function () { inp._dirty = true; });
    });
    box.addEventListener("input", function () { scoreUpdate(box); });
    box.addEventListener("change", function () { scoreUpdate(box); });
    var row = box.querySelector("[data-ax-print-row]");
    var pb = box.querySelector("[data-ax-print]");
    if (row && pb && window.print) {
      row.hidden = false;
      pb.addEventListener("click", function () {
        doc.documentElement.classList.add("ax-print");
        box.setAttribute("data-ax-print-target", "");
        var done = function () {
          doc.documentElement.classList.remove("ax-print");
          box.removeAttribute("data-ax-print-target");
          window.removeEventListener("afterprint", done);
        };
        window.addEventListener("afterprint", done);
        window.print();
        setTimeout(done, 1000);
      });
    }
    scoreUpdate(box);
  });

  window.addEventListener("rexity:languagechange", function () {
    // rexity.js has swapped the static texts; redo everything this script wrote
    setTimeout(function () {
      each(checks, checkUpdate);
      each(calcs, calcUpdate);
      each(decisions, function (b) { if (b._render) b._render(); });
      each(scores, function (box) {
        each(box.querySelectorAll("[data-ax-name]"), function (inp) {
          if (!inp._dirty) inp.value = inp.getAttribute("data-ax-name-" + lang());
        });
        scoreUpdate(box);
      });
      renderPreview();
    }, 0);
  });

  /* ------------------------------------------------------------ 6. index: filters + preview */
  var filters = doc.querySelector("[data-ax-filters]");
  if (filters) {
    filters.hidden = false;
    var btns = filters.querySelectorAll("button[data-ax-filter]");
    filters.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button[data-ax-filter]");
      if (!b) return;
      var k = b.getAttribute("data-ax-filter");
      each(btns, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      each(doc.querySelectorAll(".ax-grid [data-ax-kind]"), function (c) {
        c.hidden = k !== "all" && c.getAttribute("data-ax-kind") !== k;
      });
    });
  }

  var previewBox = doc.querySelector("[data-ax-preview]");
  // ?vorschau=1, or any host that isn't the live site (LAN review server, Vercel preview): show the upcoming
  // articles too. On www.rexity.ai they stay hidden until their publish day.
  var liveHost = /^(www\.)?rexity\.ai$/.test(window.location.hostname);
  var wantPreview = /[?&]vorschau=1(&|$)/.test(window.location.search) || !liveHost;
  function renderPreview() {
    if (!previewBox || !wantPreview) return;
    var data;
    try { data = JSON.parse(previewBox.querySelector("[data-ax-preview-data]").textContent); } catch (e) { return; }
    var l = lang();
    var ul = previewBox.querySelector("[data-ax-preview-list]");
    ul.textContent = "";
    each(data, function (a) {
      var li = doc.createElement("li");
      var link = doc.createElement("a");
      link.className = "rx-panel ax-card ax-card--preview";
      link.href = a.url;
      link.rel = "nofollow";
      var add = function (tag, cls, txt, parent) {
        var el = doc.createElement(tag);
        el.className = cls;
        el.textContent = txt;
        (parent || link).appendChild(el);
        return el;
      };
      if (a.img) {
        var media = doc.createElement("div");
        media.className = "ax-card__media";
        var im = doc.createElement("img");
        im.src = a.img; im.alt = ""; im.loading = "lazy"; im.decoding = "async"; im.width = 800; im.height = 534;
        media.appendChild(im);
        link.appendChild(media);
        link.className += " ax-card--media";
      }
      add("span", "rx-chip ax-card__kind", a.kind[l]);
      add("h3", "rx-panel__title ax-card__title", a.title[l]);
      add("p", "rx-panel__text ax-card__text", a.description[l]);
      var foot = add("div", "rx-panel__foot ax-card__foot", "");
      add("p", "ax-card__meta", a.when[l], foot);
      li.appendChild(link);
      ul.appendChild(li);
    });
    previewBox.hidden = !data.length;
  }
  if (previewBox && wantPreview) {
    var robots = doc.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = doc.createElement("meta");
      robots.name = "robots";
      doc.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex,nofollow");
    renderPreview();
  }
})();
