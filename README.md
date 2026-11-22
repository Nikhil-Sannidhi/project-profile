# Nikhil Sannidhi · Models of a Career

A personal portfolio written as an interactive research paper. Every section is a numbered figure with a small, live, mathematically real model: Monte Carlo (GBM), gradient descent on a map, logistic fit, k-means, a force-directed network, a trained neural network, a decision tree and Brownian bridges. Plain HTML, CSS and JavaScript, with no build step.

## Edit the content

All text, links and skills live in **`assets/js/content.js`**. It has comments explaining each field. `index.html` also holds a pre-rendered copy so the page reads instantly, but `content.js` always wins when the page loads.

- Skills marked `editable: true` are placeholders. Swap in your real LinkedIn skills.
- Real counts only: keep `stats` honest.

## Replace the résumé

`assets/Nikhil-Sannidhi-Resume.pdf` is a **placeholder**. Overwrite it with your real résumé, keeping the same file name. Every Résumé button links there.

## Fill in the case studies

`work/entrecorps.html`, `work/scno.html` and `work/gies-ambassador.html` are drafts. Replace each bracketed placeholder (for example `[Client: …]` or `[Result: add a metric]`), then remove the "Draft — details coming soon" badge.

## Preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to GitHub Pages

Repo **Settings → Pages → Deploy from a branch**, then pick the branch and `/ (root)`.

## Credits

- [GSAP 3.12.5 + ScrollTrigger](https://gsap.com), self-hosted in `assets/vendor/` (GreenSock standard license).
- US map: [us-atlas](https://github.com/topojson/us-atlas) (US Census Bureau data), projected once with d3-geo (Albers USA) into `assets/data/us-states.svg`.
- Fonts: Newsreader, Inter, JetBrains Mono (Google Fonts).
- Organization logos are trademarks of their respective owners.
