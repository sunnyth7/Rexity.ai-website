/* omi-work-tiles.js — runs in the SHELL (root index.html).
   The "Selected work" tiles live inside #omi-it-frame, which is
   pointer-events:none (see omi-card-hotspots.js for why). This lays a
   transparent <a> in the shell over every [data-rx-href] tile, kept aligned
   each frame, so tiles are clickable and show a hover state.
   Reversible: delete this file + its <script> include. */
(function () {
  var frame = document.getElementById('omi-it-frame');
  if (!frame) return;
  var layer = null, spots = [];

  function build() {
    var d; try { d = frame.contentDocument; } catch (e) { return false; }
    if (!d) return false;
    var tiles = [].slice.call(d.querySelectorAll('[data-rx-href]'));
    if (!tiles.length) return false;
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'omi-work-layer';
      layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:500';
      document.body.appendChild(layer);
    }
    tiles.forEach(function (tile) {
      if (tile.__rxSpot) return;
      tile.__rxSpot = 1;
      var a = document.createElement('a');
      a.href = tile.getAttribute('data-rx-href');
      a.setAttribute('aria-label', tile.getAttribute('data-rx-label') || 'Project');
      a.style.cssText = 'position:fixed;display:none;pointer-events:auto;cursor:pointer;background:transparent';
      a.addEventListener('mouseenter', function () { tile.classList.add('is-hover'); });
      a.addEventListener('mouseleave', function () { tile.classList.remove('is-hover'); });
      layer.appendChild(a);
      spots.push({ tile: tile, el: a });
    });
    return true;
  }

  function place() {
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i], r = null;
      try { r = s.tile.getBoundingClientRect(); } catch (e) {}
      var vis = r && r.width > 4 && r.height > 4 &&
        r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      if (vis) {
        s.el.style.left = r.left + 'px'; s.el.style.top = r.top + 'px';
        s.el.style.width = r.width + 'px'; s.el.style.height = r.height + 'px';
        s.el.style.display = 'block';
      } else s.el.style.display = 'none';
    }
  }

  var started = false;
  function start() {
    if (started) return; started = true;
    place();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    setInterval(place, 100);
    (function raf() { place(); requestAnimationFrame(raf); })();
  }
  var tries = 0;
  var iv = setInterval(function () {
    if (build()) { clearInterval(iv); start(); } else if (++tries > 80) clearInterval(iv);
  }, 300);
  frame.addEventListener('load', function () { build(); });
})();
