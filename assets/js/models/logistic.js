/*
 * logistic.js: fit y = L / (1 + exp(-k (t - t0))) to noisy synthetic
 * adoption data by minimizing mean squared error with Adam.
 * Every iterate is stored, so the animation replays the real optimization.
 */
import { C, FONT_MONO, rgba, mulberry32, normals, clamp } from "./core.js";

const ITERS = 180;
const sigm = (x) => 1 / (1 + Math.exp(-x));

export function logisticModel(opts = {}) {
  let xs, ys, hist, mse;
  const m = {
    duration: opts.duration ?? 2600,
    readout: "",
    reset(seed) {
      const rng = mulberry32(seed);
      const z = normals(rng);
      const n = 40;
      const L = 0.92 + 0.06 * rng();
      const k = 1.0 + 0.35 * rng();
      const t0 = 4.6 + 1.0 * rng();
      xs = [];
      ys = [];
      for (let i = 0; i < n; i++) {
        const x = ((i + 0.15 + 0.7 * rng()) / n) * 10;
        xs.push(x);
        ys.push(L * sigm(k * (x - t0)) + 0.035 * z());
      }
      // Adam on θ = (L, k, t0), starting from a deliberately poor guess.
      let th = [0.45, 0.25, 2.2];
      const mo = [0, 0, 0];
      const ve = [0, 0, 0];
      const lr = [0.04, 0.06, 0.12];
      const b1 = 0.9;
      const b2 = 0.999;
      hist = [th.slice()];
      mse = [loss(th)];
      for (let it = 1; it <= ITERS; it++) {
        const gr = grad(th);
        for (let j = 0; j < 3; j++) {
          mo[j] = b1 * mo[j] + (1 - b1) * gr[j];
          ve[j] = b2 * ve[j] + (1 - b2) * gr[j] * gr[j];
          const mh = mo[j] / (1 - Math.pow(b1, it));
          const vh = ve[j] / (1 - Math.pow(b2, it));
          th[j] -= (lr[j] * mh) / (Math.sqrt(vh) + 1e-8);
        }
        th[1] = Math.max(0.05, th[1]);
        hist.push(th.slice());
        mse.push(loss(th));
      }
    },
    render(ctx, w, h, t) {
      const pad = { l: 36, r: 14, t: 16, b: 30 };
      const pw = w - pad.l - pad.r;
      const ph = h - pad.t - pad.b;
      const X = (x) => pad.l + (x / 10) * pw;
      const Y = (y) => pad.t + (1 - (y + 0.08) / 1.18) * ph;
      // iteration shown at time t (lingers on the early, informative steps)
      const p = clamp(t / m.duration, 0, 1);
      const iter = t >= m.duration ? ITERS : Math.min(ITERS, Math.round(ITERS * Math.pow(p, 1.7)));
      // grid
      ctx.font = `10.5px ${FONT_MONO}`;
      ctx.lineWidth = 1;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (const v of [0, 0.5, 1]) {
        const y = Math.round(Y(v)) + 0.5;
        ctx.strokeStyle = rgba(C.ink, v === 0 ? 0.25 : 0.07);
        ctx.setLineDash(v === 0 ? [] : [2, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(pad.l + pw, y);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.fillText(v.toFixed(1), pad.l - 8, y);
      }
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let x = 0; x <= 10; x += 2) {
        ctx.fillStyle = C.muted;
        ctx.fillText(String(x), X(x), pad.t + ph + 9);
      }
      // axis titles sit inside the empty corners of the plot
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("adoption ↑", pad.l + 8, pad.t + 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("time →", pad.l + pw - 4, pad.t + ph - 8);

      const curve = (th) => {
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const x = (i / 80) * 10;
          const y = th[0] * sigm(th[1] * (x - th[2]));
          if (i === 0) ctx.moveTo(X(x), Y(y));
          else ctx.lineTo(X(x), Y(y));
        }
      };
      // ghosts of earlier iterates
      ctx.lineWidth = 1;
      for (let j = 0; j < iter; j += 12) {
        curve(hist[j]);
        ctx.strokeStyle = rgba(C.blue, 0.13);
        ctx.stroke();
      }
      const th = hist[iter];
      // residuals
      ctx.strokeStyle = rgba(C.ink, 0.18);
      ctx.beginPath();
      for (let i = 0; i < xs.length; i++) {
        const yh = th[0] * sigm(th[1] * (xs[i] - th[2]));
        ctx.moveTo(X(xs[i]), Y(ys[i]));
        ctx.lineTo(X(xs[i]), Y(yh));
      }
      ctx.stroke();
      // data
      for (let i = 0; i < xs.length; i++) {
        ctx.beginPath();
        ctx.arc(X(xs[i]), Y(ys[i]), 3, 0, Math.PI * 2);
        ctx.fillStyle = C.surface;
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = C.ink;
        ctx.stroke();
      }
      // current fit
      curve(th);
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.orange;
      ctx.stroke();
      // inflection point t0
      if (th[2] > 0 && th[2] < 10) {
        const x0 = X(th[2]);
        const y0 = Y(th[0] / 2);
        ctx.setLineDash([2, 3]);
        ctx.strokeStyle = rgba(C.orange, 0.6);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0, pad.t + ph);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.orangeText;
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText("t₀", x0 + 5, pad.t + ph - 4);
      }
      m.readout = `iter ${String(iter).padStart(3, " ")} · MSE ${mse[iter].toFixed(4)} · k ${th[1].toFixed(2)}`;
    },
  };

  function loss(th) {
    let s = 0;
    for (let i = 0; i < xs.length; i++) {
      const r = th[0] * sigm(th[1] * (xs[i] - th[2])) - ys[i];
      s += r * r;
    }
    return s / xs.length;
  }
  function grad(th) {
    const g = [0, 0, 0];
    const n = xs.length;
    for (let i = 0; i < n; i++) {
      const s = sigm(th[1] * (xs[i] - th[2]));
      const r = th[0] * s - ys[i];
      const ds = s * (1 - s);
      g[0] += (2 * r * s) / n;
      g[1] += (2 * r * th[0] * ds * (xs[i] - th[2])) / n;
      g[2] += (2 * r * th[0] * ds * -th[1]) / n;
    }
    return g;
  }
  return m;
}
