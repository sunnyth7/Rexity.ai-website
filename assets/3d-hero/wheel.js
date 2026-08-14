import * as THREE from '/assets/3d-hero/three.module.js';
import { CARDS } from '/assets/3d-hero/cards.js';
import { createHeadline } from '/assets/3d-hero/headline.js';

const RADIUS = 7.2;
// Card width follows the art: the screens are 941x1672 (9:16, aspect 0.5628), so
// 3.02 * 0.5628 = 1.70. Keeping the old 1.34 would have cropped ~21% off each side
// and clipped the UI in every screen.
const CARD_W = 1.70;
const CARD_H = 3.02;
const CARD_R = 0.14;
const CARD_ASPECT = CARD_W / CARD_H;
const FOV_DESKTOP = 34;
// How many cards are visible is N·tan(fov/2)·aspect/π — radius cancels out. A phone's
// narrow aspect put the reference's 46° at ~1.1 cards, which reads as a single screen
// rather than a wheel, so mobile widens the lens and uses the full 26-card ring.
const FOV_MOBILE = 55;
const SPIN_INTRO_DESKTOP = 4.1;
const SPIN_INTRO_MOBILE = 2.5;
const SPIN_IDLE = 0.095;
const SPIN_SETTLE = 3.6;
const DRAG_CLAMP = 6.5;
const DRAG_DAMPING = 1.45;
const TAP_SLOP = 8;   // px of travel still counted as a tap, not a drag
const TAP_TIME = 600; // ms
const TILT_X = -0.075;
const TILT_Y = 0.14;
const PIVOT = new THREE.Vector3(0, -2.44, 5.02);
const PIVOT_LIFT = 0.28;
// The reference desaturates cards completely at rest (saturation 0) because its cards
// are photographic case shots. Ours carry per-service accent colours that need to read
// as a mix, so rest keeps a little over half the colour and hover takes it to full.
const REST = { opacity: 0.62, scale: 1, outlineOpacity: 0.42, outlineThickness: 0.006, saturation: 0.55 };
const HOVER = { opacity: 1, scale: 1.045, outlineOpacity: 0.85, outlineThickness: 0.072, saturation: 1 };

const canvas = document.querySelector('.rx3d-canvas');
const hero = document.querySelector('.rx3d-hero');
const stage = canvas?.parentElement ?? null;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isMobile = () => window.matchMedia('(max-width: 760px)').matches;

function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function cardGeometry() {
  const geometry = new THREE.ShapeGeometry(roundedRectShape(CARD_W, CARD_H, CARD_R), 12);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) + CARD_W / 2) / CARD_W, (uv.getY(i) + CARD_H / 2) / CARD_H);
  }
  uv.needsUpdate = true;
  return geometry;
}

function outlineGeometry(thickness) {
  const outer = roundedRectShape(CARD_W + thickness, CARD_H + thickness, CARD_R + thickness / 2);
  const inner = roundedRectShape(CARD_W - thickness, CARD_H - thickness, Math.max(0.001, CARD_R - thickness / 2));
  outer.holes.push(new THREE.Path(inner.getPoints(48).reverse()));
  return new THREE.ShapeGeometry(outer, 12);
}

function coverFit(texture, imageAspect) {
  if (imageAspect > CARD_ASPECT) {
    const r = CARD_ASPECT / imageAspect;
    texture.repeat.set(r, 1);
    texture.offset.set((1 - r) / 2, 0);
  } else {
    const r = imageAspect / CARD_ASPECT;
    texture.repeat.set(1, r);
    texture.offset.set(0, (1 - r) / 2);
  }
}

function start() {
  if (!canvas || !stage) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    stage.classList.add('rx3d-stage--unavailable');
    return;
  }
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 2.25 : 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV_DESKTOP, 1, 0.1, 100);
  camera.position.set(0, 0, 0);

  const tiltGroup = new THREE.Group();
  const wheel = new THREE.Group();
  tiltGroup.add(wheel);
  scene.add(tiltGroup);

  const geometry = cardGeometry();
  const loader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  // Mobile cards run larger so the band fills the frame instead of leaving empty sky
  // above it; the wider mobile lens keeps two to three of them in view. Desktop cards
  // were 560px tall at 1440x900 (62% of the viewport), which read as oversized once the
  // art went 9:16 and the card widened — 0.72 brings that to about a third.
  const cardScale = isMobile() ? 1.22 : 0.72;

  // Card spacing. The ring has to divide 2π exactly or it would jump as it wraps, so the
  // gap is set by how many cards sit on it rather than by a spacing value. Work out the
  // count that lands closest to the gap we want: GAP_FACTOR shrinks the gap between
  // neighbours to that fraction of its natural size, with the card width held constant.
  const GAP_FACTOR = 0.7;
  const cardWidth = CARD_W * cardScale;
  const baseCount = CARDS.length * 2;
  const naturalStep = (Math.PI * 2 * RADIUS) / baseCount;
  const targetStep = cardWidth + (naturalStep - cardWidth) * GAP_FACTOR;
  let count = Math.max(baseCount, Math.round((Math.PI * 2 * RADIUS) / targetStep));
  // Integer counts are coarse: on mobile the cards are wide enough that one extra card
  // takes the gap from 100% straight down to 43%, well past the target and close to
  // touching. Step back rather than overshoot below ~55%.
  const gapAt = (n) => (Math.PI * 2 * RADIUS) / n - cardWidth;
  const naturalGap = naturalStep - cardWidth;
  while (count > baseCount && gapAt(count) < naturalGap * 0.55) count -= 1;
  const source = Array.from({ length: count }, (_, i) => CARDS[i % CARDS.length]);
  const step = (Math.PI * 2) / source.length;
  const cards = [];
  // 26 meshes share 13 images: cache by URL so mobile uploads 13 textures, not 26.
  const textureCache = new Map();
  const outlineRest = new THREE.Color('#1b2b4d');
  const outlineHover = new THREE.Color('#7c3aed');

  source.forEach((card, index) => {
    const saturation = { value: 0 };
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0,
      side: THREE.DoubleSide,
      transparent: true,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSaturation = saturation;
      shader.fragmentShader = `uniform float uSaturation;\n${shader.fragmentShader}`.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
  float _luma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor.rgb = mix(vec3(_luma), gl_FragColor.rgb, uSaturation);`,
      );
    };
    material.customProgramCacheKey = () => 'rexity-card-saturation';

    let texture = textureCache.get(card.image);
    if (!texture) {
      texture = loader.load(card.image, (loaded) => {
        const image = loaded.image;
        if (image?.width && image?.height) coverFit(loaded, image.width / image.height);
        loaded.needsUpdate = true;
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = maxAnisotropy;
      textureCache.set(card.image, texture);
    }
    material.map = texture;

    const mesh = new THREE.Mesh(geometry, material);
    const outline = new THREE.Mesh(
      outlineGeometry(REST.outlineThickness),
      new THREE.MeshBasicMaterial({ color: outlineRest.clone(), opacity: 0, transparent: true, side: THREE.DoubleSide }),
    );
    outline.position.z = 0.001;
    outline.userData.thickness = REST.outlineThickness;
    outline.userData.colorMix = 0;
    mesh.add(outline);

    const theta = index * step;
    mesh.position.set(Math.sin(theta) * RADIUS, 0, Math.cos(theta) * RADIUS);
    mesh.rotation.y = theta + Math.PI;
    mesh.scale.setScalar(cardScale);
    mesh.userData = { saturation, outline, label: card.title, theta };
    cards.push(mesh);
    wheel.add(mesh);
  });

  // Curved 3D headline shares the tilt group so it moves with the scene but does
  // not spin with the wheel.
  const headline = createHeadline({ parent: tiltGroup, camera, reduceMotion, ink: '#7c3aed', accent: '#4c1d95' });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pivotVector = new THREE.Vector3();
  const clock = new THREE.Clock();

  let angle = 0;
  let velocity = 0;
  let dragVelocity = 0;
  let dragId = null;
  let dragAnchor = 0;
  let dragTime = 0;
  let introStart = null;
  let tiltAmount = 0;
  let presence = 0;
  let hovered = null;
  let selected = null;
  let targetAngle = null;
  let tapStart = null;
  const label = document.querySelector('.rx3d-label');
  let pointerX = 0;
  let pointerY = 0;
  let pointerInside = false;
  let visible = true;
  let frameId = 0;
  let lastTime = 0;
  let disposed = false;

  function resize() {
    const host = stage ?? canvas;
    const { width, height } = host.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const style = getComputedStyle(host);
    const topExtra = Number.parseFloat(style.getPropertyValue('--scene-top-extra')) || 0;
    const bottomExtra = Number.parseFloat(style.getPropertyValue('--scene-bottom-extra')) || 0;
    const renderHeight = height + bottomExtra;
    const viewHeight = Math.max(1, height - topExtra);
    renderer.setSize(width, renderHeight, false);
    camera.fov = width < 600 ? FOV_MOBILE : FOV_DESKTOP;
    camera.aspect = width / viewHeight;
    if (topExtra > 0) camera.setViewOffset(width, viewHeight, 0, -topExtra, width, renderHeight);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -(((clientY - rect.top) / rect.height) * 2 - 1));
    wheel.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(cards, false)[0]?.object ?? null;
  }

  function angleFromPointer(event) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const ndc = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const projected = ndc * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
    return Math.atan2(projected, 1);
  }

  function onPointerDown(event) {
    const value = angleFromPointer(event);
    const hit = pick(event.clientX, event.clientY);
    if (value === null || dragId !== null || !hit) return;
    // A press only becomes a drag once it travels; below the threshold it is a tap.
    tapStart = { x: event.clientX, y: event.clientY, time: performance.now(), mesh: hit };
    dragId = event.pointerId;
    dragAnchor = value + angle;
    dragTime = performance.now();
    dragVelocity = 0;
    velocity = 0;
    hovered = null;
    // Capture can throw if the pointer is no longer active (or is synthetic).
    try { canvas.setPointerCapture(event.pointerId); } catch { /* not capturable */ }
    canvas.classList.add('rx3d-canvas--dragging');
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (event.pointerId !== dragId) {
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerInside = true;
      return;
    }
    const value = angleFromPointer(event);
    if (value === null) return;
    const now = performance.now();
    const elapsed = Math.max(16, now - dragTime);
    const next = dragAnchor - value;
    dragVelocity = ((next - angle) / elapsed) * 1000;
    angle = next;
    dragTime = now;
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (event.pointerId !== dragId) return;
    dragId = null;

    if (tapStart) {
      const travel = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
      const held = performance.now() - tapStart.time;
      if (travel < TAP_SLOP && held < TAP_TIME) {
        selectCard(tapStart.mesh);
        tapStart = null;
        dragVelocity = 0;
        velocity = 0;
        canvas.classList.remove('rx3d-canvas--dragging');
        try { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); } catch { /* already released */ }
        return;
      }
    }
    tapStart = null;

    velocity = THREE.MathUtils.clamp(dragVelocity, -DRAG_CLAMP, DRAG_CLAMP);
    dragVelocity = 0;
    canvas.classList.remove('rx3d-canvas--dragging');
    try { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  }

  function onPointerLeave() {
    pointerInside = false;
    if (dragId === null) {
      hovered = null;
      canvas.classList.remove('rx3d-canvas--hovering');
    }
  }

  function onWheel(event) {
    if (reduceMotion.matches || dragId !== null) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.height === 0) return;
    const local = event.clientY - rect.top;
    if (local < rect.height * 0.36 || local > rect.height * 0.82) return;
    const raw = Math.abs(event.deltaX) > 0.1 ? event.deltaX : event.shiftKey ? event.deltaY : 0;
    if (Math.abs(raw) <= 0.1) return;
    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 18 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerWidth : 1;
    const delta = raw * unit * 7.5e-4;
    angle += delta * 0.35;
    velocity = THREE.MathUtils.clamp(velocity + delta * 7, -DRAG_CLAMP, DRAG_CLAMP);
    event.preventDefault();
  }

  // A card faces the camera when its own angle plus the wheel's rotation reaches PI.
  // Pick the equivalent target nearest the current angle so it takes the short way round.
  function selectCard(mesh) {
    selected = mesh;
    const wanted = Math.PI - mesh.userData.theta;
    const turns = Math.round((angle - wanted) / (Math.PI * 2));
    targetAngle = wanted + turns * Math.PI * 2;
    velocity = 0;
    if (label) {
      label.textContent = mesh.userData.label ?? '';
      label.classList.add('rx3d-label--visible');
    }
  }

  function render() {
    const time = clock.getElapsedTime();
    const delta = Math.min(0.05, Math.max(0, time - lastTime));
    lastTime = time;

    if (!visible || document.hidden) {
      frameId = requestAnimationFrame(render);
      return;
    }
    if (introStart === null) introStart = time;

    const settle = Math.min(1, (time - introStart) / SPIN_SETTLE);
    const eased = 1 - (1 - settle) ** 2;
    const introSpeed = isMobile() ? SPIN_INTRO_MOBILE : SPIN_INTRO_DESKTOP;
    const speed = reduceMotion.matches ? 0 : THREE.MathUtils.lerp(introSpeed, SPIN_IDLE, eased);

    if (targetAngle !== null) {
      angle += (targetAngle - angle) * 0.12;
      if (Math.abs(targetAngle - angle) < 0.002) {
        angle = targetAngle;
        targetAngle = null;
      }
    } else if (dragId === null) {
      angle += (speed + velocity) * delta;
      velocity *= Math.exp(-DRAG_DAMPING * delta);
      if (Math.abs(velocity) < 0.01) velocity = 0;
    }
    wheel.rotation.y = angle;

    const heroStyle = hero ? getComputedStyle(hero) : null;
    const cursorX = (heroStyle && Number.parseFloat(heroStyle.getPropertyValue('--hero-cursor-x'))) || 0;
    const cursorY = (heroStyle && Number.parseFloat(heroStyle.getPropertyValue('--hero-cursor-y'))) || 0;
    const tiltTarget = reduceMotion.matches ? 0 : 1;
    tiltAmount += (tiltTarget - tiltAmount) * 0.022;
    tiltGroup.rotation.x = THREE.MathUtils.lerp(tiltGroup.rotation.x, cursorY * TILT_X * tiltAmount, 0.08);
    tiltGroup.rotation.y = THREE.MathUtils.lerp(tiltGroup.rotation.y, cursorX * TILT_Y * tiltAmount, 0.08);

    pivotVector.copy(PIVOT).applyEuler(tiltGroup.rotation);
    tiltGroup.position.set(
      PIVOT.x - pivotVector.x,
      PIVOT_LIFT + PIVOT.y - pivotVector.y,
      PIVOT.z - pivotVector.z,
    );
    hero?.style.setProperty('--hero-scene-tilt-y', tiltGroup.rotation.x.toFixed(5));

    presence += (1 - presence) * 0.12;

    if (dragId === null && pointerInside) {
      const next = pick(pointerX, pointerY);
      hovered = next;
      canvas.classList.toggle('rx3d-canvas--hovering', next !== null);
    }

    for (const mesh of cards) {
      const active = mesh === hovered || mesh === selected ? 1 : 0;
      const saturation = mesh.userData.saturation;
      const targetSaturation = THREE.MathUtils.lerp(REST.saturation, HOVER.saturation, active) * presence;
      saturation.value += (targetSaturation - saturation.value) * 0.16;

      const material = mesh.material;
      const targetOpacity = THREE.MathUtils.lerp(REST.opacity, HOVER.opacity, active) * presence;
      material.opacity += (targetOpacity - material.opacity) * 0.16;

      const targetScale = cardScale * THREE.MathUtils.lerp(REST.scale, HOVER.scale, active);
      mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.08);

      const outline = mesh.userData.outline;
      const outlineMaterial = outline.material;
      const targetOutline = THREE.MathUtils.lerp(REST.outlineOpacity, HOVER.outlineOpacity, active) * presence;
      outlineMaterial.opacity += (targetOutline - outlineMaterial.opacity) * 0.16;
      outline.userData.colorMix += (active - outline.userData.colorMix) * 0.16;
      outlineMaterial.color.lerpColors(outlineRest, outlineHover, outline.userData.colorMix);

      const targetThickness = THREE.MathUtils.lerp(REST.outlineThickness, HOVER.outlineThickness, active);
      const thickness = outline.userData.thickness;
      const nextThickness = thickness + (targetThickness - thickness) * 0.16;
      if (Math.abs(nextThickness - thickness) > 2e-4) {
        outline.userData.thickness = nextThickness;
        outline.geometry.dispose();
        outline.geometry = outlineGeometry(nextThickness);
      }
    }

    headline.update(time);

    renderer.render(scene, camera);

    if (reduceMotion.matches && presence > 0.995 && hovered === null) return;
    frameId = requestAnimationFrame(render);
  }

  resize();
  stage.classList.add('rx3d-stage--ready');

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting;
      lastTime = clock.getElapsedTime();
    },
    { rootMargin: '180px 0px' },
  );
  observer.observe(canvas);

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(stage);
  window.addEventListener('resize', resize);

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Pause and resume — never tear down. pagehide also fires when the page enters the
  // back/forward cache or the tab is backgrounded, and the page can come back from
  // that; disposing the renderer there killed the scene permanently with no way to
  // restore it. requestAnimationFrame is already throttled while hidden, so pausing is
  // all that is needed.
  function stopLoop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function startLoop() {
    if (frameId || disposed) return;
    lastTime = clock.getElapsedTime();
    frameId = requestAnimationFrame(render);
  }

  startLoop();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else startLoop();
  });
  window.addEventListener('pageshow', startLoop);
  window.addEventListener('pagehide', stopLoop);
}

start();
