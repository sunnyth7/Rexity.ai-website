/* Homepage behaviour (Sprint 12 WP-1) — assets/js/home.js
   Inlined at the end of index.html by scripts/pages/16-devices.mjs (markers rx-home-js).
   1. Reveal: [data-rx-reveal] fade up 24 px / 600 ms, 80 ms stagger (only when html.rx-rv is set).
   2. "Designs aus dem Studio": bind the marquee only near the viewport.
   3. Services: the UI cards on the stages animate only in view (CSS .is-live); the chart draws once.
      3b. Web & Apps: the MacBook loop (video[data-rx-hsvc-video], preload="none") loads and plays only after the
      load event while ≥ 25 % in view and the tab is visible; it pauses otherwise. Reduced motion, no JS or no
      IntersectionObserver: the poster only.
   4. Work: ≥ 992 px with motion allowed, the section pins (sticky, 300vh) and steps between the three
      projects: out 200 ms, then in 300 ms, never two at once; hidden slides are inert + aria-hidden.
      Otherwise (phones, tablets, reduced motion, no JS) the three projects are stacked.
   5. "Kommt Ihnen das bekannt vor?": below 768 px each group's label becomes a toggle and groups 2–4
      start folded (founder review 2026-09-27: 3,000 px → about 1,400 px at 390). All text stays in the
      HTML; without JS and from 768 px every group is open.
   6. About collage media: photos and video load on the first scroll/interaction or 1.2 s after load (14-G). */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var IO = "IntersectionObserver" in window;
  var arr = function (l) { return Array.prototype.slice.call(l || []); };
  var onChange = function (mq, fn) { if (mq.addEventListener) mq.addEventListener("change", fn); else if (mq.addListener) mq.addListener(fn); };

  /* 1. reveal */
  function reveal() {
    var els = arr(doc.querySelectorAll("[data-rx-reveal]"));
    var show = function (el) { el.classList.add("is-in"); };
    if (!root.classList.contains("rx-rv") || !IO) return els.forEach(show);
    var io = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty("--rx-rv-delay", n++ * 80 + "ms");
        show(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
    onChange(reduce, function () { if (reduce.matches) els.forEach(show); });
  }

  /* 2. studio marquee: bind near the viewport (its loop clones make captures eager) */
  function marquee() {
    var mq = doc.querySelector("[data-rx-marquee-lazy]");
    if (!mq || !window.RxDevices) return;
    var go = function () {
      // the marquee's drag uses GSAP Draggable: wait for the template runtime (index.html #rx-boot, 14-G)
      if (!window.gsap && !window.RxBooted) return doc.addEventListener("rx:booted", go, { once: true });
      mq.removeAttribute("data-rx-marquee-lazy");
      mq.setAttribute("data-rx-marquee", "");
      window.RxDevices.init(mq.parentNode);
    };
    if (!IO) return go();
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); go(); }
    }, { rootMargin: "600px 0px" });
    io.observe(mq);
  }

  /* 3. services stages */
  function stages() {
    var list = arr(doc.querySelectorAll(".rx-hsvc__stage"));
    if (!list.length) return;
    if (!IO) return list.forEach(function (s) { s.classList.add("is-drawn"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var on = e.isIntersecting && !reduce.matches;
        e.target.classList.toggle("is-live", on);
        if (e.isIntersecting) e.target.classList.add("is-drawn");
      });
    }, { threshold: 0.25 });
    list.forEach(function (s) { io.observe(s); });
  }

  /* 3b. Web & Apps MacBook loop: nothing is fetched but the poster until the stage is in view */
  function stageVideo() {
    var vids = arr(doc.querySelectorAll("video[data-rx-hsvc-video]"));
    if (!vids.length || !IO) return;
    var loaded = doc.readyState === "complete";
    vids.forEach(function (v) {
      var inView = false;
      v.muted = true;
      function sync() {
        var on = loaded && inView && !doc.hidden && !reduce.matches;
        if (on && v.paused) {
          if (v.preload === "none") v.preload = "auto";
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else if (!on && !v.paused) v.pause();
      }
      new IntersectionObserver(function (es) { inView = es[es.length - 1].isIntersecting; sync(); }, { threshold: 0.25 }).observe(v);
      doc.addEventListener("visibilitychange", sync);
      onChange(reduce, sync);
      if (!loaded) window.addEventListener("load", function () { loaded = true; sync(); });
    });
  }

  /* 4. work: stepped, pinned slider at ≥ 992 */
  function work() {
    var sec = doc.querySelector(".rx-hwork");
    if (!sec || !window.matchMedia) return;
    var wide = window.matchMedia("(min-width: 992px)");
    var texts = arr(sec.querySelectorAll(".rx-hwork__t"));
    var devs = arr(sec.querySelectorAll(".rx-hwork__d"));
    var num = sec.querySelector(".rx-hwork__num");
    var dashes = arr(sec.querySelectorAll(".rx-hwork__dashes > span"));
    var n = texts.length, cur = 0, want = 0, busy = false, pinned = false, frame = 0, t1 = 0, t2 = 0;
    var pad = function (i) { return (i < 9 ? "0" : "") + (i + 1); };
    var comps = function (d) { return arr(d.querySelectorAll("[data-rx-cycle],[data-rx-autoscroll],[data-rx-chat]")); };
    function mark(i, on) {
      [texts[i], devs[i]].forEach(function (el) {
        el.classList.toggle("is-active", on);
        if (on) { el.removeAttribute("aria-hidden"); el.inert = false; }
        else { el.setAttribute("aria-hidden", "true"); el.inert = true; }
      });
      if (window.RxDevices) comps(devs[i]).forEach(function (c) { on ? window.RxDevices.play(c) : window.RxDevices.pause(c); });
    }
    function counter(i) {
      if (num) num.textContent = pad(i);
      dashes.forEach(function (d, k) { d.classList.toggle("is-on", k === i); });
    }
    function go(i) {
      want = i;
      if (busy || i === cur) return;
      busy = true;
      var from = cur;
      [texts[from], devs[from]].forEach(function (el) { el.classList.add("is-out"); el.classList.remove("is-active"); });
      t1 = setTimeout(function () {
        [texts[from], devs[from]].forEach(function (el) { el.classList.remove("is-out"); });
        mark(from, false);
        cur = i;
        counter(i);
        mark(i, true);
        t2 = setTimeout(function () { busy = false; if (want !== cur) go(want); }, 300);
      }, 200);
    }
    function index() {
      var r = sec.getBoundingClientRect(), span = r.height - window.innerHeight;
      if (span <= 0) return 0;
      var p = Math.min(1, Math.max(0, -r.top / span));
      return Math.min(n - 1, Math.floor(p * n));
    }
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(function () { frame = 0; if (pinned) go(index()); });
    }
    function setMode() {
      var on = wide.matches && !reduce.matches;
      if (on === pinned) return;
      pinned = on;
      clearTimeout(t1); clearTimeout(t2); busy = false;
      texts.concat(devs).forEach(function (el) { el.classList.remove("is-out", "is-active"); el.removeAttribute("aria-hidden"); el.inert = false; });
      sec.classList.toggle("is-pinned", on);
      if (on) {
        cur = want = index();
        for (var k = 0; k < n; k++) mark(k, k === cur);
        counter(cur);
      } else if (window.RxDevices) {
        devs.forEach(function (d) { comps(d).forEach(function (c) { window.RxDevices.play(c); }); });
      }
      if (window.ScrollTrigger && window.ScrollTrigger.refresh) setTimeout(function () { window.ScrollTrigger.refresh(); }, 0);
    }
    setMode();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onChange(wide, setMode);
    onChange(reduce, setMode);
    // devices.js is deferred and binds after this inline script: hold the inactive slides' screens then
    return function sync() { if (pinned) for (var k = 0; k < n; k++) mark(k, k === cur); };
  }

  /* 5. problems section: fold groups on phones */
  function problems() {
    var groups = arr(doc.querySelectorAll(".rx-hprob-group"));
    if (!groups.length || !window.matchMedia) return;
    var narrow = window.matchMedia("(max-width: 767px)");
    var refresh = function () { if (window.ScrollTrigger && window.ScrollTrigger.refresh) window.ScrollTrigger.refresh(); };
    var items = groups.map(function (g, i) {
      var label = g.querySelector(".rx-hprob-group__label"), chip = label && label.querySelector(".rx-chip");
      var list = g.querySelector(".rx-hprob-group__list");
      if (!chip || !list) return null;
      list.id = list.id || "rx-hprob-list-" + i;
      var btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "rx-hprob-group__toggle";
      btn.setAttribute("aria-controls", list.id);
      return { g: g, label: label, chip: chip, list: list, btn: btn, open: i === 0 };
    }).filter(Boolean);
    function set(it, open) {
      it.open = open;
      it.btn.setAttribute("aria-expanded", open ? "true" : "false");
      it.list.hidden = !open;
      it.g.classList.toggle("is-folded", !open);
    }
    function mode() {
      items.forEach(function (it) {
        if (narrow.matches) {
          if (it.chip.parentNode !== it.btn) { it.label.insertBefore(it.btn, it.chip); it.btn.appendChild(it.chip); }
          set(it, it.open);
        } else {
          if (it.chip.parentNode === it.btn) { it.label.insertBefore(it.chip, it.btn); it.label.removeChild(it.btn); }
          it.list.hidden = false;
          it.g.classList.remove("is-folded");
        }
      });
      refresh();
    }
    items.forEach(function (it) {
      it.btn.addEventListener("click", function () { set(it, !it.open); refresh(); });
    });
    onChange(narrow, mode);
    mode();
  }

  /* 6. about collage media (14-G): the six photos (img[data-rx-src]) and the video (video[data-rx-defer]) sit
     under the hero, but the collage's transforms put them inside the viewport, so native lazy loading fetched
     all of them (~1.3 MB) with the first screen. They now load on the first scroll/touch/key, or 1.2 s after
     the load event, whichever comes first. The <img>/<video> elements stay in the DOM for the template's
     scroll animation; only their sources are late. The video keeps `autoplay` (so the template's play/pause
     control starts in the "pause" state as before); under reduced motion it loads without autoplay (paused). */
  function aboutMedia() {
    var imgs = arr(doc.querySelectorAll("img[data-rx-src]"));
    var vids = arr(doc.querySelectorAll("video[data-rx-defer]"));
    if (!imgs.length && !vids.length) return;
    var done = false, timer = 0;
    // page scroll only: a capturing "scroll" listener would also fire for element scrolls (e.g. a snap row)
    var EV = ["wheel", "touchstart", "pointerdown", "keydown"];
    function go() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener("scroll", go);
      EV.forEach(function (t) { window.removeEventListener(t, go, true); });
      imgs.forEach(function (img) { img.src = img.getAttribute("data-rx-src"); img.removeAttribute("data-rx-src"); });
      vids.forEach(function (v) {
        var p = v.getAttribute("data-rx-poster");
        if (p) v.style.backgroundImage = 'url("' + p + '")';
        arr(v.querySelectorAll("source[data-rx-src]")).forEach(function (s) { s.src = s.getAttribute("data-rx-src"); s.removeAttribute("data-rx-src"); });
        v.removeAttribute("data-rx-defer");
        if (reduce.matches) {
          v.autoplay = false;
          onChange(reduce, function () { if (!reduce.matches && v.paused) { v.autoplay = true; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } });
        }
        v.preload = "auto";
        v.load();
      });
    }
    if ((window.pageYOffset || root.scrollTop) > 0) return go();
    window.addEventListener("scroll", go, { passive: true });
    EV.forEach(function (t) { window.addEventListener(t, go, { capture: true, passive: true }); });
    var later = function () { timer = setTimeout(go, 1200); };
    if (doc.readyState === "complete") later(); else window.addEventListener("load", later);
  }

  var syncWork = work(); // sets the final section height before the template's scroll triggers measure
  var ready = function () { problems(); reveal(); marquee(); stages(); stageVideo(); aboutMedia(); if (syncWork) syncWork(); };
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", ready); else ready();
  window.addEventListener("load", function () { if (window.ScrollTrigger && window.ScrollTrigger.refresh) window.ScrollTrigger.refresh(); });
})();
