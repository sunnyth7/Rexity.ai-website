import * as THREE from '/assets/3d-hero/three.module.js';

// Curved 3D headline, rebuilt with the reference's own configuration rather than
// approximations. Every constant below is taken verbatim from its compiled bundle
// (see docs/WHEEL_REFERENCE.md); only the phrase list and the hold duration are ours,
// because the reference swaps phrases on section change instead of on a timer.
//
//   font                400 210px Anton         textureHeight        293
//   texturePadding      15                      gapWidth             3
//   stripHeight         1                       referenceThetaLength 0.92
//   y                   2.08                    letterSpacing        -0.04em
//   radius              7.2 (the card ring)     mobile scale         1.31
//   mobile texture mul  2.2                     renderOrder          10
//   type 0.058 s/char   erase 0.032 s/char      entrance 0.72 s

const RADIUS = 7.2;
const FONT_PX = 210;
const FONT_STACK = "RxAnton, 'Arial Black', Impact, sans-serif";
const TEXTURE_HEIGHT = 293;
const TEXTURE_PADDING = 15;
const LETTER_SPACING = '-0.04em';
const STRIP_HEIGHT = 1;
const REFERENCE_THETA = 0.92;
const GAP_WIDTH = 3;
const Y = 2.08;
// Mobile sits the headline higher: at 2.08 it left a dead band between the header and
// the type. Measured on a 375px viewport — 91px per world unit at the ring, so ~53px
// of lift is 0.58. Desktop keeps 2.08; there the narrower lens has far less vertical
// room and fitY would only pull it back down.
const Y_MOBILE = 2.66;
const MOBILE_SCALE = 1.31;
const MOBILE_TEXTURE_MULTIPLIER = 2.2;

const TYPE_INTERVAL = 0.058;
const ERASE_INTERVAL = 0.032;
const ENTRANCE = 0.72;
const ENTRANCE_LIFT = 0.28;
const ENTRANCE_SCALE = 0.965;
const HOLD = 2.2;
const GAP = 0.34;
const LIMIT = 0.9; // max |NDC x| the headline may reach
const LIMIT_Y = 0.88; // max NDC y for the strip's top edge

// Kept short deliberately. Glyph size is fixed pixels-per-radian, so a phrase that
// overflows has to be scaled down — and then it renders at a different weight to the
// others. Every phrase here sits under the reference's own longest headline
// ("PRODUCT DESIGN", chord 6.39), so all six render at identical size.
export const PHRASES = [
  'PRODUCT DESIGN',
  'UI/UX DESIGN',
  'IOS APPS',
  'WEB & APP DEVELOPMENT',
  'BUSINESS AUTOMATION',
  'CHATBOT INTEGRATION',
  'AI IMPLEMENTATION',
];

const isMobile = () => window.matchMedia('(max-width: 760px)').matches;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

export function createHeadline({ parent, camera, reduceMotion, ink = '#0b1931', accent = '#1f5eea' }) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Resizing a canvas that already backs a CanvasTexture makes three attempt a partial
  // GPU copy that overflows the old texture dimensions — it throws GL_INVALID_VALUE every
  // frame and takes the rest of the scene down with it. The reference sidesteps this by
  // building a fresh texture per redraw and disposing the previous one; so do we.
  function makeTexture() {
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    // Read from inside the cylinder the surface is mirrored, so flip u back.
    next.wrapS = THREE.ClampToEdgeWrapping;
    next.repeat.x = -1;
    next.offset.x = 1;
    return next;
  }

  let texture = makeTexture();

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    transparent: true,
    alphaTest: 0,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.renderOrder = 10;
  parent.add(mesh);

  let index = 0;
  let shown = 0;
  let phase = 'type';
  let phaseStart = 0;
  let entranceStart = null;
  let started = false;
  let layoutKey = '';
  let baseY = isMobile() ? Y_MOBILE : Y;

  function fontAt(px) {
    return `400 ${Math.round(px)}px ${FONT_STACK}`;
  }

  function measure(text, px) {
    ctx.font = fontAt(px);
    ctx.letterSpacing = LETTER_SPACING;
    return ctx.measureText(text).width;
  }

  // The reference maps the width of "PRODUCT" + gap + "DESIGN" onto 0.92 radians and
  // reuses that pixels-per-radian scale for every other phrase, so ours stay the same
  // visual size as its headline.
  function radiansPerPixel(px) {
    const reference = measure('PRODUCT', px) + GAP_WIDTH + measure('DESIGN', px);
    return (REFERENCE_THETA * (isMobile() ? MOBILE_SCALE : 1)) / reference;
  }

  const probe = new THREE.Vector3();

  // Shrink theta until both ends of the arc project inside the viewport.
  function fitTheta(theta) {
    parent.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    let current = theta;
    for (let i = 0; i < 12; i += 1) {
      let widest = 0;
      for (const sign of [-1, 1]) {
        const angle = Math.PI + (sign * current) / 2;
        probe.set(Math.sin(angle) * RADIUS, Y, Math.cos(angle) * RADIUS);
        parent.localToWorld(probe);
        probe.project(camera);
        widest = Math.max(widest, Math.abs(probe.x));
      }
      if (widest <= LIMIT) break;
      current *= Math.max(0.55, LIMIT / widest);
    }
    return Math.min(theta, current);
  }

  // Lower the strip until its top edge is inside the frustum.
  function fitY(stripHeight) {
    parent.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    let y = isMobile() ? Y_MOBILE : Y;
    for (let i = 0; i < 12; i += 1) {
      probe.set(0, y + stripHeight / 2, -RADIUS);
      parent.localToWorld(probe);
      probe.project(camera);
      if (probe.y <= LIMIT_Y) break;
      y -= Math.max(0.04, (probe.y - LIMIT_Y) * 0.9);
    }
    return y;
  }

  function layout(phrase) {
    const mobile = isMobile();
    const key = `${phrase}|${mobile}|${camera.fov}|${camera.aspect.toFixed(3)}`;
    if (key === layoutKey) return;
    layoutKey = key;

    const textureMultiplier = mobile ? MOBILE_TEXTURE_MULTIPLIER : 1;
    const fontPx = FONT_PX * textureMultiplier;
    const padding = Math.round(TEXTURE_PADDING * textureMultiplier);

    canvas.width = Math.max(2, Math.ceil(measure(phrase, fontPx) + padding * 2));
    canvas.height = Math.round(TEXTURE_HEIGHT * textureMultiplier);
    texture.dispose();
    texture = makeTexture();
    material.map = texture;
    material.needsUpdate = true;

    // One scale for the whole set, computed from the longest phrase, so every phrase
    // renders at the same glyph size. Scaling per-phrase would make longer words
    // visibly lighter than shorter ones.
    const perPixel = radiansPerPixel(FONT_PX);
    let longest = 0;
    for (const candidate of PHRASES) {
      longest = Math.max(longest, measure(candidate, FONT_PX) * perPixel);
    }
    const setScale = longest > 0 ? fitTheta(longest) / longest : 1;

    let thetaLength = Math.max(0.08, measure(phrase, FONT_PX) * perPixel * setScale);
    let stripHeight = STRIP_HEIGHT * (mobile ? MOBILE_SCALE : 1) * setScale;

    // No per-phrase clamp: setScale already guarantees the longest phrase fits, and
    // clamping individually is exactly what made long words render lighter.
    // Reference y = 2.08 assumes its own viewport proportions; on a short or wide one
    // the strip's top edge leaves the frustum. Drop it just enough to stay inside.
    const y = fitY(stripHeight);

    baseY = y;
    mesh.geometry.dispose();
    mesh.geometry = new THREE.CylinderGeometry(
      RADIUS, RADIUS, stripHeight, 96, 1, true,
      Math.PI - thetaLength / 2, thetaLength,
    );
    draw(phrase, shown);
  }

  function draw(phrase, count) {
    const visible = phrase.slice(0, Math.max(0, count));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!visible) {
      texture.needsUpdate = true;
      return;
    }
    const fontPx = FONT_PX * (isMobile() ? MOBILE_TEXTURE_MULTIPLIER : 1);
    ctx.font = fontAt(fontPx);
    ctx.letterSpacing = LETTER_SPACING;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const head = visible.slice(0, -1);
    const tail = visible.slice(-1);
    const y = canvas.height / 2;
    let x = (canvas.width - ctx.measureText(visible).width) / 2;

    ctx.fillStyle = ink;
    ctx.fillText(head, x, y);
    x += ctx.measureText(head).width;
    // The character being typed carries the accent, then settles to ink.
    ctx.fillStyle = phase === 'type' && count < phrase.length ? accent : ink;
    ctx.fillText(tail, x, y);

    texture.needsUpdate = true;
  }

  function update(time) {
    if (!started) {
      started = true;
      phaseStart = time;
      entranceStart = time;
      if (reduceMotion.matches) {
        shown = PHRASES[0].length;
        phase = 'hold';
      }
    }

    const phrase = PHRASES[index];
    layout(phrase);

    // Entrance: rise, settle to full scale, fade in — reference timing.
    const entrance = reduceMotion.matches ? 1 : Math.min(1, (time - entranceStart) / ENTRANCE);
    const eased = easeOutCubic(entrance);
    material.opacity = eased;
    mesh.position.y = THREE.MathUtils.lerp(baseY - ENTRANCE_LIFT, baseY, eased);
    mesh.scale.setScalar(THREE.MathUtils.lerp(ENTRANCE_SCALE, 1, eased));

    if (reduceMotion.matches) return;

    const elapsed = time - phaseStart;
    if (phase === 'type') {
      const next = Math.min(phrase.length, Math.floor(elapsed / TYPE_INTERVAL) + 1);
      if (next !== shown) {
        shown = next;
        draw(phrase, shown);
      }
      if (shown >= phrase.length) {
        phase = 'hold';
        phaseStart = time;
        draw(phrase, shown);
      }
    } else if (phase === 'hold') {
      if (elapsed >= HOLD) {
        phase = 'erase';
        phaseStart = time;
      }
    } else if (phase === 'erase') {
      const next = Math.max(0, phrase.length - Math.floor(elapsed / ERASE_INTERVAL));
      if (next !== shown) {
        shown = next;
        draw(phrase, shown);
      }
      if (shown <= 0) {
        phase = 'gap';
        phaseStart = time;
      }
    } else if (elapsed >= GAP) {
      index = (index + 1) % PHRASES.length;
      shown = 0;
      phase = 'type';
      phaseStart = time;
      layoutKey = '';
    }
  }

  // Anton has to be loaded before the first measurement, or the arc is sized against
  // the fallback face and the text lands at the wrong width.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      layoutKey = '';
      layout(PHRASES[index]);
    });
  }

  function dispose() {
    parent.remove(mesh);
    mesh.geometry.dispose();
    material.dispose();
    texture.dispose();
  }

  return { update, dispose, mesh };
}
