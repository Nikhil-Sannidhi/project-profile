/*
 * journey.js: Fig. 3. The route from Frisco to Champaign is the trajectory
 * of plain gradient descent on an ill-conditioned quadratic loss
 *   f(p) = ½ (p − c)ᵀ A (p − c),  A with eigenvalues 1 and 14.4,
 * whose minimum c is Champaign. The fast direction overshoots (zig-zags that
 * shrink by |1 − ηλ| = 0.8 per step); the slow direction creeps in by 0.875.
 * Contours are level sets of f. Coordinates are Albers USA map units
 * (precomputed with d3-geo, see assets/data/us-states.svg).
 */
const NS = "http://www.w3.org/2000/svg";
export const FRISCO = [510.3, 412.9];
export const CHAMPAIGN = [647.5, 261.0];
export const VIEWBOX = [320, 70, 640, 480];

const LAMBDA = [1, 14.4];
const ETA = 0.125;
const STEPS = 44;
const TILT = (7 * Math.PI) / 180;

export function descent() {
  const [cx, cy] = CHAMPAIGN;
  const dx = FRISCO[0] - cx;
  const dy = FRISCO[1] - cy;
  const D = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx) + TILT; // slow eigen-direction
  const e1 = [Math.cos(ang), Math.sin(ang)];
  const e2 = [-Math.sin(ang), Math.cos(ang)];
  let a = dx * e1[0] + dy * e1[1];
  let b = dx * e2[0] + dy * e2[1];
  const f = (a, b) => 0.5 * (LAMBDA[0] * a * a + LAMBDA[1] * b * b);
  const f0 = f(a, b);
  const pts = [];
  for (let k = 0; k <= STEPS; k++) {
    pts.push({ x: cx + a * e1[0] + b * e2[0], y: cy + a * e1[1] + b * e2[1], loss: f(a, b) / f0 });
    a *= 1 - ETA * LAMBDA[0];
    b *= 1 - ETA * LAMBDA[1];
  }
  return { pts, e1, ang, f0, D };
}

// Great-circle distance in miles (haversine).
export function miles([lat1, lon1], [lat2, lon2]) {
  const r = Math.PI / 180;
  const h = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

const mk = (tag, attrs, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

export function createJourney(section) {
  const svg = section.querySelector(".route");
  const cards = [...section.querySelectorAll(".ms")];
  if (!svg) return null;
  const { pts, ang, f0 } = descent();
  svg.setAttribute("viewBox", VIEWBOX.join(" "));
  svg.innerHTML = "";

  // contours (level sets), outermost through Frisco
  const gC = mk("g", { class: "contours" }, svg);
  const deg = (ang * 180) / Math.PI;
  [1, 0.55, 0.28, 0.13, 0.05].forEach((lv, i) => {
    const c = f0 * lv;
    mk("ellipse", { cx: CHAMPAIGN[0], cy: CHAMPAIGN[1], rx: Math.sqrt((2 * c) / LAMBDA[0]), ry: Math.sqrt((2 * c) / LAMBDA[1]), transform: `rotate(${deg} ${CHAMPAIGN[0]} ${CHAMPAIGN[1]})`, class: "contour", style: `--i:${i}` }, gC);
  });

  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  mk("path", { d, class: "route-ghost" }, svg);
  const route = mk("path", { d, class: "route-line" }, svg);
  const gDots = mk("g", { class: "iterates" }, svg);
  const dots = pts.map((p) => mk("circle", { cx: p.x, cy: p.y, r: 2, class: "iterate" }, gDots));

  const city = (p, name, cls, dx, anchor) => {
    const g = mk("g", { class: `city ${cls}` }, svg);
    mk("circle", { cx: p[0], cy: p[1], r: 9, class: "city-halo" }, g);
    mk("circle", { cx: p[0], cy: p[1], r: 4, class: "city-dot" }, g);
    const t = mk("text", { x: p[0] + dx, y: p[1] + 4, "text-anchor": anchor, class: "city-label" }, g);
    t.textContent = name;
    return g;
  };
  city(FRISCO, "Frisco, TX", "start", -14, "end");
  const champ = city(CHAMPAIGN, "Champaign, IL", "end", 14, "start");
  const head = mk("g", { class: "head" }, svg);
  const headDot = mk("circle", { r: 4.5, class: "head-dot" }, head);
  const headTxt = mk("text", { class: "head-label" }, head);

  // keep labels and dots a constant on-screen size
  const scaleFix = () => {
    const w = svg.getBoundingClientRect().width || VIEWBOX[2];
    const k = VIEWBOX[2] / w;
    svg.style.setProperty("--k", k);
    dots.forEach((c) => c.setAttribute("r", 1.9 * k));
    headDot.setAttribute("r", 4.5 * k);
    svg.querySelectorAll(".city-dot").forEach((c) => c.setAttribute("r", 4 * k));
    svg.querySelectorAll(".city-halo").forEach((c) => c.setAttribute("r", 10 * k));
    svg.querySelectorAll(".city-label").forEach((t) => {
      t.setAttribute("font-size", 12 * k);
      const cx = +t.parentNode.querySelector(".city-dot").getAttribute("cx");
      t.setAttribute("x", cx + (t.getAttribute("text-anchor") === "end" ? -14 : 14) * k);
    });
    headTxt.setAttribute("font-size", 11 * k);
    current = -1;
    set(lastP);
  };

  const L = route.getTotalLength();
  // cumulative length at each iterate
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  route.style.strokeDasharray = `${L} ${L}`;

  const THRESH = [0, 0.56, 0.68, 0.79, 0.9];
  const DRAW = [0.04, 0.56];
  let lastP = 0;
  let current = -1;

  function set(p) {
    lastP = p;
    const f = Math.min(1, Math.max(0, (p - DRAW[0]) / (DRAW[1] - DRAW[0])));
    const len = L * f;
    route.style.strokeDashoffset = String(L - len);
    let it = 0;
    for (let i = 0; i < cum.length; i++) if (cum[i] <= len + 0.01) it = i;
    dots.forEach((c, i) => c.classList.toggle("on", i <= it));
    const pt = route.getPointAtLength(len);
    const k = parseFloat(svg.style.getPropertyValue("--k")) || 1;
    headDot.setAttribute("cx", pt.x);
    headDot.setAttribute("cy", pt.y);
    headTxt.setAttribute("x", pt.x + 12 * k);
    headTxt.setAttribute("y", pt.y - 10 * k);
    headTxt.textContent = `iter ${it} · loss ${pts[it].loss.toFixed(3)}`;
    head.classList.toggle("is-done", f >= 1);
    champ.classList.toggle("is-reached", f >= 1);
    let active = 0;
    THRESH.forEach((t, i) => p >= t && (active = i));
    if (active !== current) {
      current = active;
      cards.forEach((c, i) => {
        c.classList.toggle("is-on", i <= active);
        c.classList.toggle("is-current", i === active);
      });
      section.dataset.iter = String(active + 1);
    }
  }

  section.classList.add("has-route");
  new ResizeObserver(scaleFix).observe(svg);
  scaleFix();
  set(0);

  // Self-running version for small screens (no pin) and replays.
  let raf = 0;
  function play(duration = 2600) {
    cancelAnimationFrame(raf);
    const t0 = performance.now();
    const tick = (now) => {
      const u = Math.min(1, (now - t0) / duration);
      set(u < 1 ? 1 - Math.pow(1 - u, 2.2) : 1);
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function finish() {
    cancelAnimationFrame(raf);
    set(1);
  }
  return { set, play, finish, miles: miles([33.15, -96.82], [40.11, -88.24]) };
}
