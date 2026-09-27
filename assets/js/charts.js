/* /work/levelkraft only (Sprint 11): the case study's bar charts (page views, MRR).
   Markup: scripts/pages/lib-work/charts.mjs. Appended after window load by an inline loader (lib-work/seo.mjs
   CHARTS_SCRIPT); without it the bars are
   static at full height with their value labels, and the popovers stay hidden.

   1. Grow-in: [data-rx-chart-grow] charts that are not yet in view get is-pending (bars at 0) and grow
      when they scroll in (is-in). Skipped with reduced motion.
   2. Popovers: every bar is a <button data-rx-bar aria-pressed>; its popover is the next sibling
      (.rx-chart-pop[hidden]). Click / tap / Enter / Space toggles it (pinned); on a device that hovers,
      hovering a bar shows it too. One open at a time on the page. Esc, a click outside a bar, or focus
      leaving the chart closes it. The popover text is bilingual in the HTML, so the DE/EN toggle
      (rexity.js) switches it like any other text. */
(function () {
  "use strict";
  var charts = document.querySelectorAll("[data-rx-chart]");
  if (!charts.length) return;

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- 1. grow-in */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        requestAnimationFrame(function () { el.classList.add("is-in"); });
      });
    }, { threshold: 0.35 });
    Array.prototype.forEach.call(document.querySelectorAll("[data-rx-chart-grow]"), function (c) {
      var r = c.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return; // already visible: stay static
      c.classList.add("is-pending");
      io.observe(c);
    });
  }

  /* ---------------------------------------------------------------- 2. popovers */
  var open = null; // the button whose popover is shown
  var pinned = false; // opened by click / key (stays until closed), not by hover

  function popOf(btn) { return btn.nextElementSibling; }

  function hide() {
    if (!open) return;
    var pop = popOf(open);
    if (pop) pop.hidden = true;
    open.setAttribute("aria-pressed", "false");
    open.parentNode.classList.remove("is-open");
    open = null;
    pinned = false;
  }

  function show(btn, pin) {
    if (open && open !== btn) hide();
    var pop = popOf(btn);
    if (!pop) return;
    pop.hidden = false;
    btn.setAttribute("aria-pressed", "true");
    btn.parentNode.classList.add("is-open");
    open = btn;
    pinned = pin;
  }

  Array.prototype.forEach.call(charts, function (chart) {
    chart.classList.add("is-interactive");
    var hint = chart.querySelector("[data-rx-chart-hint]");
    if (hint) hint.hidden = false;

    chart.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest("[data-rx-bar]");
      if (!btn) return;
      if (open === btn && pinned) hide();
      else show(btn, true);
    });

    if (canHover) {
      chart.addEventListener("pointerover", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        var btn = e.target.closest && e.target.closest("[data-rx-bar]");
        if (!btn || btn === open) return;
        if (pinned && open && chart.contains(open) && open !== btn) hide();
        if (!open) show(btn, false);
      });
      chart.addEventListener("pointerout", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        var btn = e.target.closest && e.target.closest("[data-rx-bar]");
        if (!btn || btn !== open || pinned) return;
        if (e.relatedTarget && btn.contains(e.relatedTarget)) return;
        hide();
      });
    }

    chart.addEventListener("focusout", function (e) {
      if (open && chart.contains(open) && !(e.relatedTarget && chart.contains(e.relatedTarget)) && e.relatedTarget) hide();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (!open || (e.key !== "Escape" && e.key !== "Esc")) return;
    var btn = open;
    var hadFocus = btn.parentNode.contains(document.activeElement);
    hide();
    if (hadFocus) btn.focus();
  });

  document.addEventListener("click", function (e) {
    if (!open) return;
    if (e.target.closest && e.target.closest("[data-rx-bar], .rx-chart-pop")) return;
    hide();
  });
})();
