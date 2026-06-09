/* omi-scroll.js — Sprint O O3-T5 hardened scroll-proxy.
   Drives the embedded IT page's GSAP ScrollSmoother from the PARENT page scroll
   so the whole page has ONE scrollbar / one continuous scroll. Iframe is
   position:sticky (height 100vh); #omi-it-scroll is a tall wrapper giving the
   parent scroll distance == the iframe content scroll length.

   Improvements over the previous setInterval(20×500ms) design:
   - ResizeObserver on the iframe body fires `measure()` only when something
     in the iframe actually changes size (font load, image decode, etc.) —
     no wasted ticks, and it keeps working past 10 s.
   - load timeout: if `frame.contentDocument` is still null after 8 s, swap
     to a visible fallback message instead of an invisibly blank section.
*/
(function () {
  function init() {
    var frame = document.getElementById('omi-it-frame');
    var wrap = document.getElementById('omi-it-scroll');
    if (!frame || !wrap) return;

    var loaded = false;
    var ro = null;

    function smoother() {
      try {
        var w = frame.contentWindow;
        return (w && w.ScrollSmoother && w.ScrollSmoother.get) ? w.ScrollSmoother.get() : null;
      } catch (e) { return null; }
    }

    function measure() {
      try {
        var w = frame.contentWindow, d = frame.contentDocument;
        if (!d || !w) return 0;
        var contentH = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
        var maxScroll = Math.max(0, contentH - w.innerHeight);
        wrap.style.height = (maxScroll + window.innerHeight) + 'px';
        return maxScroll;
      } catch (e) { return 0; }
    }

    function drive() {
      var rect = wrap.getBoundingClientRect();
      var prog = Math.max(0, -rect.top);              // 0 -> content scroll length while pinned
      var sm = smoother();
      try {
        if (sm) sm.scrollTo(prog, false);
        else if (frame.contentWindow) frame.contentWindow.scrollTo(0, prog);
      } catch (e) { /* swallow cross-origin / unsettled-frame errors */ }
    }

    function attachObserver() {
      try {
        var d = frame.contentDocument;
        if (!d || !d.body || !window.ResizeObserver) return false;
        ro = new ResizeObserver(function () { measure(); drive(); });
        ro.observe(d.body);
        return true;
      } catch (e) { return false; }
    }

    function showFallback() {
      // O3-T4: visible, accessible fallback if the iframe never paints.
      wrap.style.minHeight = '100vh';
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      var msg = document.createElement('div');
      msg.setAttribute('role', 'status');
      msg.style.cssText =
        'max-width:520px;padding:32px;background:#fff;border:1px solid #e2e2e0;border-radius:12px;' +
        'font:14px/1.55 Inter,system-ui,sans-serif;color:#070707;text-align:center;' +
        'box-shadow:0 6px 30px rgba(0,0,0,.06)';
      msg.innerHTML =
        '<p style="margin:0 0 8px;font-weight:600">Content could not be loaded.</p>' +
        '<p style="margin:0 0 12px;color:#444">' +
        'The interactive section did not load (network, JavaScript disabled, or strict tracking-blocker).</p>' +
        '<a href="/contact" style="color:#070707;border-bottom:1px solid #070707;text-decoration:none">' +
        'Talk to Rexity Labs →</a>';
      wrap.appendChild(msg);
      if (frame && frame.parentNode) frame.style.display = 'none';
    }

    frame.addEventListener('load', function () {
      loaded = true;
      // Try ResizeObserver first; fall back to a short measure/drive burst.
      if (!attachObserver()) {
        var ticks = 0;
        var iv = setInterval(function () {
          measure(); drive();
          if (++ticks > 12) clearInterval(iv);
        }, 500);
      }
      measure(); drive();
    });

    // Bootstrap before `load` fires (cached frame, etc.)
    var bootTicks = 0;
    var boot = setInterval(function () {
      measure(); drive();
      if (loaded || ++bootTicks > 20) clearInterval(boot);
    }, 500);

    // Hard failure: 8s and no contentDocument → fallback.
    setTimeout(function () {
      if (!loaded) {
        try {
          if (!frame.contentDocument || !frame.contentDocument.body || frame.contentDocument.body.children.length === 0) {
            showFallback();
          }
        } catch (e) { showFallback(); }
      }
    }, 8000);

    window.addEventListener('resize', function () { measure(); drive(); });
    window.addEventListener('scroll', drive, { passive: true });
    measure(); drive();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
