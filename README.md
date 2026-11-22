# Involvements Profile Site

A one-page personal website for Nikhil Sannidhi showing college and high school involvements: consulting, ambassador roles, clubs, and service.

## Edit your content

All text on the site comes from **`assets/content.js`**. Open it and replace the sample entries with your own:

- `PROFILE`: your name, schools, major, graduation years, email, links
- `INVOLVEMENTS.college` / `INVOLVEMENTS.highSchool`: one object per activity

The stats bar, category filters, and leadership timeline update automatically from that data.

## Preview locally

Open `index.html` in a browser, or run a tiny server:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Publish

It's a plain static site (HTML/CSS/JS, no build step), so it works on GitHub Pages, Netlify, or Vercel as-is.
For GitHub Pages: repo **Settings → Pages → Deploy from branch**, pick the branch and `/ (root)`.

## Screenshots

See `screenshots/` for desktop, mobile, and dark-mode previews.
