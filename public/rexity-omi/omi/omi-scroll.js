/* omi-scroll.js — A2 scroll-proxy: drive the embedded IT page's GSAP ScrollSmoother
   from the PARENT page scroll, so the whole page has ONE scrollbar / one continuous scroll.
   The iframe is position:sticky (height 100vh); a tall #omi-it-scroll wrapper gives the
   parent scroll distance == the IT page's content scroll length. */
(function () {
  function init() {
    var frame = document.getElementById('omi-it-frame');
    var wrap = document.getElementById('omi-it-scroll');
    if (!frame || !wrap) return;

    function smoother() {
      try {
        var w = frame.contentWindow;
        return (w && w.ScrollSmoother && w.ScrollSmoother.get) ? w.ScrollSmoother.get() : null;
      } catch (e) { return null; }
    }

    function measure() {
      try {
        var w = frame.contentWindow, d = frame.contentDocument;
        if (!d) return 0;
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
      } catch (e) {}
    }

    // Re-measure repeatedly until the IT page + smoother settle, then keep a light heartbeat.
    var ticks = 0;
    var iv = setInterval(function () {
      measure();
      drive();
      if (++ticks > 20) clearInterval(iv);            // ~10s of settling
    }, 500);

    frame.addEventListener('load', function () { measure(); drive(); });
    window.addEventListener('resize', function () { measure(); drive(); });
    window.addEventListener('scroll', drive, { passive: true });
    measure(); drive();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
