/* Template boot loader (Sprint 14-G) — assets/js/boot.js
   Inlined by scripts/lib/boot.mjs: on "/" through the rx-home-boot marker (scripts/pages/16-devices.mjs), on
   generated pages by renderShell({ bootAfterPaint: true }) (/preise).
   The template runtime (jQuery, GSAP + plugins, Lenis, Webflow) used to run as parser-blocking scripts before
   the first paint. It now boots after DOMContentLoaded, once the first largest-contentful-paint candidate is on
   screen (the chat pill on "/", the hero text on /preise): at most 1 s later, two frames later where the LCP API
   is missing. All files start downloading together at that moment (preload links), then run one after the other.
   They were at the end of <body>, so on a real connection they used to start downloading only when the last bytes
   of the HTML arrived: close to the same moment. Order: jQuery, GSAP and its plugins, Lenis, then Webflow last. Before, every file had run by DOMContentLoaded and Webflow started its interactions then;
   now the document is already parsed, so Webflow starts them as soon as it runs and needs GSAP in place.
   If the window load event fired before the boot (fast or cached loads), the page-load triggers are replayed for
   the template: jQuery's window load (Webflow.load), IX2's page start/finish (IX2_PAGE_UPDATE) and a ScrollTrigger
   refresh. docs/logs/sprint-14.md "14-G Performance" has the measurements. */
(function () {
  var d = document, w = window, started = false;
  function mark(n) { try { performance.mark(n); } catch (e) {} }
  function replayLoad() {
    setTimeout(function () {
      if (w.jQuery) w.jQuery(w).trigger("load");
      try { d.dispatchEvent(new CustomEvent("IX2_PAGE_UPDATE")); } catch (e) {}
      if (w.ScrollTrigger && w.ScrollTrigger.refresh) w.ScrollTrigger.refresh();
    }, 0);
  }
  function boot() {
    if (started) return;
    started = true;
    mark("rx-boot");
    var late = d.readyState === "complete";
    var list = [].slice.call(d.querySelectorAll('script[type="text/x-rx-boot"]')), i = 0;
    list.forEach(function (o) {
      var src = o.getAttribute("data-rx-src");
      if (!src) return;
      var l = d.createElement("link"), c = o.getAttribute("crossorigin"), g = o.getAttribute("integrity");
      l.rel = "preload";
      l.as = "script";
      if (c) l.crossOrigin = c;
      if (g) l.integrity = g;
      l.href = src;
      d.head.appendChild(l);
    });
    (function next() {
      while (i < list.length) {
        var o = list[i++], s = d.createElement("script"), src = o.getAttribute("data-rx-src");
        if (src) {
          var c = o.getAttribute("crossorigin"), g = o.getAttribute("integrity");
          if (c) s.crossOrigin = c;
          if (g) s.integrity = g;
          s.src = src;
          s.async = false;
          s.onload = s.onerror = next;
          o.parentNode.replaceChild(s, o);
          return;
        }
        s.text = o.text;
        o.parentNode.replaceChild(s, o);
      }
      w.RxBooted = true;
      mark("rx-booted");
      d.dispatchEvent(new Event("rx:booted"));
      if (late) { if (w.Webflow && w.Webflow.push) w.Webflow.push(replayLoad); else replayLoad(); }
    })();
  }
  function later() {
    setTimeout(boot, 1000);
    var P = w.PerformanceObserver, T = (P && P.supportedEntryTypes) || [];
    if (T.indexOf("largest-contentful-paint") > -1) {
      var po = new P(function () { po.disconnect(); setTimeout(boot, 0); });
      po.observe({ type: "largest-contentful-paint", buffered: true });
      return;
    }
    if (w.requestAnimationFrame) requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(boot, 0); }); });
    else setTimeout(boot, 0);
  }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", later); else later();
})();
