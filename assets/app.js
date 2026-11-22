(function () {
  const P = window.PROFILE;
  const D = window.INVOLVEMENTS;
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const join = (...parts) => parts.filter(Boolean).join(" · ");
  const hideSection = (id) => {
    const s = $(id);
    if (s) s.hidden = true;
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) link.hidden = true;
  };

  const ICONS = {
    Leadership: '<path d="M12 2 15 8.5 22 9.3 16.8 14 18.2 21 12 17.5 5.8 21 7.2 14 2 9.3 9 8.5Z"/>',
    Academic: '<path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3Zm-6 9.2V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8l-6 3.3-6-3.3Z"/>',
    Athletics: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c1.3 0 2.6.3 3.7.9L14 7.5h-4L8.3 4.9A8 8 0 0 1 12 4Zm-6.4 3.2 2 1.4L6.5 12l-2.4.8A8 8 0 0 1 5.6 7.2ZM9 18.7l-1.2-2.3 1.4-3.4h5.6l1.4 3.4-1.2 2.3a8 8 0 0 1-6 0Zm10.9-5.9-2.4-.8-1.1-3.4 2-1.4a8 8 0 0 1 1.5 5.6Z"/>',
    Service: '<path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2 0 3.5 1.1 5.3 3 1.8-1.9 3.3-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21Z"/>',
    Arts: '<path d="M9 3v11.6A3.5 3.5 0 1 0 11 18V8h7V3H9Z"/>',
    Tech: '<path d="M8.6 16.6 4 12l4.6-4.6L7.2 6 1.2 12l6 6 1.4-1.4Zm6.8 0L20 12l-4.6-4.6L16.8 6l6 6-6 6-1.4-1.4Z"/>',
    Consulting: '<path d="M9 3h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v4h-9v-1h-2v1H2V9a2 2 0 0 1 2-2h3V5a2 2 0 0 1 2-2Zm0 4h6V5H9v2Zm-7 8h9v1h2v-1h9v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4Z"/>',
    Business: '<path d="M4 19h16v2H4zM6 10h3v7H6zm5-4h3v11h-3zm5 7h3v4h-3z"/>',
    Outreach: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM1 20c0-3.3 3.6-6 8-6s8 2.7 8 6v1H1v-1Zm17.5 1v-1c0-1.9-.8-3.6-2.1-4.9 3.6.3 6.6 2.4 6.6 4.9v1h-4.5Z"/>',
  };
  const icon = (cat) =>
    `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">${ICONS[cat] || ICONS.Leadership}</svg>`;

  // Hero
  const initials = P.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  document.title = `${P.name} | Involvements`;
  $("brand").textContent = initials;
  $("initials").textContent = initials;
  $("heroEyebrow").textContent = join(P.collegeShort, P.college, P.location);
  $("heroName").textContent = P.name;
  $("heroTagline").textContent = P.tagline;
  $("heroIntro").textContent = P.intro;
  $("cardSchool").textContent = P.collegeShort || P.college;
  $("cardMajor").textContent = join(P.major, P.gradYear && `Class of ${P.gradYear}`);
  $("collegeTitle").textContent =
    P.collegeStartYear && P.gradYear ? `${P.college}, ${P.collegeStartYear}–${P.gradYear}` : P.college;
  $("hsTitle").textContent = join(P.highSchool, P.hsGradYear && `Class of ${P.hsGradYear}`);

  // Stats (zero-value stats are hidden)
  const all = [...D.college, ...D.highSchool];
  const hours = all.reduce((n, x) => n + (x.hours || 0), 0);
  const stats = [
    [all.length, all.length, "Organizations"],
    [all.filter((x) => x.leader).length, all.filter((x) => x.leader).length, "Leadership roles"],
    [all.filter((x) => x.category === "Consulting").length, all.filter((x) => x.category === "Consulting").length, "Consulting roles"],
    [hours, hours + "+", "Service hours"],
    [new Set(all.map((x) => x.category)).size, new Set(all.map((x) => x.category)).size, "Areas of involvement"],
  ].filter(([n]) => n > 0);
  $("stats").innerHTML = stats.map(([, v, l]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join("");

  // Cards + filters
  function card(x) {
    const dates = x.start ? `<span class="dates">${esc(x.start)}${x.end ? " – " + esc(x.end) : ""}</span>` : "";
    return `<article class="card" data-cat="${esc(x.category)}">
      <div class="card-top">
        <span class="badge cat-${esc(x.category.toLowerCase())}">${icon(x.category)}${esc(x.category)}</span>
        ${dates}
      </div>
      <h3>${esc(x.org)}</h3>
      <p class="role">${esc(x.role)}${x.leader ? ' <span class="lead">Leadership</span>' : ""}</p>
      <p class="summary">${esc(x.summary)}</p>
      ${x.highlights && x.highlights.length ? `<ul>${x.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
      ${x.hours ? `<p class="hours">${esc(x.hours)} volunteer hours</p>` : ""}
    </article>`;
  }

  function renderGroup(key, sectionId) {
    const list = D[key] || [];
    if (!list.length) return hideSection(sectionId);
    const grid = $(key + "Cards");
    grid.innerHTML = list.map(card).join("");
    const chipsEl = document.querySelector(`.chips[data-for="${key}"]`);
    const cats = [...new Set(list.map((x) => x.category))];
    if (cats.length < 2) { chipsEl.hidden = true; return; }
    chipsEl.innerHTML = ["All", ...cats]
      .map((c, i) => `<button type="button" class="chip" aria-pressed="${i === 0}" data-cat="${esc(c)}">${esc(c)}</button>`)
      .join("");
    chipsEl.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      chipsEl.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      const cat = b.dataset.cat;
      grid.querySelectorAll(".card").forEach((el) => {
        el.hidden = cat !== "All" && el.dataset.cat !== cat;
      });
    });
  }
  renderGroup("college", "college");
  renderGroup("highSchool", "high-school");

  // Timeline: dated entries, newest first (leadership roles only, if there are any)
  const year = (s) => parseInt(String(s || "").match(/\d{4}/)?.[0] || "0", 10);
  const dated = [
    ...D.college.map((x) => ({ ...x, level: "College" })),
    ...D.highSchool.map((x) => ({ ...x, level: "High School" })),
  ].filter((x) => year(x.start));
  const leaders = dated.filter((x) => x.leader);
  const tl = (leaders.length ? leaders : dated).sort((a, b) => year(b.start) - year(a.start));
  if (new Set(tl.map((x) => year(x.start))).size < 2) hideSection("timeline");
  else {
    $("timelineTitle").textContent = leaders.length ? "Leadership over the years" : "Over the years";
    $("timelineList").innerHTML = tl
      .map(
        (x) => `<li>
          <span class="t-year">${esc(year(x.start))}</span>
          <div class="t-body">
            <strong>${esc(x.role)}</strong>
            <span>${esc(x.org)} · ${esc(x.level)}</span>
          </div>
        </li>`
      )
      .join("");
  }

  // Contact
  if (!P.email && !(P.links && P.links.length)) {
    hideSection("contact");
    $("contactBtn").hidden = true;
  }
  else {
    if (P.email) {
      $("emailBtn").textContent = P.email;
      $("emailBtn").href = `mailto:${P.email}`;
    } else $("emailBtn").hidden = true;
    $("linkList").innerHTML = (P.links || [])
      .map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></li>`)
      .join("");
  }
  $("footerText").textContent = `© ${new Date().getFullYear()} ${P.name}`;

  // Theme toggle
  $("themeToggle").addEventListener("click", () => {
    const root = document.documentElement;
    const dark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  });
})();
