/*
 * nn.js: a 6-5-4 feed-forward network (tanh hidden layer, sigmoid outputs),
 * trained in the browser by full-batch gradient descent on the skill-to-goal
 * relevance table in content.js. The SVG draws the trained weights; hovering
 * or focusing a node runs a real forward (or backward-attribution) pass.
 */
import { mulberry32, normals, motion } from "./core.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

export function train(skills, goals, hidden = 5, epochs = 6000, seed = 7) {
  const nI = skills.length;
  const nO = goals.length;
  const rng = mulberry32(seed);
  const z = normals(rng);
  const W1 = Array.from({ length: hidden }, () => Array.from({ length: nI }, () => z() * 0.7));
  const b1 = new Array(hidden).fill(0);
  const W2 = Array.from({ length: nO }, () => Array.from({ length: hidden }, () => z() * 0.7));
  const b2 = new Array(nO).fill(0);
  const T = skills.map((s) => goals.map((g) => s.relevance[g.id] ?? 0));
  const lr = 0.9;
  const fwd = (i) => {
    const h = W1.map((row, j) => Math.tanh(row[i] + b1[j]));
    const y = W2.map((row, k) => 1 / (1 + Math.exp(-(row.reduce((a, w, j) => a + w * h[j], 0) + b2[k]))));
    return { h, y };
  };
  let loss = 0;
  for (let ep = 0; ep < epochs; ep++) {
    const gW1 = W1.map((r) => r.map(() => 0));
    const gb1 = b1.map(() => 0);
    const gW2 = W2.map((r) => r.map(() => 0));
    const gb2 = b2.map(() => 0);
    loss = 0;
    for (let i = 0; i < nI; i++) {
      const { h, y } = fwd(i);
      const dy = y.map((v, k) => (2 * (v - T[i][k]) * v * (1 - v)) / nI);
      y.forEach((v, k) => (loss += (v - T[i][k]) ** 2 / (nI * nO)));
      const dh = h.map((hv, j) => dy.reduce((a, d, k) => a + d * W2[k][j], 0) * (1 - hv * hv));
      dy.forEach((d, k) => {
        gb2[k] += d;
        h.forEach((hv, j) => (gW2[k][j] += d * hv));
      });
      dh.forEach((d, j) => {
        gb1[j] += d;
        gW1[j][i] += d; // one-hot input
      });
    }
    W1.forEach((r, j) => r.forEach((_, i) => (r[i] -= lr * gW1[j][i])));
    W2.forEach((r, k) => r.forEach((_, j) => (r[j] -= lr * gW2[k][j])));
    b1.forEach((_, j) => (b1[j] -= lr * gb1[j]));
    b2.forEach((_, k) => (b2[k] -= lr * gb2[k]));
  }
  return { W1, b1, W2, b2, fwd, loss };
}

export function initNN(root, { skills, goals }) {
  const net = train(skills, goals);
  const out = skills.map((_, i) => net.fwd(i));
  const H = net.W1.length;
  const svgHost = root.querySelector(".nn-svg");
  const note = root.querySelector(".nn-note");
  const lossEl = root.querySelector("[data-nn-loss]");
  if (lossEl) lossEl.textContent = `6 → 5 → 4 · trained · MSE ${net.loss < 1e-3 ? net.loss.toExponential(1) : net.loss.toFixed(4)}`;
  const defaultNote = note ? note.innerHTML : "";
  let pulsed = false;
  let lastW = 0;
  let parts = null;

  function build() {
    const w = Math.round(svgHost.getBoundingClientRect().width);
    if (!w || w === lastW) return;
    lastW = w;
    const wide = w >= 620;
    const Lw = wide ? 178 : 104;
    const Rw = wide ? 150 : 140;
    const gap = wide ? 54 : 46;
    const top = 26;
    const hgt = top * 2 + gap * (skills.length - 1);
    const xI = Lw + 12;
    const xO = w - Rw - 12;
    const xH = (xI + xO) / 2;
    const yAt = (i, n) => top + ((skills.length - 1) * gap) / 2 + (i - (n - 1) / 2) * gap * (n === H ? 1.1 : n === goals.length ? 1.25 : 1);
    svgHost.innerHTML = "";
    const svg = el("svg", { viewBox: `0 0 ${w} ${hgt}`, width: w, height: hgt, class: "nn-graph", role: "group", "aria-label": "Neural network: skills on the left feed a hidden layer that feeds goals on the right. Each node is focusable." });
    svgHost.appendChild(svg);
    const gE = el("g", { class: "nn-edges" }, svg);
    const gP = el("g", { class: "nn-pulses", "aria-hidden": "true" }, svg);
    const gN = el("g", { class: "nn-nodes" }, svg);
    const P = {
      I: skills.map((_, i) => [xI, yAt(i, skills.length)]),
      H: Array.from({ length: H }, (_, j) => [xH, yAt(j, H)]),
      O: goals.map((_, k) => [xO, yAt(k, goals.length)]),
    };
    const max1 = Math.max(...net.W1.flat().map(Math.abs));
    const max2 = Math.max(...net.W2.flat().map(Math.abs));
    const e1 = [];
    const e2 = [];
    net.W1.forEach((row, j) =>
      row.forEach((wv, i) => {
        const a = Math.abs(wv) / max1;
        const line = el("line", { x1: P.I[i][0], y1: P.I[i][1], x2: P.H[j][0], y2: P.H[j][1], class: `nn-edge ${wv >= 0 ? "pos" : "neg"}`, style: `--a:${(0.1 + 0.45 * a).toFixed(3)};--sw:${(0.6 + 1.8 * a).toFixed(2)}px` }, gE);
        e1.push({ line, i, j, wv });
      })
    );
    net.W2.forEach((row, k) =>
      row.forEach((wv, j) => {
        const a = Math.abs(wv) / max2;
        const line = el("line", { x1: P.H[j][0], y1: P.H[j][1], x2: P.O[k][0], y2: P.O[k][1], class: `nn-edge ${wv >= 0 ? "pos" : "neg"}`, style: `--a:${(0.1 + 0.45 * a).toFixed(3)};--sw:${(0.6 + 1.8 * a).toFixed(2)}px` }, gE);
        e2.push({ line, j, k, wv });
      })
    );
    const node = (x, y, r, cls, label) => {
      const g = el("g", { class: `nn-node ${cls}`, tabindex: "0", role: "button", "aria-label": label }, gN);
      el("circle", { cx: x, cy: y, r: r + 10, class: "nn-hit" }, g);
      el("circle", { cx: x, cy: y, r, class: "nn-dot" }, g);
      return g;
    };
    const nI = skills.map((s, i) => {
      const g = node(P.I[i][0], P.I[i][1], 6.5, "in" + (s.editable ? " editable" : ""), `${s.name}. Show which goals it feeds.`);
      const t = el("text", { x: P.I[i][0] - 16, y: P.I[i][1], class: "nn-label", "text-anchor": "end", "dominant-baseline": "central" }, g);
      t.textContent = wide ? s.name : s.short || s.name;
      return g;
    });
    const nH = P.H.map((p, j) => {
      const g = node(p[0], p[1], 5.5, "hid", `Hidden unit ${j + 1}.`);
      const t = el("text", { x: p[0], y: p[1] - 13, class: "nn-sub", "text-anchor": "middle" }, g);
      t.textContent = `h${j + 1}`;
      return g;
    });
    const vals = [];
    const nO = goals.map((gl, k) => {
      const g = node(P.O[k][0], P.O[k][1], 8.5, "out", `${gl.name}. Show which skills feed it.`);
      const t = el("text", { x: P.O[k][0] + 18, y: P.O[k][1] - 2, class: "nn-label", "dominant-baseline": "auto" }, g);
      t.textContent = gl.name;
      const v = el("text", { x: P.O[k][0] + 18, y: P.O[k][1] + 13, class: "nn-val" }, g);
      v.textContent = "ŷ = –";
      vals.push(v);
      return g;
    });
    // layer captions
    if (wide) {
      [["skills · x", xI, "end", -16], ["hidden · tanh", xH, "middle", 0], ["goals · σ", xO, "start", 18]].forEach(([s, x, anchor, dx]) => {
        const t = el("text", { x: x + dx, y: 8, class: "nn-sub", "text-anchor": anchor }, svg);
        t.textContent = s;
      });
    }
    parts = { svg, gP, P, e1, e2, nI, nH, nO, vals };
    wire();
    if (pulsed) svg.classList.add("is-trained");
  }

  function clear() {
    if (!parts) return;
    parts.svg.classList.remove("is-focus");
    [...parts.e1, ...parts.e2].forEach((e) => {
      e.line.classList.remove("on", "on-neg");
      e.line.style.removeProperty("--on");
    });
    [...parts.nI, ...parts.nH, ...parts.nO].forEach((n) => n.classList.remove("on"));
    parts.nO.forEach((n) => n.style.removeProperty("--y"));
    parts.vals.forEach((v) => (v.textContent = "ŷ = –"));
    if (note) note.innerHTML = defaultNote;
  }

  const fmt = (v) => v.toFixed(2);
  const escHTML = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  function showInput(i) {
    clear();
    const { h, y } = out[i];
    parts.svg.classList.add("is-focus");
    parts.nI[i].classList.add("on");
    const c1 = parts.e1.filter((e) => e.i === i);
    const m1 = Math.max(...c1.map((e) => Math.abs(e.wv)));
    c1.forEach((e) => mark(e.line, e.wv, Math.abs(e.wv) / m1));
    const c2 = parts.e2.map((e) => ({ ...e, c: e.wv * h[e.j] }));
    const m2 = Math.max(...c2.map((e) => Math.abs(e.c)));
    c2.forEach((e) => mark(e.line, e.c, Math.abs(e.c) / m2));
    parts.nH.forEach((n, j) => Math.abs(h[j]) > 0.25 && n.classList.add("on"));
    parts.nO.forEach((n, k) => {
      n.classList.add("on");
      n.style.setProperty("--y", y[k].toFixed(3));
      parts.vals[k].textContent = `ŷ = ${fmt(y[k])}`;
    });
    const ranked = goals.map((g, k) => [g.name, y[k]]).sort((a, b) => b[1] - a[1]);
    if (note)
      note.innerHTML = `<strong>${escHTML(skills[i].name)}</strong> → ${ranked.map(([n, v]) => `${escHTML(n)} <span class="mono">${fmt(v)}</span>`).join(" · ")}<br><span class="nn-note-sub">${escHTML(skills[i].note || "")}</span>`;
  }

  function showOutput(k) {
    clear();
    parts.svg.classList.add("is-focus");
    parts.nO[k].classList.add("on");
    const c2 = parts.e2.filter((e) => e.k === k);
    const m2 = Math.max(...c2.map((e) => Math.abs(e.wv)));
    c2.forEach((e) => mark(e.line, e.wv, Math.abs(e.wv) / m2));
    const c1 = parts.e1.map((e) => ({ ...e, c: e.wv * net.W2[k][e.j] }));
    const m1 = Math.max(...c1.map((e) => Math.abs(e.c)));
    c1.forEach((e) => mark(e.line, e.c, Math.abs(e.c) / m1));
    const ranked = skills.map((s, i) => [s.name, out[i].y[k], i]).sort((a, b) => b[1] - a[1]);
    ranked.slice(0, 3).forEach(([, , i]) => parts.nI[i].classList.add("on"));
    if (note)
      note.innerHTML = `<strong>${escHTML(goals[k].name)}</strong> ← ${ranked.map(([n, v]) => `${escHTML(n)} <span class="mono">${fmt(v)}</span>`).join(" · ")}`;
  }

  function showHidden(j) {
    clear();
    parts.svg.classList.add("is-focus");
    parts.nH[j].classList.add("on");
    parts.e1.filter((e) => e.j === j).forEach((e) => mark(e.line, e.wv, 0.9));
    parts.e2.filter((e) => e.j === j).forEach((e) => mark(e.line, e.wv, 0.9));
    if (note) note.innerHTML = `<strong>Hidden unit h${j + 1}</strong>: a learned mix of skills. Orange edges push a goal up, blue edges pull it down.`;
  }

  function mark(line, v, a) {
    if (a < 0.08) return;
    line.classList.add(v >= 0 ? "on" : "on-neg");
    line.style.setProperty("--on", (0.25 + 0.75 * a).toFixed(3));
  }

  function wire() {
    const bind = (nodes, fn) =>
      nodes.forEach((n, i) => {
        n.addEventListener("pointerenter", () => fn(i));
        n.addEventListener("focus", () => fn(i));
        n.addEventListener("click", () => fn(i));
        n.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fn(i);
          }
        });
      });
    bind(parts.nI, showInput);
    bind(parts.nO, showOutput);
    bind(parts.nH, showHidden);
    parts.svg.addEventListener("pointerleave", clear);
    parts.svg.addEventListener("focusout", (e) => {
      if (!parts.svg.contains(e.relatedTarget)) clear();
    });
  }

  // One forward pulse when the figure first enters the viewport.
  function pulse() {
    if (pulsed || !parts) return;
    pulsed = true;
    if (!motion.ok || !parts.gP.animate) {
      parts.svg.classList.add("is-trained");
      return;
    }
    const D = 520;
    const dot = (x1, y1, x2, y2, delay) => {
      const c = el("circle", { r: 2.4, class: "nn-pulse" }, parts.gP);
      const a = c.animate(
        [
          { transform: `translate(${x1}px,${y1}px)`, opacity: 0 },
          { opacity: 1, offset: 0.2 },
          { transform: `translate(${x2}px,${y2}px)`, opacity: 0.9 },
        ],
        { duration: D, delay, easing: "cubic-bezier(.45,0,.25,1)", fill: "both" }
      );
      a.onfinish = () => c.remove();
    };
    parts.e1.forEach((e) => dot(+e.line.getAttribute("x1"), +e.line.getAttribute("y1"), +e.line.getAttribute("x2"), +e.line.getAttribute("y2"), e.i * 25));
    parts.e2.forEach((e) => dot(+e.line.getAttribute("x1"), +e.line.getAttribute("y1"), +e.line.getAttribute("x2"), +e.line.getAttribute("y2"), D + 120 + e.j * 25));
    parts.nH.forEach((n) => setTimeout(() => n.classList.add("blip"), D));
    parts.nO.forEach((n) => setTimeout(() => n.classList.add("blip"), D * 2 + 200));
    setTimeout(() => parts.svg.classList.add("is-trained"), D * 2 + 300);
  }

  build();
  new ResizeObserver(() => build()).observe(svgHost);
  const io = new IntersectionObserver(
    (es) => {
      if (es.some((e) => e.isIntersecting)) {
        pulse();
        io.disconnect();
      }
    },
    { threshold: 0.45 }
  );
  io.observe(svgHost);
  return { net, out };
}
