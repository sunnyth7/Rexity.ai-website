/* services.js — Sprint 8A, service-family pages only (loaded with defer by
   scripts/pages/30-services.mjs). Progressive enhancement: every piece of
   copy is in the HTML and visible without this file.

   1. Process flow [data-sv-flow] (Sprint 12: the .sv-steps timeline where flow
      and steps map one to one, else the .sv-flow diagram): when it comes into
      view the connectors draw in and the highlight walks once through the
      stages (≤ 5 s). The highlight changes only border and tint, never the
      text colour, so contrast holds in every frame (P-34). [data-sv-sync]
      (optional) names a .sv-steps list with the same count to light in step.
      Reduced motion: static, first stage lit.
   2. Hero video [data-sv-video]: starts after window load while in view
      (muted loop, poster until then), pauses off-screen; the pause button
      (WCAG 2.2.2) is revealed once playback starts. Reduced motion: poster only.
*/
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  root.classList.add("sv-js");
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var hasIO = "IntersectionObserver" in window;

  function onView(el, cb, margin) {
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) cb(entries[i].isIntersecting);
    }, { rootMargin: margin || "0px 0px -10% 0px" }).observe(el);
  }

  // ---------------------------------------------------------------- 1. flow
  function initFlow(flow) {
    var stages = flow.children;
    var n = stages.length;
    if (!n) return;
    var steps = null;
    var sync = flow.getAttribute("data-sv-sync");
    if (sync) {
      var list = doc.getElementById(sync);
      if (list && list.children.length === n) steps = list.children;
    }
    // One pass through the stages each time the diagram enters the view, then back to the
    // first stage. The whole pass stays within 5 s (WCAG 2.2.2 needs no pause control then).
    var step = Math.min(1100, Math.floor(4800 / (n + 1)));
    var i = 0, timer = null;
    function show(k) {
      for (var s = 0; s < n; s++) {
        stages[s].classList.toggle("is-active", s === k);
        if (steps) steps[s].classList.toggle("is-active", s === k);
      }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } i = 0; show(0); }
    function pass() {
      stop();
      if (mq.matches || doc.hidden) return;
      timer = setInterval(function () {
        i++;
        if (i >= n) { stop(); return; }
        show(i);
      }, step);
    }
    show(0);
    onView(flow, function (inView) {
      if (inView) { flow.classList.add("is-in"); pass(); }
      else stop();
    });
    if (mq.addEventListener) mq.addEventListener("change", function () { if (mq.matches) stop(); });
  }

  // ---------------------------------------------------------------- 2. video
  function initVideo(video) {
    var btn = video.parentNode.querySelector(".sv-media__toggle");
    var userPaused = false, visible = false, loaded = doc.readyState === "complete";
    function sync() {
      var should = loaded && visible && !userPaused && !mq.matches && !doc.hidden;
      if (should && video.paused) {
        if (video.preload === "none") video.preload = "auto";
        var p = video.play();
        if (p && p.then) p.then(function () { if (btn) btn.hidden = false; }, function () {});
        else if (btn) btn.hidden = false;
      } else if (!should && !video.paused) video.pause();
      if (btn) btn.setAttribute("aria-pressed", userPaused ? "true" : "false");
    }
    if (btn) btn.addEventListener("click", function () { userPaused = !userPaused; sync(); });
    onView(video, function (inView) { visible = inView; sync(); }, "0px");
    if (!loaded) window.addEventListener("load", function () { loaded = true; sync(); });
    doc.addEventListener("visibilitychange", sync);
    if (mq.addEventListener) mq.addEventListener("change", sync);
  }

  function init() {
    var flows = doc.querySelectorAll("[data-sv-flow]");
    for (var f = 0; f < flows.length; f++) initFlow(flows[f]);
    var vids = doc.querySelectorAll("video[data-sv-video]");
    for (var v = 0; v < vids.length; v++) initVideo(vids[v]);
    initEdgeLight();
  }

  // Edge light (Sprint 43): the hovered panel's border light follows the pointer. One listener on the main element;
  // only two custom properties are written, so there is no layout work.
  function initEdgeLight() {
    var main = doc.querySelector(".sv-main");
    if (!main || !window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;
    main.addEventListener("pointermove", function (e) {
      var p = e.target && e.target.closest ? e.target.closest(".rx-panel") : null;
      if (!p) return;
      var r = p.getBoundingClientRect();
      p.style.setProperty("--ex", (e.clientX - r.left) + "px");
      p.style.setProperty("--ey", (e.clientY - r.top) + "px");
    }, { passive: true });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
