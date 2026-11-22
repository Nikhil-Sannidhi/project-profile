/*
 * montecarlo.js
 *  gbmModel:    geometric Brownian motion, S(t+dt) = S(t)·exp((μ − σ²/2)dt + σ√dt·Z),
 *               Z ~ N(0,1) from Box–Muller on a seeded PRNG. Draws paths, the
 *               5–95% band and the median; supports a hover crosshair.
 *  bridgeModel: Brownian bridges in log space from scattered starts to one
 *               endpoint, so the band narrows to zero at t = T (Fig. 7).
 */
import { C, FONT_MONO, rgba, mulberry32, normals, quantileSorted, ease, clamp } from "./core.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function quantiles(paths, n, steps, qs) {
  const out = qs.map(() => new Float64Array(steps + 1));
  const col = new Float64Array(n);
  for (let s = 0; s <= steps; s++) {
    for (let i = 0; i < n; i++) col[i] = paths[i * (steps + 1) + s];
    col.sort();
    qs.forEach((q, k) => (out[k][s] = quantileSorted(col, q)));
  }
  return out;
}

function drawPathsUpTo(ctx, paths, n, steps, X, Y, idx, style) {
  const whole = Math.floor(idx);
  const frac = idx - whole;
  ctx.lineWidth = style.width;
  ctx.strokeStyle = style.color;
  ctx.lineJoin = "round";
  for (let i = 0; i < n; i++) {
    const o = i * (steps + 1);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(paths[o]));
    for (let s = 1; s <= whole; s++) ctx.lineTo(X(s), Y(paths[o + s]));
    if (frac > 0 && whole < steps) {
      const a = paths[o + whole];
      const b = paths[o + whole + 1];
      ctx.lineTo(X(whole + frac), Y(a + (b - a) * frac));
    }
    ctx.stroke();
  }
}

function lineUpTo(ctx, arr, steps, X, Y, idx) {
  const whole = Math.floor(idx);
  const frac = idx - whole;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(arr[0]));
  for (let s = 1; s <= whole; s++) ctx.lineTo(X(s), Y(arr[s]));
  if (frac > 0 && whole < steps) ctx.lineTo(X(whole + frac), Y(arr[whole] + (arr[whole + 1] - arr[whole]) * frac));
}

function bandUpTo(ctx, lo, hi, steps, X, Y, idx) {
  const whole = Math.floor(idx);
  const frac = idx - whole;
  const end = whole < steps ? whole + frac : steps;
  const at = (arr, s) => {
    const w = Math.floor(s);
    const f = s - w;
    return w >= steps ? arr[steps] : arr[w] + (arr[w + 1] - arr[w]) * f;
  };
  ctx.beginPath();
  ctx.moveTo(X(0), Y(hi[0]));
  for (let s = 1; s <= whole; s++) ctx.lineTo(X(s), Y(hi[s]));
  ctx.lineTo(X(end), Y(at(hi, end)));
  ctx.lineTo(X(end), Y(at(lo, end)));
  for (let s = whole; s >= 0; s--) ctx.lineTo(X(s), Y(lo[s]));
  ctx.closePath();
}

/* ======================================================================= */

export function gbmModel(opts = {}) {
  const n = opts.n ?? 250;
  const years = opts.years ?? [2022, 2030];
  const T = years[1] - years[0];
  const steps = T * 12; // monthly
  const dt = T / steps;
  const mu = opts.mu ?? 0.08;
  const sigma = opts.sigma ?? 0.25;
  const s0 = 100;
  const yDomain = [25, 800]; // ~1st–99th percentile at T = 8, fixed so re-runs share axes
  const ticks = [25, 50, 100, 200, 400, 800];
  let paths, q05, q50, q95, seed;
  let hover = null; // { step, path }
  let cache = null; // offscreen final frame
  let geom = null;

  const m = {
    duration: opts.duration ?? 1600,
    n,
    steps,
    get seed() {
      return seed;
    },
    reset(s) {
      seed = s >>> 0;
      const rng = mulberry32(seed);
      const z = normals(rng);
      paths = new Float64Array(n * (steps + 1));
      const drift = (mu - 0.5 * sigma * sigma) * dt;
      const vol = sigma * Math.sqrt(dt);
      for (let i = 0; i < n; i++) {
        const o = i * (steps + 1);
        let v = s0;
        paths[o] = v;
        for (let k = 1; k <= steps; k++) {
          v *= Math.exp(drift + vol * z());
          paths[o + k] = v;
        }
      }
      [q05, q50, q95] = quantiles(paths, n, steps, [0.05, 0.5, 0.95]);
      cache = null;
      hover = null;
    },
    layout(w, h) {
      const pad = { l: 8, r: 40, t: 18, b: 30 };
      const pw = w - pad.l - pad.r;
      const ph = h - pad.t - pad.b;
      const ly0 = Math.log(yDomain[0]);
      const ly1 = Math.log(yDomain[1]);
      const X = (s) => pad.l + (s / steps) * pw;
      const Y = (v) => pad.t + (1 - (Math.log(Math.max(v, 1e-6)) - ly0) / (ly1 - ly0)) * ph;
      const Yinv = (py) => Math.exp(ly0 + (1 - (py - pad.t) / ph) * (ly1 - ly0));
      geom = { pad, pw, ph, X, Y, Yinv, w, h };
      return geom;
    },
    // Map a pointer position (CSS px within the canvas) to a hover state.
    pointer(px, py) {
      if (!geom) return null;
      const { pad, pw, Yinv } = geom;
      if (px < pad.l || px > pad.l + pw + 6) {
        hover = null;
        return null;
      }
      const step = clamp(Math.round(((px - pad.l) / pw) * steps), 0, steps);
      const target = Math.log(Yinv(py));
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(Math.log(paths[i * (steps + 1) + step]) - target);
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      hover = { step, path: best };
      const yr = years[0] + step / 12;
      const y = Math.floor(yr + 1e-9);
      const mo = Math.round((yr - y) * 12) % 12;
      return {
        label: `${MONTHS[mo]} ${y}`,
        p5: q05[step],
        p50: q50[step],
        p95: q95[step],
        x: geom.X(step),
        y50: geom.Y(q50[step]),
      };
    },
    clearPointer() {
      hover = null;
    },
    render(ctx, w, h, t) {
      const g = geom && geom.w === w && geom.h === h ? geom : m.layout(w, h);
      const done = t >= m.duration;
      if (done && cache && cache.w === w && cache.h === h) {
        ctx.drawImage(cache.canvas, 0, 0, w, h);
      } else {
        const p = ease.inOutCubic(clamp(t / m.duration, 0, 1));
        drawBase(ctx, g, p * steps);
        if (done) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const off = document.createElement("canvas");
          off.width = Math.round(w * dpr);
          off.height = Math.round(h * dpr);
          off.getContext("2d").drawImage(ctx.canvas, 0, 0);
          cache = { canvas: off, w, h };
        }
      }
      if (done && hover) drawHover(ctx, g);
    },
  };

  function drawAxes(ctx, g) {
    const { pad, pw, ph, X, Y } = g;
    ctx.font = `10.5px ${FONT_MONO}`;
    ctx.lineWidth = 1;
    // horizontal grid on the log scale
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (const v of ticks) {
      const y = Math.round(Y(v)) + 0.5;
      ctx.strokeStyle = rgba(C.ink, v === 100 ? 0.16 : 0.07);
      ctx.setLineDash(v === 100 ? [] : [2, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + pw, y);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillText(String(v), pad.l + pw + 8, y);
    }
    ctx.setLineDash([]);
    // year ticks
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let yr = years[0]; yr <= years[1]; yr++) {
      const x = Math.round(X((yr - years[0]) * 12)) + 0.5;
      ctx.strokeStyle = rgba(C.ink, 0.18);
      ctx.beginPath();
      ctx.moveTo(x, pad.t + ph);
      ctx.lineTo(x, pad.t + ph + 4);
      ctx.stroke();
      const narrow = g.w < 420;
      if (!narrow || (yr - years[0]) % 2 === 0) {
        ctx.fillStyle = C.muted;
        ctx.textAlign = yr === years[0] ? "left" : yr === years[1] ? "right" : "center";
        ctx.fillText(narrow ? `'${String(yr).slice(2)}` : String(yr), x, pad.t + ph + 9);
      }
    }
    ctx.strokeStyle = rgba(C.ink, 0.3);
    ctx.beginPath();
    ctx.moveTo(pad.l, Math.round(pad.t + ph) + 0.5);
    ctx.lineTo(pad.l + pw, Math.round(pad.t + ph) + 0.5);
    ctx.stroke();
    // 2026 marker: Frisco -> Champaign
    const x26 = Math.round(X((2026 - years[0]) * 12 + 7)) + 0.5;
    ctx.strokeStyle = rgba(C.orange, 0.55);
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x26, pad.t + 14);
    ctx.lineTo(x26, pad.t + ph);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.orangeText;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Gies →", x26 + 5, pad.t + 2);
  }

  function drawBase(ctx, g, idx) {
    const { X, Y, pad, pw, ph } = g;
    drawAxes(ctx, g);
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw, ph);
    ctx.clip();
    // band
    bandUpTo(ctx, q05, q95, steps, X, Y, idx);
    ctx.fillStyle = rgba(C.ink, 0.055);
    ctx.fill();
    // paths
    drawPathsUpTo(ctx, paths, n, steps, X, Y, idx, { color: rgba(C.blue, 0.085), width: 0.8 });
    // band edges
    ctx.setLineDash([2, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(C.ink, 0.35);
    lineUpTo(ctx, q05, steps, X, Y, idx);
    ctx.stroke();
    lineUpTo(ctx, q95, steps, X, Y, idx);
    ctx.stroke();
    ctx.setLineDash([]);
    // median
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.orange;
    lineUpTo(ctx, q50, steps, X, Y, idx);
    ctx.stroke();
    ctx.restore();
    // head
    const s = Math.min(idx, steps);
    const w0 = Math.floor(s);
    const v = w0 >= steps ? q50[steps] : q50[w0] + (q50[w0 + 1] - q50[w0]) * (s - w0);
    ctx.fillStyle = C.orange;
    ctx.beginPath();
    ctx.arc(X(s), Y(v), 3.2, 0, Math.PI * 2);
    ctx.fill();
    // band labels at the right end
    if (idx >= steps) {
      ctx.font = `10px ${FONT_MONO}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = C.muted;
      ctx.fillText("p95", X(steps) - 6, Y(q95[steps]) - 3);
      ctx.textBaseline = "top";
      ctx.fillText("p5", X(steps) - 6, Y(q05[steps]) + 3);
      ctx.fillStyle = C.orangeText;
      ctx.textBaseline = "bottom";
      ctx.fillText("median", X(steps) - 8, Y(q50[steps]) - 5);
    }
  }

  function drawHover(ctx, g) {
    const { X, Y, pad, ph, pw } = g;
    const s = hover.step;
    const x = Math.round(X(s)) + 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw, ph);
    ctx.clip();
    // the path nearest the pointer: "a possible future"
    const o = hover.path * (steps + 1);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(paths[o]));
    for (let k = 1; k <= steps; k++) ctx.lineTo(X(k), Y(paths[o + k]));
    ctx.strokeStyle = rgba(C.ink, 0.75);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = rgba(C.ink, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, pad.t);
    ctx.lineTo(x, pad.t + ph);
    ctx.stroke();
    for (const [arr, col, r] of [
      [q95, C.ink, 3],
      [q05, C.ink, 3],
      [q50, C.orange, 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x, Y(arr[s]), r, 0, Math.PI * 2);
      ctx.fillStyle = C.surface;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = col;
      ctx.stroke();
    }
  }

  return m;
}

/* ======================================================================= */

export function bridgeModel(opts = {}) {
  const n = opts.n ?? 120;
  const steps = opts.steps ?? 90;
  const sigma = opts.sigma ?? 0.55;
  let paths, q05, q50, q95;
  const m = {
    duration: opts.duration ?? 1900,
    reset(seed) {
      const rng = mulberry32(seed);
      const z = normals(rng);
      paths = new Float64Array(n * (steps + 1));
      const dt = 1 / steps;
      const w = new Float64Array(steps + 1);
      for (let i = 0; i < n; i++) {
        const a = 0.9 * z(); // scattered start (log units)
        w[0] = 0;
        for (let k = 1; k <= steps; k++) w[k] = w[k - 1] + Math.sqrt(dt) * z();
        for (let k = 0; k <= steps; k++) {
          const u = k / steps;
          // Brownian bridge from a to 0: (1-u)a + σ(W_u − u·W_1)
          paths[i * (steps + 1) + k] = (1 - u) * a + sigma * (w[k] - u * w[steps]);
        }
      }
      [q05, q50, q95] = quantiles(paths, n, steps, [0.05, 0.5, 0.95]);
    },
    render(ctx, w, h, t) {
      const pad = { l: 10, r: 30, t: 18, b: 30 };
      const pw = w - pad.l - pad.r;
      const ph = h - pad.t - pad.b;
      const X = (s) => pad.l + (s / steps) * pw;
      const Y = (v) => pad.t + ph / 2 - (v / 2.6) * (ph / 2);
      const p = ease.inOutCubic(clamp(t / m.duration, 0, 1));
      const idx = p * steps;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, pad.t - 6, w, ph + 12);
      ctx.clip();
      bandUpTo(ctx, q05, q95, steps, X, Y, idx);
      ctx.fillStyle = rgba(C.ink, 0.05);
      ctx.fill();
      drawPathsUpTo(ctx, paths, n, steps, X, Y, idx, { color: rgba(C.blue, 0.11), width: 0.8 });
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.orange;
      lineUpTo(ctx, q50, steps, X, Y, idx);
      ctx.stroke();
      ctx.restore();
      // axis
      ctx.strokeStyle = rgba(C.ink, 0.25);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, Math.round(pad.t + ph) + 0.5);
      ctx.lineTo(pad.l + pw, Math.round(pad.t + ph) + 0.5);
      ctx.stroke();
      ctx.font = `10.5px ${FONT_MONO}`;
      ctx.fillStyle = C.muted;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText("t = 0 · today", pad.l, pad.t + ph + 9);
      ctx.textAlign = "right";
      ctx.fillText("t = T · a conversation", pad.l + pw, pad.t + ph + 9);
      // the endpoint
      if (p >= 1) {
        const x = X(steps);
        const y = Y(0);
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fillStyle = rgba(C.orange, 0.14);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = C.orange;
        ctx.fill();
      }
    },
  };
  return m;
}
