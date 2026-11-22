/*
 * kmeans.js: Lloyd's algorithm, k = 3, on three Gaussian blobs.
 * Centroids start at random data points (Forgy initialization); every
 * assignment / update step is recorded and replayed.
 */
import { C, FONT_MONO, rgba, mulberry32, normals, clamp, ease, lerp } from "./core.js";

const K = 3;
const COLORS = [C.blue, C.orange, C.ink];
const STEP_MS = 520;

export function kmeansModel(opts = {}) {
  let pts, steps; // steps: [{ cent: [[x,y]...], assign: Int8Array, inertia }]
  const m = {
    duration: 3000,
    readout: "",
    reset(seed) {
      const rng = mulberry32(seed);
      const z = normals(rng);
      const centers = [
        [0.24 + 0.06 * rng(), 0.3 + 0.08 * rng()],
        [0.74 + 0.06 * rng(), 0.3 + 0.08 * rng()],
        [0.5 + 0.06 * rng(), 0.74 + 0.06 * rng()],
      ];
      pts = [];
      for (let c = 0; c < K; c++)
        for (let i = 0; i < 40; i++) pts.push([centers[c][0] + 0.085 * z(), centers[c][1] + 0.085 * z()]);
      // Forgy init. Run several restarts, keep those that reach the best
      // inertia, and replay the one with the most instructive length.
      const runs = Array.from({ length: 10 }, () => lloyd(pts, rng));
      const fin = (r) => r[r.length - 1].inertia;
      const bestI = Math.min(...runs.map(fin));
      const good = runs.filter((r) => fin(r) <= bestI * 1.005);
      good.sort((a, b) => Math.abs(a.length - 6) - Math.abs(b.length - 6));
      const best = good[0];
      steps = best;
      m.duration = 500 + (steps.length - 1) * STEP_MS + 300;
    },
    render(ctx, w, h, t) {
      const pad = 22;
      const padX = Math.max(22, (w - (h - 2 * pad) * 1.7) / 2);
      const X = (x) => padX + x * (w - 2 * padX);
      const Y = (y) => pad + y * (h - 2 * pad);
      // faint frame grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(C.ink, 0.06);
      ctx.setLineDash([2, 4]);
      for (let g = 0; g <= 4; g++) {
        ctx.beginPath();
        ctx.moveTo(X(g / 4), Y(0));
        ctx.lineTo(X(g / 4), Y(1));
        ctx.moveTo(X(0), Y(g / 4));
        ctx.lineTo(X(1), Y(g / 4));
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // timeline: 500ms of raw points, then one Lloyd step per STEP_MS
      const tt = Math.max(0, t - 500);
      const last = steps.length - 1;
      const si = t < 500 ? -1 : Math.min(last, Math.floor(tt / STEP_MS));
      const frac = t < 500 ? 0 : si >= last ? 1 : clamp((tt - si * STEP_MS) / STEP_MS, 0, 1);
      const done = t >= m.duration;

      // centroid positions, gliding from step si to si+1 in the 2nd half of a step
      const cur = steps[Math.max(0, si)];
      const nxt = steps[Math.min(last, Math.max(0, si) + 1)];
      const glide = si < 0 ? 0 : ease.inOutCubic(clamp((frac - 0.35) / 0.65, 0, 1));
      const cent = cur.cent.map((c, k) => [lerp(c[0], nxt.cent[k][0], glide), lerp(c[1], nxt.cent[k][1], glide)]);
      const assign = cur.assign;
      const spokeA = si < 0 ? 0 : done ? 0.16 : 0.22 * Math.sin(Math.PI * Math.min(1, frac * 1.2));

      // spokes: point -> its centroid
      if (si >= 0) {
        for (let k = 0; k < K; k++) {
          ctx.strokeStyle = rgba(COLORS[k], Math.max(spokeA, 0.08));
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            if (assign[i] !== k) continue;
            ctx.moveTo(X(pts[i][0]), Y(pts[i][1]));
            ctx.lineTo(X(cent[k][0]), Y(cent[k][1]));
          }
          ctx.stroke();
        }
      }
      // points
      const appear = clamp(t / 450, 0, 1);
      for (let i = 0; i < pts.length; i++) {
        const a = clamp(appear * 1.6 - (i / pts.length) * 0.6, 0, 1);
        if (a <= 0) continue;
        ctx.beginPath();
        ctx.arc(X(pts[i][0]), Y(pts[i][1]), 3.1, 0, Math.PI * 2);
        if (si < 0) {
          ctx.fillStyle = rgba(C.faint, 0.55 * a);
          ctx.fill();
        } else {
          ctx.fillStyle = rgba(COLORS[assign[i]], 0.85);
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = rgba(C.surface, 0.9);
          ctx.stroke();
        }
      }
      // centroid trails + markers
      if (si >= 0) {
        for (let k = 0; k < K; k++) {
          ctx.strokeStyle = rgba(COLORS[k], 0.5);
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(X(steps[0].cent[k][0]), Y(steps[0].cent[k][1]));
          for (let j = 1; j <= Math.max(0, si); j++) ctx.lineTo(X(steps[j].cent[k][0]), Y(steps[j].cent[k][1]));
          ctx.lineTo(X(cent[k][0]), Y(cent[k][1]));
          ctx.stroke();
          ctx.setLineDash([]);
          const cx = X(cent[k][0]);
          const cy = Y(cent[k][1]);
          ctx.beginPath();
          ctx.arc(cx, cy, 9, 0, Math.PI * 2);
          ctx.fillStyle = C.surface;
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = COLORS[k];
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 5, cy);
          ctx.lineTo(cx + 5, cy);
          ctx.moveTo(cx, cy - 5);
          ctx.lineTo(cx, cy + 5);
          ctx.stroke();
        }
      }
      if (done) {
        ctx.font = `10.5px ${FONT_MONO}`;
        ctx.fillStyle = C.muted;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText("converged: assignments unchanged", w - 12, h - 8);
      }
      const shown = si < 0 ? 0 : si;
      m.readout = si < 0 ? "init · k = 3" : `iter ${shown} · inertia ${steps[shown].inertia.toFixed(3)}`;
    },
  };
  return m;
}

function lloyd(pts, rng) {
  const n = pts.length;
  const pick = new Set();
  while (pick.size < K) pick.add(Math.floor(rng() * n));
  let cent = [...pick].map((i) => pts[i].slice());
  const out = [];
  let prev = null;
  for (let it = 0; it < 30; it++) {
    const assign = new Int8Array(n);
    let inertia = 0;
    for (let i = 0; i < n; i++) {
      let bd = Infinity;
      for (let k = 0; k < K; k++) {
        const d = (pts[i][0] - cent[k][0]) ** 2 + (pts[i][1] - cent[k][1]) ** 2;
        if (d < bd) {
          bd = d;
          assign[i] = k;
        }
      }
      inertia += bd;
    }
    out.push({ cent: cent.map((c) => c.slice()), assign, inertia });
    if (prev && prev.every((v, i) => v === assign[i])) break;
    prev = assign;
    const sum = Array.from({ length: K }, () => [0, 0, 0]);
    for (let i = 0; i < n; i++) {
      sum[assign[i]][0] += pts[i][0];
      sum[assign[i]][1] += pts[i][1];
      sum[assign[i]][2]++;
    }
    cent = sum.map((s, k) => (s[2] ? [s[0] / s[2], s[1] / s[2]] : cent[k]));
  }
  return out;
}
