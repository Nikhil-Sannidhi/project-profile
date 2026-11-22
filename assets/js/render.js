/*
 * render.js: pure functions that turn content.js into markup.
 * index.html ships a pre-rendered copy of this output; main.js re-renders
 * a block only when content.js has changed since that copy was made.
 */

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Small, stable string hash (FNV-1a) used to detect content edits.
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const ext = (url, label, cls = "") =>
  `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`;

const chip = (logo, kind = "white", alt = "") =>
  `<span class="logo-chip logo-chip--${esc(kind)}"><img src="${esc(logo)}" alt="${esc(alt)}" loading="lazy" decoding="async"></span>`;

export function marquee(words) {
  const run = words.map((w) => `<span>${esc(w)}</span><i>/</i>`).join("");
  return `<div class="marquee-track"><div class="marquee-run">${run}</div><div class="marquee-run">${run}</div></div>`;
}

export function interests(list) {
  return list.map((t) => `<li>${esc(t)}</li>`).join("");
}

export function rotator(items) {
  const list = items.map(esc);
  const sentence =
    list.length > 1 ? `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}` : list[0] || "";
  return `<span class="sr-only">I’m interested in how businesses ${sentence}.</span><span class="rot-items" aria-hidden="true">${list
    .map((t, i) => `<span${i === 0 ? ' class="is-on"' : ""}>${t}.</span>`)
    .join("")}</span><span class="rot-static" aria-hidden="true">${sentence}.</span>`;
}

export function stats(list) {
  return list
    .map(
      (s) =>
        `<tr><th scope="row">${esc(s.label)}</th><td><span class="count" data-count="${esc(s.value)}">${esc(s.value)}</span></td></tr>`
    )
    .join("");
}

export function journey(list) {
  return list
    .map(
      (m, i) => `<li class="ms" data-i="${i}">
  <span class="ms-iter" aria-hidden="true">iter ${String(i + 1).padStart(2, "0")}</span>
  ${chip(m.logo, m.chip, "")}
  <span class="ms-text"><span class="ms-title">${esc(m.title)}</span><span class="ms-sub">${esc(m.sub)}</span></span>
  ${m.pill ? `<span class="pill">${esc(m.pill)}</span>` : ""}
</li>`
    )
    .join("\n");
}

const CAPTIONS = {
  logistic: (n) =>
    `<b>Fig. 4${n} —</b> A logistic S-curve, <i>y</i> = <i>L</i> / (1 + e<sup>−<i>k</i>(<i>t</i> − <i>t</i><sub>0</sub>)</sup>), fitted to 40 synthetic adoption points by gradient descent (Adam). Faint curves are earlier iterations.`,
  kmeans: (n) =>
    `<b>Fig. 4${n} —</b> Lloyd’s k-means (<i>k</i> = 3) on 120 synthetic points. Each centroid (+) moves to the mean of its cluster until the assignments stop changing.`,
  network: (n) =>
    `<b>Fig. 4${n} —</b> A force-directed graph: springs pull connected people together, charge pushes everyone apart, and the layout settles into communities.`,
};
const LABELS = {
  logistic: "Animated chart: synthetic adoption data points with a logistic S-curve converging onto them over successive gradient-descent iterations.",
  kmeans: "Animated chart: scattered points that k-means groups into three colored clusters as the cluster centers move and settle.",
  network: "Animated chart: a network of nodes, representing people, connecting by springs and settling into a stable layout.",
};

export function cases(list) {
  return list
    .map((c, i) => {
      const n = "abc"[i] || String(i + 1);
      const on = i === 0;
      return `<article class="case${on ? " is-active" : ""}" id="case-${esc(c.id)}" data-model="${esc(c.model)}" style="--i:${i + 1}">
  <h3 class="case-head"><button class="case-btn" type="button" aria-pressed="${on}" aria-controls="case-${esc(c.id)}-body">
    <span class="case-num">4${n}</span>
    <span class="case-title"><span class="case-org">${esc(c.short)}</span><span class="case-role">${esc(c.role === c.short ? c.org : c.role)}${c.dates ? ` · ${esc(c.dates)}` : ""}</span></span>
    <span class="case-model">${esc(c.modelName)}</span>
  </button></h3>
  <div class="case-body" id="case-${esc(c.id)}-body">
    <figure class="case-fig">
      <div class="frame">
      <div class="fig-bar"><span class="fig-tag">Fig. 4${n} · ${esc(c.modelName)}</span><span class="fig-readout" data-readout aria-hidden="true"></span><button class="btn-mini" type="button" data-replay>Replay <span aria-hidden="true">↻</span></button></div>
      <div class="fig-canvas fig-canvas--case" role="img" aria-label="${esc(LABELS[c.model] || c.modelName)}"><canvas></canvas></div>
      </div>
      <figcaption>${(CAPTIONS[c.model] || (() => ""))(n)}</figcaption>
    </figure>
    <div class="case-detail">
      <div class="case-who">${chip(c.logo, c.logoChip, c.short + " logo")}<p><strong>${esc(c.role)}</strong>, ${esc(c.org)}<span class="mono">${[c.dates, c.place].filter(Boolean).map(esc).join(" · ")}</span></p></div>
      <p class="case-blurb">${esc(c.blurb)} <span class="case-note">${esc(c.modelNote)}</span></p>
      <p class="case-links"><a class="link-arrow" href="${esc(c.caseStudy)}">Read the case study <span aria-hidden="true">→</span></a>${ext(c.url, `${esc(c.short === "Gies Ambassador" ? "Gies" : c.short)} site <span aria-hidden="true">↗</span>`, "link-quiet")}</p>
    </div>
  </div>
</article>`;
    })
    .join("\n") +
    `\n<p class="cases-note"><b>Note.</b> The models run on synthetic data. They illustrate the kind of thinking each role involves, not client results. Write-ups are linked from each case.</p>`;
}

export function skillList(skills, goals) {
  return skills
    .map((s) => {
      const top = goals
        .slice()
        .sort((a, b) => (s.relevance[b.id] || 0) - (s.relevance[a.id] || 0))
        .slice(0, 2)
        .map((g) => g.name)
        .join(", ");
      return `<li><strong>${esc(s.name)}</strong>: feeds ${esc(top)}.</li>`;
    })
    .join("");
}

export function tree(hs) {
  const total = hs.splits.reduce((a, s) => a + s.leaves.length, 0);
  let k = 0;
  const groups = hs.splits
    .map(
      (sp, gi) => `<div class="tree-group" style="--n:${sp.leaves.length}">
    <div class="tree-split" data-node="s${gi}"><span class="mono">${esc(sp.question)}</span><span class="tree-samples">samples = ${sp.leaves.length}</span></div>
    <ul class="tree-leaves">${sp.leaves
      .map(
        (l) => `<li data-node="s${gi}-l${k}" style="--k:${k++}">${ext(
          l.url,
          `${chip(l.logo, "white", "")}<span class="leaf-name">${esc(l.name)}</span><span class="leaf-note">${esc(l.note)}</span><span class="leaf-class">class = ${esc(l.label || l.name)} <span aria-hidden="true">↗</span></span>`,
          "leaf card"
        )}</li>`
      )
      .join("")}</ul>
  </div>`
    )
    .join("\n");
  return `<svg class="tree-wires" aria-hidden="true" focusable="false"></svg>
  <div class="tree-root" data-node="root">${chip(hs.logo, "white", "")}<span><span class="tree-title">${esc(hs.name)}</span><span class="mono">${esc(hs.district)} · ${esc(hs.years)}</span></span><span class="tree-samples">samples = ${total}</span></div>
  <div class="tree-groups">${groups}</div>`;
}

export function contact(l) {
  const card = (label, body, extra = "", primary = false) =>
    `<li class="ccard card${primary ? " ccard--primary" : ""}"><span class="ccard-label">${label}</span>${body}${extra}</li>`;
  const copy = (v) =>
    `<button class="btn-mini copy" type="button" data-copy="${esc(v)}">Copy<span class="sr-only"> ${esc(v)}</span></button>`;
  const handle = (u) => esc(u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
  return [
    card("School email · primary", `<a class="ccard-main" href="mailto:${esc(l.emailSchool)}">${esc(l.emailSchool)}</a>`, copy(l.emailSchool), true),
    card("Personal email", `<a class="ccard-main" href="mailto:${esc(l.emailPersonal)}">${esc(l.emailPersonal)}</a>`, copy(l.emailPersonal)),
    card("LinkedIn", ext(l.linkedin, `${handle(l.linkedin)} <span aria-hidden="true">↗</span>`, "ccard-main")),
    card("GitHub", ext(l.github, `${handle(l.github)} <span aria-hidden="true">↗</span>`, "ccard-main")),
    card("Résumé", `<a class="ccard-main" href="${esc(l.resume)}">Download PDF <span aria-hidden="true">↓</span></a>`),
  ].join("\n");
}
