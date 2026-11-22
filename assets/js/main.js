/*
 * main.js: bootstraps the page.
 *  content binding, nav (figures menu, mobile menu, pause), progress rail,
 *  figure chip, training readout, reveals, split headings, marquee, rotator,
 *  word lighting, count-ups, magnetic buttons, copy-to-clipboard and the models.
 * Everything degrades: without this file the pre-rendered HTML is complete.
 */
import * as content from "./content.js";
import * as R from "./render.js";
import { motion, Player, newSeed, clamp } from "./models/core.js";
import { gbmModel, bridgeModel } from "./models/montecarlo.js";
import { logisticModel } from "./models/logistic.js";
import { kmeansModel } from "./models/kmeans.js";
import { networkModel } from "./models/network.js";
import { initNN } from "./models/nn.js";
import { initTree } from "./models/tree.js";
import { createJourney } from "./journey.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const base = root.dataset.base || "";
const fine = matchMedia("(hover: hover) and (pointer: fine)");
const desktop = matchMedia("(min-width: 1024px)");

const safe = (name, fn) => {
  try {
    return fn();
  } catch (err) {
    console.warn(`[site] ${name} skipped:`, err);
    return null;
  }
};

/* ---------------------------------------------------------------------- */
/* 1. content binding                                                      */
/* ---------------------------------------------------------------------- */
const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), content);
const isRelative = (u) => !/^([a-z]+:|#|\/)/i.test(u);

function bindContent() {
  $$("[data-c]").forEach((el) => {
    const v = get(el.dataset.c);
    if (typeof v !== "string") return;
    const mark = el.dataset.mark;
    if (mark && v.includes(mark)) {
      const html = R.esc(v).replace(R.esc(mark), `<span class="edge">${R.esc(mark)}</span>`);
      if (el.innerHTML !== html) el.innerHTML = html;
    } else if (el.textContent !== v) el.textContent = v;
  });
  $$("[data-c-name]").forEach((el) => {
    const v = get(el.dataset.cName);
    if (typeof v !== "string") return;
    const [first, ...rest] = v.split(" ");
    const html = rest.length ? `${R.esc(first)} <em>${R.esc(rest.join(" "))}</em>` : R.esc(first);
    if (el.innerHTML.trim() !== html) el.innerHTML = html;
  });
  $$("[data-c-href]").forEach((el) => {
    let v = get(el.dataset.cHref);
    if (typeof v !== "string") return;
    if (isRelative(v)) v = base + v;
    el.setAttribute("href", (el.dataset.prefix || "") + v);
  });
  const renders = {
    proof: () => R.interests(content.profile.proof),
    marquee: () => R.marquee(content.marquee),
    rotator: () => R.rotator(content.profile.interestedIn),
    stats: () => R.stats(content.stats),
    interests: () => R.interests(content.profile.interests),
    journey: () => R.journey(content.journey),
    cases: () => R.cases(content.experience),
    skills: () => R.skillList(content.skills, content.goals),
    tree: () => R.tree(content.highSchool),
    contact: () => R.contact(content.links),
  };
  $$("[data-render]").forEach((el) => {
    const fn = renders[el.dataset.render];
    if (!fn) return;
    const html = fn();
    const h = R.hash(html);
    if (el.dataset.hash !== h) {
      el.innerHTML = html;
      el.dataset.hash = h;
    }
  });
}

/* ---------------------------------------------------------------------- */
/* 2. motion state                                                         */
/* ---------------------------------------------------------------------- */
function applyMotionClass() {
  root.classList.toggle("motion-ok", motion.ok);
  root.classList.toggle("motion-off", !motion.ok);
}

function initPause() {
  const btn = $(".pause-btn");
  if (!btn) return;
  const sync = () => {
    btn.setAttribute("aria-pressed", String(motion.paused || motion.reduced));
    btn.title = motion.reduced ? "Your system asks for reduced motion" : motion.paused ? "Resume animation" : "Pause all animation";
  };
  sync();
  btn.addEventListener("click", () => {
    if (motion.reduced) return;
    motion.setPaused(!motion.paused);
  });
  motion.onChange(() => {
    applyMotionClass();
    sync();
  });
}

/* ---------------------------------------------------------------------- */
/* 3. nav: figures menu, mobile menu                                        */
/* ---------------------------------------------------------------------- */
function initMenus() {
  const pairs = [
    [$(".figs-btn"), $("#figs-menu")],
    [$(".menu-btn"), $("#mnav")],
  ];
  pairs.forEach(([btn, menu]) => {
    if (!btn || !menu) return;
    const set = (open) => {
      btn.setAttribute("aria-expanded", String(open));
      menu.hidden = !open;
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      set(menu.hidden);
    });
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) set(false);
    });
    document.addEventListener("click", (e) => {
      if (!menu.hidden && !menu.contains(e.target)) set(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) {
        set(false);
        btn.focus();
      }
    });
  });
}

/* ---------------------------------------------------------------------- */
/* 4. scroll: nav state, rail, chip, training readout, word lighting       */
/* ---------------------------------------------------------------------- */
const scrollHooks = [];
function initScroll() {
  const nav = $("#nav");
  const rail = $(".rail");
  const fill = $(".rail-fill");
  const chipN = $(".chip-n");
  const chipName = $(".chip-name");
  const readout = $(".train-readout");
  const sections = $$("[data-fig]");
  const links = $$(".nav-links > a");
  const total = sections.length;
  let ticks = [];
  let current = -1;

  function layoutTicks() {
    if (!rail) return;
    ticks.forEach((t) => t.remove());
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    ticks = sections.map((s, i) => {
      const t = document.createElement("span");
      t.className = "rail-tick";
      const at = clamp((s.getBoundingClientRect().top + scrollY - innerHeight * 0.4) / max, 0, 1);
      t.style.setProperty("--at", at.toFixed(4));
      t.innerHTML = `<span>${i + 1}</span>`;
      rail.appendChild(t);
      return t;
    });
    current = -1;
    if (sections.length) update();
  }

  function update() {
    const y = scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = clamp(y / max, 0, 1);
    if (nav) nav.classList.toggle("is-scrolled", y > 8);
    if (fill) fill.style.setProperty("--p", p.toFixed(4));
    // which figure is under the reading line
    let idx = 0;
    sections.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= innerHeight * 0.42) idx = i;
    });
    if (idx !== current) {
      current = idx;
      const s = sections[idx];
      if (chipN) chipN.textContent = `Fig ${s.dataset.fig}`;
      if (chipName) chipName.textContent = s.dataset.figName;
      ticks.forEach((t, i) => {
        t.classList.toggle("is-current", i === idx);
        t.classList.toggle("is-past", i < idx);
      });
      links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === `#${s.id}`));
    }
    // decorative training readout: epoch rises, loss decays (≈0.04 at Contact)
    if (readout) {
      const epoch = Math.max(1, Math.round(1 + 99 * p));
      const noise = 0.004 * Math.sin(epoch * 12.9898) * Math.exp(-2 * p);
      const loss = 0.035 + 0.66 * Math.exp(-4.6 * p) + noise;
      readout.innerHTML = `epoch <b>${String(epoch).padStart(3, " ")}</b>/100 · loss <b>${loss.toFixed(3)}</b>`;
    }
    scrollHooks.forEach((fn) => fn(y));
  }

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => {
    layoutTicks();
    onScroll();
  });
  addEventListener("load", () => {
    layoutTicks();
    update();
  });
  layoutTicks();
  update();
  return { layoutTicks, update };
}

function initWordLight() {
  const p = $(".signal-text");
  if (!p) return;
  const keys = ["finance,", "consulting,", "data-driven", "decisions,", "opportunities,", "data", "complex", "problems.", "investment", "management."];
  const text = p.textContent.trim();
  const words = text.split(/\s+/);
  p.innerHTML =
    `<span class="sr-only">${R.esc(text)}</span><span aria-hidden="true">` +
    words.map((w) => `<span class="wd${keys.includes(w.toLowerCase()) ? " key" : ""}">${R.esc(w)}</span>`).join(" ") +
    "</span>";
  const spans = $$(".wd", p);
  let lit = -1;
  const set = (n) => {
    if (n === lit) return;
    spans.forEach((s, i) => s.classList.toggle("lit", i < n));
    lit = n;
  };
  const update = () => {
    if (!motion.ok) return set(spans.length);
    const r = p.getBoundingClientRect();
    const start = innerHeight * 0.88;
    const end = innerHeight * 0.38;
    const prog = clamp((start - r.top) / (start - end + r.height * 0.9), 0, 1);
    set(Math.round(prog * spans.length));
  };
  scrollHooks.push(update);
  motion.onChange(update);
  update();
}

/* ---------------------------------------------------------------------- */
/* 5. reveals and split headings                                           */
/* ---------------------------------------------------------------------- */
function splitHeadings() {
  $$("[data-split]").forEach((h) => {
    const text = h.textContent;
    let ci = 0;
    const build = (node) => {
      // keep <em> styling: walk child nodes
      const out = [];
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) out.push(" ");
            else out.push(`<span class="w">${[...part].map((c) => `<span class="ch" style="--ci:${ci++}">${R.esc(c)}</span>`).join("")}</span>`);
          });
        } else if (n.nodeType === 1) {
          out.push(`<${n.tagName.toLowerCase()}>${build(n)}</${n.tagName.toLowerCase()}>`);
        }
      });
      return out.join("");
    };
    const html = build(h);
    h.innerHTML = `<span class="sr-only">${R.esc(text)}</span><span aria-hidden="true">${html}</span>`;
    h.classList.add("split");
  });
}

function initReveals() {
  const targets = $$("[data-reveal], .split, .rule, .tree");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
  );
  targets.forEach((t) => io.observe(t));
  // hidden-until-revealed states apply only from here on
  root.classList.add("ready");
}

/* ---------------------------------------------------------------------- */
/* 6. marquee, rotator, count-up, magnetic, copy                           */
/* ---------------------------------------------------------------------- */
function initMarquee() {
  const track = $(".marquee-track");
  if (!track || !track.animate) return;
  let anim = null;
  let rate = 1;
  let lastY = scrollY;
  let lastT = performance.now();
  let hovering = false;
  let visible = false;
  const make = () => {
    if (anim) return;
    anim = track.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(-50%,0,0)" }], { duration: 46000, iterations: Infinity });
  };
  const sync = () => {
    if (!motion.ok) {
      if (anim) anim.cancel();
      anim = null;
      return;
    }
    make();
    if (hovering || !visible || document.hidden) anim.pause();
    else anim.play();
  };
  scrollHooks.push((y) => {
    if (!anim) return;
    const now = performance.now();
    const v = Math.abs(y - lastY) / Math.max(16, now - lastT); // px per ms
    lastY = y;
    lastT = now;
    rate = Math.max(rate, 1 + Math.min(2.5, v * 1.2));
  });
  const relax = () => {
    if (anim && !hovering) {
      rate += (1 - rate) * 0.05;
      anim.playbackRate = rate;
    }
    requestAnimationFrame(relax);
  };
  requestAnimationFrame(relax);
  const host = $(".marquee");
  host.addEventListener("mouseenter", () => ((hovering = true), sync()));
  host.addEventListener("mouseleave", () => ((hovering = false), sync()));
  new IntersectionObserver((es) => ((visible = es[0].isIntersecting), sync())).observe(host);
  document.addEventListener("visibilitychange", sync);
  motion.onChange(sync);
  sync();
}

function initRotator() {
  const items = $$(".rot-items span");
  if (items.length < 2) return;
  let i = 0;
  let timer = 0;
  let visible = false;
  const tick = () => {
    const cur = items[i];
    i = (i + 1) % items.length;
    cur.classList.remove("is-on");
    cur.classList.add("is-out");
    setTimeout(() => cur.classList.remove("is-out"), 650);
    items[i].classList.add("is-on");
  };
  const sync = () => {
    clearInterval(timer);
    if (motion.ok && visible && !document.hidden) timer = setInterval(tick, 2600);
  };
  new IntersectionObserver((es) => ((visible = es[0].isIntersecting), sync())).observe(items[0].parentElement);
  document.addEventListener("visibilitychange", sync);
  motion.onChange(sync);
}

function initCounts() {
  const els = $$(".count[data-count]");
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const to = Number(el.dataset.count);
        if (!motion.ok || !Number.isFinite(to)) return;
        const from = to >= 1000 ? to - 30 : 0;
        const t0 = performance.now();
        const D = 1000;
        const step = (now) => {
          const u = Math.min(1, (now - t0) / D);
          el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - u, 3))));
          if (u < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    { threshold: 0.6 }
  );
  els.forEach((el) => io.observe(el));
}

function initMagnetic() {
  $$(".magnetic").forEach((el) => {
    let raf = 0;
    el.addEventListener("pointermove", (e) => {
      if (!fine.matches || !motion.ok) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transition = "transform .15s ease-out";
        el.style.transform = `translate(${(dx * 5).toFixed(2)}px, ${(dy * 4).toFixed(2)}px)`;
      });
    });
    el.addEventListener("pointerleave", () => {
      cancelAnimationFrame(raf);
      el.style.transition = "transform .5s cubic-bezier(.16,1,.3,1)";
      el.style.transform = "";
    });
  });
}

function toast(msg) {
  const t = $(".toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("is-on"), 2200);
}

function initCopy() {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const v = b.dataset.copy;
    let ok = false;
    try {
      await navigator.clipboard.writeText(v);
      ok = true;
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch (e2) {
        ok = false;
      }
      ta.remove();
    }
    toast(ok ? `Copied ${v}` : `Press Ctrl+C to copy ${v}`);
  });
}

/* ---------------------------------------------------------------------- */
/* 7. figures                                                              */
/* ---------------------------------------------------------------------- */
function initHero() {
  const canvas = $("#mc-canvas");
  if (!canvas) return;
  const wrap = $("#mc-wrap");
  const tip = $("#mc-tip");
  const readout = $("#mc-readout");
  const model = gbmModel({ n: 250, mu: 0.08, sigma: 0.25 });
  const label = () => (readout.textContent = `GBM · n = 250 · seed ${model.seed}`);
  const player = new Player(canvas, model, { seed: 2030, threshold: 0.05 });
  label();
  const move = (e) => {
    if (!player.done) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const info = model.pointer(x, y);
    player.draw();
    if (!info) return tip.classList.remove("is-on");
    const f = (v) => v.toFixed(1);
    tip.innerHTML = `<b>${info.label}</b><div class="row"><span>p95</span><span>${f(info.p95)}</span></div><div class="row med"><span>p50</span><span>${f(info.p50)}</span></div><div class="row"><span>p5</span><span>${f(info.p5)}</span></div>`;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = info.x + 14;
    if (left + tw > r.width - 8) left = info.x - tw - 14;
    const top = clamp(info.y50 - th - 14, 8, r.height - th - 34);
    tip.style.transform = `translate(${left}px, ${top}px)`;
    tip.classList.add("is-on");
  };
  const leave = () => {
    model.clearPointer();
    tip.classList.remove("is-on");
    if (player.done) player.draw();
  };
  wrap.addEventListener("pointermove", move);
  wrap.addEventListener("pointerdown", move);
  wrap.addEventListener("pointerleave", leave);
  $("#mc-rerun").addEventListener("click", () => {
    leave();
    player.replay(newSeed() % 100000);
    label();
  });
}

function initBridge() {
  const canvas = $("#bridge-canvas");
  if (!canvas) return;
  const player = new Player(canvas, bridgeModel(), { seed: 7, threshold: 0.4 });
  const btn = $("#bridge-replay");
  if (btn) btn.addEventListener("click", () => player.replay(newSeed()));
}

const MODELS = { logistic: logisticModel, kmeans: kmeansModel, network: networkModel };
const SEEDS = { logistic: 11, kmeans: 4, network: 21 };

function initCases() {
  const cases = $$(".case");
  if (!cases.length) return;
  const players = cases.map((c) => {
    const kind = c.dataset.model;
    const canvas = $("canvas", c);
    const readout = $("[data-readout]", c);
    const model = MODELS[kind]();
    const p = new Player(canvas, model, {
      seed: SEEDS[kind],
      threshold: 0.3,
      enabled: !desktop.matches || c.classList.contains("is-active"),
      onDraw: () => readout && (readout.textContent = model.readout || ""),
    });
    $("[data-replay]", c).addEventListener("click", () => p.replay(newSeed()));
    return p;
  });
  const select = (idx) => {
    cases.forEach((c, i) => {
      const on = i === idx;
      c.classList.toggle("is-active", on);
      $(".case-btn", c).setAttribute("aria-pressed", String(on));
      if (desktop.matches) {
        players[i].setEnabled(on);
        if (on) players[i].replay();
      }
    });
  };
  cases.forEach((c, i) =>
    $(".case-btn", c).addEventListener("click", () => {
      if (desktop.matches) select(i);
      else players[i].replay();
    })
  );
  desktop.addEventListener("change", () => {
    const active = Math.max(0, cases.findIndex((c) => c.classList.contains("is-active")));
    players.forEach((p, i) => p.setEnabled(!desktop.matches || i === active));
  });
}

function initJourney(refreshTicks) {
  const section = $("#journey");
  if (!section) return;
  const j = createJourney(section);
  if (!j) return;
  const miles = $("[data-miles]", section);
  if (miles) miles.textContent = `≈ ${Math.round(j.miles / 10) * 10} mi`;
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const pinnable = () => desktop.matches && innerHeight >= 700 && !!gsap && !!ST;
  let st = null;
  let played = false;
  const io = new IntersectionObserver(
    (es) => {
      if (!es[0].isIntersecting || st) return;
      if (!motion.ok) return j.finish();
      if (!played) {
        played = true;
        j.play();
      }
    },
    { threshold: 0.35 }
  );

  function setup() {
    if (st) {
      st.kill(true);
      st = null;
    }
    section.classList.toggle("is-pinnable", pinnable() && motion.ok);
    if (!motion.ok) {
      j.finish();
      if (ST) ST.refresh();
      refreshTicks();
      return;
    }
    if (pinnable()) {
      gsap.registerPlugin(ST);
      const proxy = { p: 0 };
      const tween = gsap.to(proxy, {
        p: 1,
        ease: "none",
        onUpdate: () => j.set(proxy.p),
        scrollTrigger: { trigger: section, start: "top top", end: "+=150%", pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true },
      });
      st = tween.scrollTrigger;
      ST.refresh();
    } else {
      j.set(played ? 1 : 0);
      io.observe(section);
    }
    refreshTicks();
  }
  setup();
  motion.onChange(setup);
  let w = innerWidth;
  addEventListener("resize", () => {
    if (Math.abs(innerWidth - w) > 40) {
      w = innerWidth;
      setup();
    }
  });
}

/* ---------------------------------------------------------------------- */
/* boot                                                                    */
/* ---------------------------------------------------------------------- */
function boot() {
  safe("content", bindContent);
  applyMotionClass();
  safe("pause", initPause);
  safe("menus", initMenus);
  safe("split", splitHeadings);
  safe("words", initWordLight);
  const sc = safe("scroll", initScroll);
  safe("reveals", initReveals);
  safe("marquee", initMarquee);
  safe("rotator", initRotator);
  safe("counts", initCounts);
  safe("magnetic", initMagnetic);
  safe("copy", initCopy);
  safe("hero", initHero);
  safe("bridge", initBridge);
  safe("cases", initCases);
  safe("nn", () => {
    const el = $(".nn");
    if (el) initNN(el, { skills: content.skills, goals: content.goals });
  });
  safe("tree", () => {
    const el = $(".tree");
    if (el) initTree(el);
  });
  const ticks = () => sc && sc.layoutTicks();
  // GSAP is loaded with `defer` before this module, so it is ready here.
  safe("journey", () => initJourney(ticks));
  addEventListener("load", () => window.ScrollTrigger && window.ScrollTrigger.refresh());
}

boot();
