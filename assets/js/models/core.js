/*
 * core.js: shared plumbing for the figure models.
 *  - seeded PRNG (mulberry32) and Box–Muller normals
 *  - DPR-aware canvases (capped at 2)
 *  - a global motion switch (prefers-reduced-motion + the Pause toggle)
 *  - Player: runs a finite animation only while on screen and the tab is
 *    visible; with motion off it renders the final frame instead.
 */

export const C = {
  paper: "#F7F5F0",
  surface: "#FFFFFF",
  ink: "#13294B",
  blue: "#1D58A7",
  orange: "#FF5F05",
  orangeText: "#C84113",
  muted: "#4B5870",
  grid: "#E4E1D8",
  faint: "#8A93A6",
};

export const FONT_MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* ---------- randomness ---------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via the Box–Muller transform (uses both outputs).
export function normals(rng) {
  let spare = null;
  return function () {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    let u = 0;
    while (u === 0) u = rng();
    const v = rng();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
}

export const newSeed = () => (Math.random() * 0xffffffff) >>> 0;

/* ---------- maths helpers ---------- */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
};

// Linear-interpolated quantile of a sorted array.
export function quantileSorted(arr, q) {
  const pos = (arr.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.min(arr.length - 1, lo + 1);
  return arr[lo] + (arr[hi] - arr[lo]) * (pos - lo);
}

/* ---------- motion switch ---------- */
const listeners = new Set();
const reduceMQ = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
let paused = false;
try {
  paused = localStorage.getItem("ns-pause") === "1";
} catch (e) {
  /* storage unavailable */
}

export const motion = {
  get reduced() {
    return !!(reduceMQ && reduceMQ.matches);
  },
  get paused() {
    return paused;
  },
  get ok() {
    return !this.reduced && !paused;
  },
  setPaused(v) {
    paused = !!v;
    try {
      localStorage.setItem("ns-pause", paused ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
    listeners.forEach((fn) => fn(this.ok));
  },
  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
if (reduceMQ && reduceMQ.addEventListener) reduceMQ.addEventListener("change", () => listeners.forEach((fn) => fn(motion.ok)));

/* ---------- canvas ---------- */
export function fitCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h, dpr };
}

/*
 * Player drives a model: { reset(seed), render(ctx, w, h, t), duration }.
 * t is elapsed milliseconds; render(duration) must draw the final frame.
 */
export class Player {
  constructor(canvas, model, opts = {}) {
    this.canvas = canvas;
    this.model = model;
    this.opts = opts;
    this.t = 0;
    this.running = false;
    this.started = false;
    this.visible = false;
    this.enabled = opts.enabled !== false; // a hidden case is disabled
    this.raf = 0;
    this.last = 0;
    this.size = fitCanvas(canvas);
    this.model.reset(opts.seed ?? newSeed());

    this.ro = new ResizeObserver(() => {
      this.size = fitCanvas(this.canvas);
      this.draw();
    });
    this.ro.observe(canvas);

    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          this.visible = e.isIntersecting;
          if (this.visible) this.maybeStart();
          else this.halt();
        }
      },
      { threshold: opts.threshold ?? 0.25 }
    );
    this.io.observe(canvas);

    this.offMotion = motion.onChange(() => {
      if (!motion.ok) this.finish();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.halt();
      else this.maybeStart();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.draw());
    this.draw();
  }

  get done() {
    return this.t >= this.model.duration;
  }

  draw() {
    const { ctx, w, h } = this.size;
    ctx.clearRect(0, 0, w, h);
    this.model.render(ctx, w, h, Math.min(this.t, this.model.duration));
    if (this.opts.onDraw) this.opts.onDraw(this);
  }

  maybeStart() {
    if (!this.enabled || !this.visible || document.hidden) return;
    if (!motion.ok) {
      this.finish();
      return;
    }
    if (this.done) return;
    this.started = true;
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const step = (now) => {
      if (!this.running) return;
      this.t += Math.min(64, now - this.last);
      this.last = now;
      this.draw();
      if (this.done) {
        this.running = false;
        if (this.opts.onDone) this.opts.onDone(this);
        return;
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  halt() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  finish() {
    this.halt();
    this.t = this.model.duration;
    this.draw();
  }

  // Start over (optionally with a fresh seed). With motion off, jump to the end.
  replay(seed) {
    this.halt();
    if (seed !== undefined) this.model.reset(seed);
    else if (this.model.restart) this.model.restart();
    this.t = 0;
    if (!motion.ok) {
      this.finish();
      return;
    }
    this.draw();
    this.maybeStart();
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) this.halt();
    else this.maybeStart();
  }
}
