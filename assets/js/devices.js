/*!
 * Rexity device mockups (Sprint 7A) — assets/js/devices.js
 * Vanilla JS. Uses the vendored GSAP Draggable + InertiaPlugin (already on
 * every page) for the marquee; everything else needs no library.
 *
 * Include on a page with the build-refreshed block (see src/layouts/README.md → "Devices"):
 *   <!-- rx-devices --><!-- /rx-devices -->       (in <head>; npm run build fills it)
 *
 * ------------------------------------------------------------------ markup
 *   [data-rx-cycle="slide-up|fade|zoom"]   children .rx-slide; one is shown at a time
 *        data-rx-interval="3200"          ms per slide (default 3200)
 *        data-rx-autoplay="false"         only move when driven (RxDevices.goTo)
 *        data-rx-pause-hover="false"      keep running on hover/focus (default: pause)
 *        id + <div class="rx-dots" data-rx-dots-for="id">  optional dot buttons
 *        Non-first slides: put the image URL in data-src (and data-srcset) — it is
 *        loaded just before the slide is shown (and one ahead).
 *   [data-rx-autoscroll]                    a long capture (.rx-long / img) scrolls inside the screen
 *        data-rx-speed="60"               px per second at the rendered size (default 60)
 *        data-rx-hold="1400"              ms pause at top and bottom (default 1400)
 *   [data-rx-chat]                          chat thread: .rx-chat__msg bubbles reveal one by one
 *        data-rx-interval="1500"          ms between bubbles (default 1500)
 *        data-rx-typing="900"             ms typing indicator before each bubble (default 900)
 *        data-rx-start="3"                bubbles already visible when the thread starts (default 0)
 *        data-rx-loop-pause="3200"        ms the full thread stays before it restarts
 *   [data-rx-marquee]                       infinite, draggable (inertia) row of cards
 *        data-rx-speed="36"               px per second drift (default 36; negative = rightwards)
 *        data-rx-marquee-touch="snap"     below 768 px: a native scroll-snap row (84 % cards, the next one
 *                                         peeks) with passive position dots and no drift (Sprint 12)
 *        Touch pauses the drift while a finger is down and for 3 s after (all marquees).
 *
 * ------------------------------------------------------------------ API (window.RxDevices)
 *   RxDevices.init(root = document)       bind every [data-rx-*] under root (idempotent; runs on DOMContentLoaded)
 *   RxDevices.goTo(el, index, {instant})  show slide `index` of a cycle (wraps); returns the index
 *   RxDevices.next(el) / .prev(el)        step a cycle
 *   RxDevices.pause(el) / .play(el)       hold / release any component (user-level hold, stacks with off-screen pause)
 *   RxDevices.get(el)                     { type, index, count, running } or null
 *   RxDevices.destroy(el)                 unbind and restore the first frame
 *   RxDevices.reducedMotion               true when the visitor prefers reduced motion
 *   Events: a cycle dispatches "rx:cycle" (detail { index, count }) on its element.
 *   Declarative control: <button data-rx-goto="#stage" data-rx-index="2"> shows slide 2 of #stage
 *   (data-rx-index="next" / "prev" step it); the button gets aria-pressed while its slide is shown.
 *
 * Behaviour: everything pauses off-screen (IntersectionObserver), when the tab
 * is hidden, and (cycle/marquee) on hover or keyboard focus. With
 * prefers-reduced-motion: reduce nothing moves: cycles and autoscroll stay on
 * their first frame, the chat shows the whole thread, the marquee is a
 * normal scrollable row. Components inside an inactive cycle slide pause too.
 */
(function () {
  "use strict";
  if (window.RxDevices) return;

  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var instances = new Map(); // element -> instance
  var io = "IntersectionObserver" in window ? new IntersectionObserver(onIntersect, { rootMargin: "120px 0px" }) : null;
  var raf = window.requestAnimationFrame.bind(window);

  function num(el, name, dflt) {
    var v = parseFloat(el.getAttribute(name));
    return isFinite(v) ? v : dflt;
  }
  function onIntersect(entries) {
    entries.forEach(function (e) {
      var inst = instances.get(e.target);
      if (inst) { inst.inView = e.isIntersecting; update(inst); }
    });
  }
  function canRun(inst) {
    return inst.inView && !document.hidden && !mq.matches && !inst.holds.user && !inst.holds.hover && !inst.holds.parent;
  }
  function update(inst) {
    var run = canRun(inst);
    if (run !== inst.running) {
      inst.running = run;
      run ? inst.start() : inst.stop();
    }
  }
  function updateAll() { instances.forEach(update); }
  function hoverPause(inst, el) {
    if (el.getAttribute("data-rx-pause-hover") === "false") return;
    var set = function (v) { return function () { inst.holds.hover = v; update(inst); }; };
    el.addEventListener("mouseenter", set(true));
    el.addEventListener("mouseleave", set(false));
    el.addEventListener("focusin", set(true));
    el.addEventListener("focusout", function (e) { if (!el.contains(e.relatedTarget)) { inst.holds.hover = false; update(inst); } });
  }
  function base(el, type) {
    var inst = { el: el, type: type, inView: !io, running: false, holds: { user: false, hover: false, parent: false }, start: function () {}, stop: function () {}, reset: function () {} };
    instances.set(el, inst);
    if (io) io.observe(el);
    return inst;
  }
  function promote(img) {
    if (!img) return;
    var list = img.tagName === "IMG" ? [img] : img.querySelectorAll("img[data-src], source[data-srcset]");
    Array.prototype.forEach.call(list, function (i) {
      if (i.getAttribute("data-srcset")) { i.setAttribute("srcset", i.getAttribute("data-srcset")); i.removeAttribute("data-srcset"); }
      if (i.getAttribute("data-src")) { i.setAttribute("src", i.getAttribute("data-src")); i.removeAttribute("data-src"); }
    });
  }
  function nested(slide, hold) {
    instances.forEach(function (inst) {
      if (inst.el !== slide && slide.contains(inst.el)) { inst.holds.parent = hold; update(inst); }
    });
  }

  // ---------------------------------------------------------------- cycle
  function initCycle(el) {
    var slides = Array.prototype.filter.call(el.children, function (c) { return c.classList.contains("rx-slide"); });
    var inst = base(el, "cycle");
    inst.count = slides.length;
    inst.index = 0;
    var interval = num(el, "data-rx-interval", 3200);
    var autoplay = el.getAttribute("data-rx-autoplay") !== "false";
    var timer = null, leaveTimer = null;
    var dots = el.id ? document.querySelector('[data-rx-dots-for="' + el.id + '"]') : null;

    function paint(i, instant) {
      if (instant) el.classList.add("is-instant");
      slides.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle("is-active", on);
        s.classList.toggle("is-leaving", !on && k === inst.index && !instant);
        s.setAttribute("aria-hidden", on ? "false" : "true");
        if ("inert" in s) s.inert = !on;
      });
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(function () { slides.forEach(function (s) { s.classList.remove("is-leaving"); }); }, 900);
      if (instant) { void el.offsetWidth; el.classList.remove("is-instant"); }
      if (dots) Array.prototype.forEach.call(dots.children, function (d, k) { d.setAttribute("aria-current", k === i ? "true" : "false"); });
    }
    inst.goTo = function (i, opts) {
      if (!slides.length) return 0;
      i = ((Math.round(i) % slides.length) + slides.length) % slides.length;
      promote(slides[i]);
      promote(slides[(i + 1) % slides.length]);
      if (i === inst.index && el.classList.contains("is-live")) return i;
      var instant = !!(opts && opts.instant) || mq.matches;
      if (el.classList.contains("is-live")) paint(i, instant);
      var prev = inst.index;
      inst.index = i;
      slides.forEach(function (s, k) { nested(s, k !== i); });
      if (prev !== i) el.dispatchEvent(new CustomEvent("rx:cycle", { bubbles: true, detail: { index: i, count: slides.length } }));
      if (inst.running) schedule();
      return i;
    };
    function schedule() {
      clearTimeout(timer);
      if (autoplay && slides.length > 1) timer = setTimeout(function () { inst.goTo(inst.index + 1); }, interval);
    }
    inst.start = schedule;
    inst.stop = function () { clearTimeout(timer); };
    inst.reset = function () {
      inst.stop();
      el.classList.remove("is-live");
      slides.forEach(function (s) { s.classList.remove("is-active", "is-leaving"); s.removeAttribute("aria-hidden"); if ("inert" in s) s.inert = false; });
    };
    inst.live = function () {
      if (mq.matches) {
        // reduced motion: first frame only (or the externally chosen one), no transitions
        el.classList.add("is-live");
        paint(inst.index, true);
        return;
      }
      el.classList.add("is-live");
      paint(inst.index, true);
    };
    if (dots && !dots.children.length) {
      slides.forEach(function (s, k) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", (document.documentElement.lang === "en" ? "Screen " : "Bild ") + (k + 1));
        b.addEventListener("click", function () { inst.goTo(k); });
        dots.appendChild(b);
      });
    }
    hoverPause(inst, el);
    inst.live();
    slides.forEach(function (s, k) { if (k) nested(s, true); });
    promote(slides[1]);
    return inst;
  }

  // ------------------------------------------------------------ autoscroll
  function initAutoscroll(el) {
    var img = el.querySelector(".rx-long") || el.querySelector("img");
    var inst = base(el, "autoscroll");
    if (!img) return inst;
    var speed = num(el, "data-rx-speed", 60), hold = num(el, "data-rx-hold", 1400);
    var y = 0, dir = 1, waitUntil = 0, last = 0, frame = 0;
    function dist() { return Math.max(0, img.getBoundingClientRect().height - el.getBoundingClientRect().height); }
    function tick(t) {
      if (!inst.running) return;
      frame = raf(tick);
      if (!last) last = t;
      var dt = Math.min(64, t - last);
      last = t;
      if (t < waitUntil) return;
      var d = dist();
      if (d < 2) return;
      y += dir * speed * (dir > 0 ? 1 : 2.6) * dt / 1000; // scroll back up faster
      if (y >= d) { y = d; dir = -1; waitUntil = t + hold; }
      else if (y <= 0) { y = 0; dir = 1; waitUntil = t + hold; }
      img.style.transform = "translate3d(0," + (-y).toFixed(2) + "px,0)";
    }
    inst.start = function () { last = 0; if (!y) waitUntil = performance.now() + hold * 0.6; frame = raf(tick); };
    inst.stop = function () { cancelAnimationFrame(frame); };
    inst.reset = function () { inst.stop(); y = 0; dir = 1; img.style.transform = ""; };
    window.addEventListener("resize", function () { var d = dist(); if (y > d) y = d; }, { passive: true });
    return inst;
  }

  // ------------------------------------------------------------------ chat
  function initChat(el) {
    var inst = base(el, "chat");
    var thread = el.querySelector(".rx-chat__thread") || el;
    var msgs = Array.prototype.slice.call(thread.querySelectorAll(".rx-chat__msg"));
    var gap = num(el, "data-rx-interval", 1500), typing = num(el, "data-rx-typing", 900), loopPause = num(el, "data-rx-loop-pause", 3200);
    var start = Math.min(num(el, "data-rx-start", 0), msgs.length); // first `start` bubbles stay visible; the rest type in
    var dots = document.createElement("li");
    dots.className = "rx-chat__typing";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<i></i><i></i><i></i>";
    thread.appendChild(dots);
    var step = 0, timer = null, phase = "idle";
    function showAll() {
      msgs.forEach(function (m) { m.classList.remove("is-pending", "is-entering"); });
      dots.classList.remove("is-on");
    }
    function hideAll() {
      msgs.forEach(function (m, i) { m.classList.toggle("is-pending", i >= start); m.classList.remove("is-entering"); });
      step = start;
    }
    function next() {
      if (!inst.running) return;
      if (step >= msgs.length) {
        phase = "done";
        timer = setTimeout(function () {
          el.classList.add("is-fading");
          timer = setTimeout(function () { hideAll(); el.classList.remove("is-fading"); next(); }, 550);
        }, loopPause);
        return;
      }
      var m = msgs[step];
      var me = m.classList.contains("rx-chat__msg--me");
      dots.classList.toggle("is-me", me);
      thread.appendChild(dots); // keep the indicator after the last visible bubble
      dots.classList.add("is-on");
      phase = "typing";
      timer = setTimeout(function () {
        dots.classList.remove("is-on");
        m.classList.remove("is-pending");
        m.classList.add("is-entering");
        void m.offsetWidth;
        m.classList.remove("is-entering");
        step++;
        phase = "gap";
        timer = setTimeout(next, gap);
      }, step === start ? typing * 0.6 : typing);
    }
    inst.start = function () {
      if (!el.classList.contains("is-live")) { el.classList.add("is-live"); hideAll(); }
      next();
    };
    inst.stop = function () { clearTimeout(timer); dots.classList.remove("is-on"); };
    inst.reset = function () { inst.stop(); el.classList.remove("is-live", "is-fading"); showAll(); step = 0; };
    return inst;
  }

  // --------------------------------------------------------------- marquee
  function initMarquee(el) {
    var inst = base(el, "marquee");
    var track = el.querySelector(".rx-marquee__track");
    if (!track) return inst;
    var originals = Array.prototype.slice.call(track.children);
    var speed = num(el, "data-rx-speed", 36);
    var x = 0, setW = 0, frame = 0, last = 0, dragging = false, vx = 0, clones = [], drag = null, tween = null, wheelTimer = null;
    var G = window.gsap, D = window.Draggable;
    // Sprint 12 (opt-in): data-rx-marquee-touch="snap" — below 768 px the row is a native scroll-snap row
    // with passive position dots and no drift at all; at 768 px and up it stays the draggable marquee.
    var snapMq = el.getAttribute("data-rx-marquee-touch") === "snap" && window.matchMedia ? window.matchMedia("(max-width: 767px)") : null;
    var dots = null, dotFrame = 0;
    function snapOn() { return !!(snapMq && snapMq.matches); }
    function paintDots() {
      dotFrame = 0;
      if (!dots) return;
      var step = cardStep() || 1, i = Math.round(el.scrollLeft / step);
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) i = originals.length - 1;
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("is-on", k === i); });
    }
    function setSnap(on) {
      el.classList.toggle("is-snap", on);
      if (on && !dots) {
        dots = document.createElement("div");
        dots.className = "rx-marquee__dots";
        dots.setAttribute("aria-hidden", "true");
        originals.forEach(function () { dots.appendChild(document.createElement("span")); });
        el.parentNode.insertBefore(dots, el.nextSibling);
      }
      if (dots) dots.hidden = !on;
      if (on) paintDots();
    }
    el.addEventListener("scroll", function () { if (dots && !dotFrame) dotFrame = raf(paintDots); }, { passive: true });
    // touch pauses the drift (≥ 768 px): hold while the finger is down and for 3 s after
    var touchTimer = null;
    el.addEventListener("touchstart", function () { clearTimeout(touchTimer); inst.holds.hover = true; update(inst); }, { passive: true });
    el.addEventListener("touchend", function () { clearTimeout(touchTimer); touchTimer = setTimeout(function () { inst.holds.hover = false; update(inst); }, 3000); }, { passive: true });

    // Sprint 16 A2.2: the loop clones keep loading="lazy" until the row is within one viewport height, then switch
    // to eager, so a clone that drifts in from the clipped overflow is already there (no blank tile). They reuse the
    // originals' URLs, so by then it is a cache hit; off-screen rows fetch nothing early.
    var near = !io;
    function eager(c) { c.querySelectorAll("img[loading=lazy]").forEach(function (i) { i.loading = "eager"; }); }
    if (!near) {
      var nearIo = new IntersectionObserver(function (es) {
        if (!es[es.length - 1].isIntersecting) return;
        near = true;
        nearIo.disconnect();
        clones.forEach(eager);
      }, { rootMargin: "100% 0px" });
      nearIo.observe(el);
    }

    function measure() {
      var gapPx = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      var first = originals[0], lastEl = originals[originals.length - 1];
      setW = lastEl.offsetLeft + lastEl.offsetWidth - first.offsetLeft + gapPx;
    }
    function fill() {
      clones.forEach(function (c) { c.remove(); });
      clones = [];
      measure();
      var need = Math.ceil((el.clientWidth + setW) / Math.max(1, setW)) + 1;
      for (var r = 0; r < need; r++) originals.forEach(function (o) {
        var c = o.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("data-rx-clone", "");
        if ("inert" in c) c.inert = true;
        c.querySelectorAll("a,button,input,[tabindex]").forEach(function (f) { f.setAttribute("tabindex", "-1"); });
        if (c.matches("a,button,[tabindex]")) c.setAttribute("tabindex", "-1");
        if (near) eager(c);
        track.appendChild(c);
        clones.push(c);
      });
    }
    function wrap(v) { return setW ? ((v % setW) - setW) % setW : v; } // always in (-setW, 0]
    function render() { x = wrap(x); track.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)"; }
    function tick(t) {
      frame = raf(tick);
      var dt = last ? Math.min(64, t - last) : 16;
      last = t;
      if (dragging || tween) return;
      x -= speed * dt / 1000;
      render();
    }
    function nudge(dx) {
      if (!G) { x += dx; render(); return; }
      if (tween) tween.kill();
      var o = { v: x };
      tween = G.to(o, { v: x + dx, duration: 0.55, ease: "power3.out", onUpdate: function () { x = o.v; render(); }, onComplete: function () { tween = null; } });
    }
    function cardStep() {
      var a = originals[0], b = originals[1];
      return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
    }
    function live() {
      if (el.classList.contains("is-live") || mq.matches || snapOn()) return;
      el.classList.add("is-live");
      el.scrollLeft = 0;
      fill();
      render();
      if (D && G) {
        if (window.InertiaPlugin) G.registerPlugin(D, window.InertiaPlugin); else G.registerPlugin(D);
        var proxy = document.createElement("div");
        var startX = 0;
        drag = D.create(proxy, {
          type: "x",
          trigger: el,
          inertia: !!window.InertiaPlugin,
          allowNativeTouchScrolling: true,
          allowContextMenu: true,
          minimumMovement: 6,
          dragClickables: true,
          onPress: function () { if (tween) { tween.kill(); tween = null; } startX = x; G.set(proxy, { x: 0 }); this.update(); },
          onDragStart: function () { dragging = true; el.classList.add("is-dragging"); },
          onDrag: function () { x = startX + this.x; render(); },
          onThrowUpdate: function () { x = startX + this.x; render(); },
          onRelease: function () { if (!this.isThrowing) end(); },
          onThrowComplete: end,
        })[0];
      }
      // horizontal trackpad / shift+wheel
      el.addEventListener("wheel", onWheel, { passive: false });
    }
    function end() {
      dragging = false;
      setTimeout(function () { el.classList.remove("is-dragging"); }, 30);
    }
    function onWheel(e) {
      var dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!dx) return;
      e.preventDefault();
      x -= dx;
      render();
      dragging = true;
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { dragging = false; }, 160);
    }
    // a click that ends a drag must not follow the link
    el.addEventListener("click", function (e) { if (el.classList.contains("is-dragging")) { e.preventDefault(); e.stopPropagation(); } }, true);
    // keyboard: arrows move by one card; focusing a card brings it into view
    el.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      var d = e.key === "ArrowRight" ? -cardStep() : cardStep();
      if (el.classList.contains("is-live")) nudge(d);
      else el.scrollBy({ left: -d, behavior: mq.matches ? "auto" : "smooth" });
    });
    el.addEventListener("focusin", function (e) {
      if (!el.classList.contains("is-live")) return;
      var card = originals.filter(function (o) { return o.contains(e.target); })[0];
      if (!card) return;
      el.scrollLeft = 0; // browsers may scroll the hidden overflow on focus
      var left = card.offsetLeft + x, right = left + card.offsetWidth, pad = 24;
      if (left < pad) nudge(pad - left);
      else if (right > el.clientWidth - pad) nudge(el.clientWidth - pad - right);
    });
    window.addEventListener("resize", function () { if (el.classList.contains("is-live")) { fill(); render(); } }, { passive: true });
    hoverPause(inst, el);
    inst.start = function () { if (snapOn()) return; live(); last = 0; cancelAnimationFrame(frame); frame = raf(tick); };
    inst.stop = function () { cancelAnimationFrame(frame); };
    inst.reset = function () {
      inst.stop();
      if (drag) { drag.kill(); drag = null; }
      clones.forEach(function (c) { c.remove(); });
      clones = [];
      el.removeEventListener("wheel", onWheel);
      el.classList.remove("is-live", "is-dragging");
      track.style.transform = "";
      x = 0;
    };
    if (snapMq) {
      var onSnap = function () {
        inst.running = false;
        inst.reset();
        setSnap(snapOn());
        if (!snapOn() && !mq.matches) live();
        update(inst);
      };
      if (snapMq.addEventListener) snapMq.addEventListener("change", onSnap); else if (snapMq.addListener) snapMq.addListener(onSnap);
      setSnap(snapOn());
    }
    if (!mq.matches && !snapOn()) live();
    return inst;
  }

  // ------------------------------------------------------------------ core
  var KINDS = [
    ["[data-rx-marquee]", initMarquee],
    ["[data-rx-chat]", initChat],
    ["[data-rx-autoscroll]", initAutoscroll],
    ["[data-rx-cycle]", initCycle], // last: a cycle holds the components inside its inactive slides
  ];
  function init(root) {
    root = root || document;
    KINDS.forEach(function (k) {
      // innermost first, so an outer cycle can hold the components inside its hidden slides
      Array.prototype.slice.call(root.querySelectorAll(k[0])).reverse().forEach(function (el) { if (!instances.has(el)) k[1](el); });
    });
    updateAll();
  }
  function inst(el) { return typeof el === "string" ? instances.get(document.querySelector(el)) : instances.get(el); }

  document.addEventListener("visibilitychange", updateAll);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-rx-goto]");
    if (!b) return;
    var target = document.querySelector(b.getAttribute("data-rx-goto"));
    var x = target && instances.get(target);
    if (!x || !x.goTo) return;
    e.preventDefault();
    var i = b.getAttribute("data-rx-index");
    x.goTo(i === "next" ? x.index + 1 : i === "prev" ? x.index - 1 : +i || 0);
  });
  document.addEventListener("rx:cycle", function (e) {
    if (!e.target.id) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-rx-goto="#' + e.target.id + '"][data-rx-index]'), function (b) {
      var i = b.getAttribute("data-rx-index");
      if (i !== "next" && i !== "prev") b.setAttribute("aria-pressed", +i === e.detail.index ? "true" : "false");
    });
  });
  var onMotion = function () {
    api.reducedMotion = mq.matches;
    instances.forEach(function (i) {
      i.running = false;
      i.reset();
      if (i.type === "cycle") i.live();
    });
    updateAll();
  };
  if (mq.addEventListener) mq.addEventListener("change", onMotion); else if (mq.addListener) mq.addListener(onMotion);

  var api = {
    init: init,
    goTo: function (el, i, opts) { var x = inst(el); return x && x.goTo ? x.goTo(i, opts) : -1; },
    next: function (el) { var x = inst(el); return x && x.goTo ? x.goTo(x.index + 1) : -1; },
    prev: function (el) { var x = inst(el); return x && x.goTo ? x.goTo(x.index - 1) : -1; },
    pause: function (el) { var x = inst(el); if (x) { x.holds.user = true; update(x); } },
    play: function (el) { var x = inst(el); if (x) { x.holds.user = false; update(x); } },
    get: function (el) { var x = inst(el); return x ? { type: x.type, index: x.index || 0, count: x.count || 0, running: x.running } : null; },
    destroy: function (el) { var x = inst(el); if (!x) return; x.running = false; x.reset(); if (io) io.unobserve(x.el); instances.delete(x.el); },
    reducedMotion: mq.matches,
  };
  window.RxDevices = api;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { init(document); });
  else init(document);
})();
