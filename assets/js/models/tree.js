/*
 * tree.js: draws the branches of the Fig. 6 decision tree between the HTML
 * node cards. Desktop: a top-down tree with smooth vertical branches.
 * Narrow screens: an indented outline with elbow connectors.
 * Branches draw in (stroke-dashoffset) when the tree enters the viewport.
 */
const NS = "http://www.w3.org/2000/svg";

export function initTree(root) {
  const svg = root.querySelector(".tree-wires");
  if (!svg) return;
  const q = (sel) => root.querySelector(`[data-node="${sel}"]`);

  function draw() {
    const R = root.getBoundingClientRect();
    if (!R.width) return;
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    svg.setAttribute("width", R.width);
    svg.setAttribute("height", R.height);
    svg.innerHTML = "";
    const narrow = R.width < 720;
    const box = (n) => {
      const b = n.getBoundingClientRect();
      return { l: b.left - R.left, r: b.right - R.left, t: b.top - R.top, b: b.bottom - R.top, cx: b.left - R.left + b.width / 2, cy: b.top - R.top + b.height / 2 };
    };
    const rootBox = box(q("root"));
    const groups = [...root.querySelectorAll(".tree-group")];
    let order = 0;
    const path = (d, depth, cls = "") => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("pathLength", "1");
      p.setAttribute("class", `wire ${cls}`);
      p.style.setProperty("--d", depth);
      p.style.setProperty("--o", order++);
      svg.appendChild(p);
      return p;
    };
    const label = (x, y, text, depth, anchor = "middle") => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.setAttribute("text-anchor", anchor);
      t.setAttribute("class", "wire-label");
      t.style.setProperty("--d", depth);
      t.textContent = text;
      svg.appendChild(t);
    };
    groups.forEach((g) => {
      const split = box(g.querySelector(".tree-split"));
      const leaves = [...g.querySelectorAll(".tree-leaves > li")].map(box);
      if (!narrow) {
        const y0 = rootBox.b;
        const y1 = split.t;
        const my = (y0 + y1) / 2;
        path(`M${rootBox.cx},${y0} C${rootBox.cx},${my} ${split.cx},${my} ${split.cx},${y1}`, 0);
        leaves.forEach((lf) => {
          const a = split.b;
          const b = lf.t;
          const m = (a + b) / 2;
          path(`M${split.cx},${a} C${split.cx},${m} ${lf.cx},${m} ${lf.cx},${b}`, 1, "leafwire");
        });
        label(split.cx + 8, split.b + 16, "yes", 1, "start");
      } else {
        const x0 = rootBox.l + 22;
        path(`M${x0},${rootBox.b} V${split.cy - 8} Q${x0},${split.cy} ${x0 + 8},${split.cy} H${split.l}`, 0);
        const sx = split.l + 18;
        leaves.forEach((lf) => {
          path(`M${sx},${split.b} V${lf.cy - 8} Q${sx},${lf.cy} ${sx + 8},${lf.cy} H${lf.l}`, 1, "leafwire");
        });
      }
    });
  }

  draw();
  new ResizeObserver(draw).observe(root);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  window.addEventListener("load", draw);
  return { draw };
}
