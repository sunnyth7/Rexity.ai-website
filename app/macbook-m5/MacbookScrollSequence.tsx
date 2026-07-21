"use client"

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion"

// A frame is whatever decodes fastest to draw: an ImageBitmap when the
// browser supports it, otherwise a fully-decoded <img>.
type Frame = ImageBitmap | HTMLImageElement

/* ------------------------------------------------------------------ *
 * Config — frames extracted from the source MacBook Pro M5 clip.
 * ------------------------------------------------------------------ */
const FRAME_COUNT = 175
const FRAME_PATH = (i: number) =>
  `/macbook-m5/frames/frame_${String(i + 1).padStart(4, "0")}.webp`

// Native frame aspect (1600 x 894 ≈ 1.79). Used to keep a consistent
// contain-fit box across every device.
const FRAME_ASPECT = 1600 / 894

/* ------------------------------------------------------------------ *
 * Scroll-linked canvas image sequence.
 * ------------------------------------------------------------------ */
export default function MacbookScrollSequence() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const framesRef = useRef<Frame[]>([])

  // Frame state lives in refs so the render loop never causes React re-renders.
  const targetFrameRef = useRef(0) // where the scroll wants us to be (float)
  const currentFrameRef = useRef(0) // where we actually are, eased (float)
  const lastDrawnRef = useRef(-1)
  const loopRef = useRef<number | null>(null)

  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)

  /* ---- Scroll progress over the 400vh track ---- */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Raw scroll → target frame. No spring here: all smoothing happens in the
  // continuous lerp loop below, which stays locked to the display refresh.
  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1])
  useMotionValueEvent(frameIndex, "change", (v) => {
    targetFrameRef.current = v
  })

  /* ---- Canvas drawing (contain-fit, seamless dark backfill) ---- */
  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current
    const img = framesRef.current[index]
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cw = canvas.width
    const ch = canvas.height
    const iw = img.width
    const ih = img.height

    ctx.fillStyle = "#070708"
    ctx.fillRect(0, 0, cw, ch)

    const scale = Math.min(cw / iw, ch / ih)
    const dw = iw * scale
    const dh = ih * scale
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
  }, [])

  /* ---- Resize: size the backing store (DPR-capped) for crisp frames ---- */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const rect = canvas.getBoundingClientRect()
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = "high"
      }
    }
    lastDrawnRef.current = -1
    drawFrame(Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(currentFrameRef.current))))
  }, [drawFrame])

  /* ---- Preload + DECODE every frame, then unlock the animation ---- */
  useEffect(() => {
    let cancelled = false
    let count = 0
    const frames: Frame[] = new Array(FRAME_COUNT)
    framesRef.current = frames
    const supportsBitmap = typeof createImageBitmap === "function"

    // Decode bitmaps no larger than they'll ever be displayed. This caps the
    // pinned memory of 175 frames from ~950 MB (full-res) to a phone-safe
    // budget, and makes each drawImage cheaper. Source is 1600px wide.
    const dprCap = Math.min(window.devicePixelRatio || 1, 1.5)
    const decodeWidth = Math.min(
      1280, // hard ceiling: ~600 MB pinned for 175 frames, plenty sharp here
      Math.max(640, Math.round(window.innerWidth * dprCap)),
    )

    // Decode an <img> fully so its first draw never blocks the main thread.
    const loadAsImage = (i: number) =>
      new Promise<Frame>((resolve) => {
        const img = new Image()
        img.decoding = "async"
        img.src = FRAME_PATH(i)
        const done = () => resolve(img)
        // decode() resolves once the bitmap is ready to paint.
        img.decode().then(done, () => {
          if (img.complete) done()
          else {
            img.onload = done
            img.onerror = done
          }
        })
      })

    // Preferred path: createImageBitmap decodes OFF the main thread.
    const loadOne = async (i: number): Promise<Frame> => {
      if (supportsBitmap) {
        try {
          const res = await fetch(FRAME_PATH(i))
          const blob = await res.blob()
          return await createImageBitmap(blob, {
            resizeWidth: decodeWidth,
            resizeQuality: "high",
          })
        } catch {
          return loadAsImage(i)
        }
      }
      return loadAsImage(i)
    }

    // Bounded-concurrency worker pool keeps the network/CPU saturated but sane.
    let next = 0
    const CONCURRENCY = 8
    const worker = async () => {
      while (!cancelled) {
        const i = next++
        if (i >= FRAME_COUNT) return
        frames[i] = await loadOne(i)
        if (cancelled) return
        count += 1
        setLoaded(count)
      }
    }

    Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
      if (cancelled) return
      setReady(true)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- Continuous render loop: ease current → target every frame ---- */
  useEffect(() => {
    if (!ready) return

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Exponential smoothing — frame-rate-tolerant, no overshoot. ~0.2 reads as
    // a silky Apple-style scrub; higher = snappier, lower = floatier.
    const SMOOTHING = 0.2

    const tick = () => {
      const cur = currentFrameRef.current
      const tgt = targetFrameRef.current
      const delta = tgt - cur
      // Snap when close enough to avoid endless sub-pixel churn.
      const nextVal = Math.abs(delta) < 0.05 ? tgt : cur + delta * SMOOTHING
      currentFrameRef.current = nextVal

      const idx = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(nextVal)))
      if (idx !== lastDrawnRef.current) {
        lastDrawnRef.current = idx
        drawFrame(idx)
      }
      loopRef.current = requestAnimationFrame(tick)
    }
    loopRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (loopRef.current !== null) cancelAnimationFrame(loopRef.current)
    }
  }, [ready, resizeCanvas, drawFrame])

  const progressPct = Math.round((loaded / FRAME_COUNT) * 100)

  return (
    <div ref={containerRef} className="relative h-[400vh] w-full">
      {/* Sticky stage: canvas + text overlays pinned to the viewport */}
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-screen w-full"
          style={{ aspectRatio: String(FRAME_ASPECT) }}
        />

        {/* Story overlays — fade/slide in sync with the scroll */}
        {ready && <StoryOverlays progress={scrollYProgress} />}

        {/* Scroll hint, fades out after the intro */}
        {ready && <ScrollHint progress={scrollYProgress} />}
      </div>

      {/* Loading screen */}
      {!ready && <Loader progressPct={progressPct} />}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Loading state
 * ------------------------------------------------------------------ */
function Loader({ progressPct }: { progressPct: number }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070708]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white/80" />
      <div className="mt-6 font-mono text-xs tracking-[0.3em] text-white/40">
        LOADING {progressPct}%
      </div>
      <div className="mt-3 h-px w-40 overflow-hidden bg-white/10">
        <div
          className="h-full bg-white/60 transition-[width] duration-200 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Scroll hint
 * ------------------------------------------------------------------ */
function ScrollHint({ progress }: { progress: MotionValue<number> }) {
  const opacity = useTransform(progress, [0, 0.06], [1, 0])
  return (
    <motion.div
      style={{ opacity }}
      className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="font-mono text-[10px] tracking-[0.35em] text-white/40">
        SCROLL
      </span>
      <span className="flex h-9 w-5 items-start justify-center rounded-full border border-white/20 p-1">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-white/60"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ *
 * Story overlays — four scroll-synced sections
 * ------------------------------------------------------------------ */
function StoryOverlays({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <Section
        progress={progress}
        range={[0.0, 0.04, 0.12, 0.2]}
        align="center"
        eyebrow="MacBook Pro"
        title={
          <>
            Power, taken
            <br />
            <span className="text-white/40">apart.</span>
          </>
        }
        body="The most advanced chip we've ever built. See what's inside."
      />

      <Section
        progress={progress}
        range={[0.26, 0.34, 0.44, 0.52]}
        align="left"
        eyebrow="M5 Silicon"
        title={
          <>
            Engineered
            <br />
            to the atom.
          </>
        }
        body="A 3-nanometer architecture with a 12-core CPU and a next-generation Neural Engine — every layer deliberate."
      />

      <Section
        progress={progress}
        range={[0.58, 0.66, 0.76, 0.84]}
        align="right"
        eyebrow="Thermal Core"
        title={
          <>
            Fully
            <br />
            exposed.
          </>
        }
        body="A reengineered vapor chamber and unified memory fabric, laid bare. Sustained performance, whisper quiet."
      />

      <Section
        progress={progress}
        range={[0.88, 0.94, 0.999, 1.0]}
        align="center"
        eyebrow="MacBook Pro M5"
        title={
          <>
            It all comes
            <br />
            <span className="text-white/40">together.</span>
          </>
        }
        body=""
        cta="Pre-order now"
      />
    </div>
  )
}

type SectionProps = {
  progress: MotionValue<number>
  // [fadeInStart, fullStart, fullEnd, fadeOutEnd]
  range: [number, number, number, number]
  align: "left" | "center" | "right"
  eyebrow: string
  title: ReactNode
  body: string
  cta?: string
}

function Section({ progress, range, align, eyebrow, title, body, cta }: SectionProps) {
  const [a, b, c, d] = range
  // When a section opens at scroll 0 it must already be fully visible (no
  // fade-in from nothing on first paint).
  const startVisible = a <= 0
  const inputs = startVisible ? [0, c, d] : [a, b, c, d]
  const opacityOut = startVisible ? [1, 1, 0] : [0, 1, 1, 0]
  const yOut = startVisible ? [0, 0, -40] : [40, 0, 0, -40]
  const opacity = useTransform(progress, inputs, opacityOut)
  const y = useTransform(progress, inputs, yOut)

  const alignment =
    align === "center"
      ? "items-center text-center"
      : align === "left"
        ? "items-start text-left"
        : "items-end text-right"

  const padding =
    align === "center"
      ? "px-6"
      : align === "left"
        ? "pl-6 pr-6 sm:pl-16 lg:pl-24"
        : "pr-6 pl-6 sm:pr-16 lg:pr-24"

  return (
    <motion.div
      style={{ opacity, y }}
      className={`absolute inset-0 flex flex-col justify-center ${alignment} ${padding}`}
    >
      <div className="max-w-xl">
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.4em] text-white/40">
          {eyebrow}
        </p>
        <h2 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white/90 sm:text-6xl lg:text-7xl">
          {title}
        </h2>
        {body && (
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
            {body}
          </p>
        )}
        {cta && (
          <button className="pointer-events-auto mt-8 rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.03] active:scale-95">
            {cta}
          </button>
        )}
      </div>
    </motion.div>
  )
}
