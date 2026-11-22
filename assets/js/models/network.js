/*
 * network.js: a small force-directed graph (velocity Verlet with damping,
 * in the style of d3-force): link springs, inverse-square charge and a weak
 * centering force. People join one at a time; alpha cools the layout.
 */
import { C, FONT_MONO, rgba, mulberry32, clamp, ease } from "./core.js";

const GROUPS = [
  { name: "prospective students", size: 10 },
  { name: "admitted students", size: 8 },
  { name: "families", size: 8 },
];
const TICK = 16; // ms per simulation tick
const LINK = 40;
const CHARGE = -70;
const DECAY = 0.4; // velocity decay
const ALPHA_DECAY = 1 - Math.pow(0.001, 1 / 240);

function halo(ctx, text, x, y) {
  ctx.save();
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.strokeText(text, x, y);
  ctx.restore();
}

export function networkModel(opts = {}) {
  let nodes, links, order, seed, state;
  const m = {
    duration: opts.duration ?? 3600,
    readout: "",
    reset(s) {
      seed = s >>> 0;
      const rng = mulberry32(seed);
      nodes = [{ g: -1, r: 6.5 }];
      links = [];
      const members = [];
      GROUPS.forEach((G, gi) => {
        const ids = [];
        for (let i = 0; i < G.size; i++) {
          const id = nodes.length;
          nodes.push({ g: gi, r: 3.6 });
          // stay connected: link to an earlier member, sometimes two
          if (ids.length) links.push([ids[Math.floor(rng() * ids.length)], id]);
          if (ids.length > 2 && rng() < 0.35) {
            const j = ids[Math.floor(rng() * ids.length)];
            if (!links.some(([a, b]) => (a === j && b === id) || (a === id && b === j))) links.push([j, id]);
          }
          ids.push(id);
        }
        // the ambassador meets a few people in every group
        const k = 2 + Math.floor(rng() * 2);
        for (let i = 0; i < k; i++) links.push([0, ids[Math.floor((i / k) * ids.length + rng() * 2) % ids.length]]);
        members.push(ids);
      });
      // a few cross-group ties (families know admitted students, etc.)
      links.push([members[1][1], members[2][0]], [members[1][4], members[2][3]], [members[0][2], members[1][2]]);
      // arrival order: hub, then the groups interleaved
      order = [0];
      const longest = Math.max(...members.map((x) => x.length));
      for (let i = 0; i < longest; i++) members.forEach((ids) => ids[i] !== undefined && order.push(ids[i]));
      nodes.forEach((n, i) => (n.arrive = order.indexOf(i) * 70));
      m.restart();
    },
    restart() {
      const rng = mulberry32(seed ^ 0x9e3779b9);
      state = { tick: 0, alpha: 1, rng };
      nodes.forEach((n) => {
        n.x = n.y = n.vx = n.vy = 0;
        n.on = false;
      });
    },
    render(ctx, w, h, t) {
      const target = Math.floor(Math.min(t, m.duration) / TICK);
      if (target < state.tick) m.restart();
      while (state.tick < target) step(state.tick * TICK);
      const scale = Math.min(w / 440, h / 300);
      const X = (x) => w / 2 + x * scale;
      const Y = (y) => h / 2 + y * scale;
      const now = state.tick * TICK;
      // links
      ctx.lineWidth = 1;
      for (const [a, b] of links) {
        const A = nodes[a];
        const B = nodes[b];
        if (!A.on || !B.on) continue;
        const age = clamp((now - Math.max(A.arrive, B.arrive)) / 300, 0, 1);
        ctx.strokeStyle = a === 0 ? rgba(C.orange, 0.5 * age) : rgba(C.ink, 0.22 * age);
        ctx.beginPath();
        ctx.moveTo(X(A.x), Y(A.y));
        ctx.lineTo(X(B.x), Y(B.y));
        ctx.stroke();
      }
      // nodes
      for (const n of nodes) {
        if (!n.on) continue;
        const k = ease.outCubic(clamp((now - n.arrive) / 260, 0, 1));
        const r = n.r * k * (scale < 0.8 ? 0.9 : 1);
        ctx.beginPath();
        ctx.arc(X(n.x), Y(n.y), r, 0, Math.PI * 2);
        if (n.g === -1) {
          ctx.fillStyle = rgba(C.orange, 0.14);
          ctx.beginPath();
          ctx.arc(X(n.x), Y(n.y), r * 2.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(X(n.x), Y(n.y), r, 0, Math.PI * 2);
          ctx.fillStyle = C.orange;
          ctx.fill();
        } else if (n.g === 0) {
          ctx.fillStyle = C.surface;
          ctx.fill();
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = C.blue;
          ctx.stroke();
        } else {
          ctx.fillStyle = n.g === 1 ? C.blue : C.ink;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = C.surface;
          ctx.stroke();
        }
      }
      // labels once settled
      const la = clamp((now - 2300) / 500, 0, 1);
      if (la > 0) {
        ctx.font = `10.5px ${FONT_MONO}`;
        ctx.textBaseline = "middle";
        GROUPS.forEach((G, gi) => {
          let cx = 0;
          let cy = 0;
          let c = 0;
          let far = 0;
          for (const n of nodes) if (n.g === gi && n.on) (cx += n.x), (cy += n.y), c++;
          if (!c) return;
          cx /= c;
          cy /= c;
          for (const n of nodes) if (n.g === gi && n.on) far = Math.max(far, Math.hypot(n.x - cx, n.y - cy));
          const d = Math.hypot(cx, cy) || 1;
          const lx = cx + (cx / d) * (far * 0.6 + 14);
          const ly = cy + (cy / d) * (far * 0.6 + 14);
          ctx.textAlign = lx > 0 ? "left" : "right";
          ctx.fillStyle = rgba(C.muted, la);
          const px = clamp(X(lx), 8, w - 8);
          halo(ctx, G.name, px, clamp(Y(ly), 10, h - 10));
          ctx.fillText(G.name, px, clamp(Y(ly), 10, h - 10));
        });
        ctx.textAlign = "center";
        ctx.fillStyle = rgba(C.orangeText, la);
        halo(ctx, "ambassador", X(nodes[0].x), Y(nodes[0].y) - 20);
        ctx.fillText("ambassador", X(nodes[0].x), Y(nodes[0].y) - 20);
      }
      const visible = nodes.filter((n) => n.on).length;
      const e = links.filter(([a, b]) => nodes[a].on && nodes[b].on).length;
      m.readout = `nodes ${visible} · edges ${e} · α ${state.alpha.toFixed(3)}`;
    },
  };

  function step(time) {
    const { rng } = state;
    // arrivals
    for (const n of nodes) {
      if (!n.on && time >= n.arrive) {
        n.on = true;
        const id = nodes.indexOf(n);
        const nb = links.find(([a, b]) => (a === id && nodes[b].on) || (b === id && nodes[a].on));
        const anchor = nb ? nodes[nb[0] === id ? nb[1] : nb[0]] : null;
        const ang = rng() * Math.PI * 2;
        n.x = (anchor ? anchor.x : 0) + Math.cos(ang) * 14;
        n.y = (anchor ? anchor.y : 0) + Math.sin(ang) * 14;
        state.alpha = Math.max(state.alpha, 0.6);
      }
    }
    const a = state.alpha;
    const live = nodes.filter((n) => n.on);
    // links (d3 forceLink, bias by degree omitted for simplicity)
    for (const [i, j] of links) {
      const s = nodes[i];
      const t = nodes[j];
      if (!s.on || !t.on) continue;
      let dx = t.x + t.vx - s.x - s.vx;
      let dy = t.y + t.vy - s.y - s.vy;
      const d = Math.hypot(dx, dy) || 1e-6;
      const l = ((d - LINK) / d) * a * 0.5;
      dx *= l;
      dy *= l;
      t.vx -= dx * 0.5;
      t.vy -= dy * 0.5;
      s.vx += dx * 0.5;
      s.vy += dy * 0.5;
    }
    // many-body charge
    for (let p = 0; p < live.length; p++) {
      for (let q = p + 1; q < live.length; q++) {
        const A = live[p];
        const B = live[q];
        let dx = B.x - A.x;
        let dy = B.y - A.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          dx = rng() - 0.5;
          dy = rng() - 0.5;
          d2 = 1;
        }
        const f = (CHARGE * a) / d2;
        A.vx += dx * f;
        A.vy += dy * f;
        B.vx -= dx * f;
        B.vy -= dy * f;
      }
    }
    // centering (x is wider than y, matching the canvas)
    for (const n of live) {
      n.vx -= n.x * 0.045 * a;
      n.vy -= n.y * 0.07 * a;
      n.vx *= 1 - DECAY;
      n.vy *= 1 - DECAY;
      n.x += n.vx;
      n.y += n.vy;
    }
    state.alpha += (0.001 - state.alpha) * ALPHA_DECAY;
    state.tick++;
  }
  return m;
}
