# Il y a 100 ans aujourd'hui

The front pages of six French daily newspapers, published exactly 100 years ago today.

**→ [arimet.github.io/il-y-a-100-ans](https://arimet.github.io/il-y-a-100-ans/)**

![The six front pages of the day, fanned out on a yellow background](og.jpg)

Every day the site shows the first page of *Le Figaro*, *Le Petit Parisien*, *Le Petit Journal*, *Le Matin*, *L'Humanité* and *Le Temps* as they were printed one century earlier. Click a page to read it full screen and zoom into the articles; use the arrows (or ← →) to move from one day to the next.

## How it works

The scans come from [Gallica](https://gallica.bnf.fr), the digital library of the Bibliothèque nationale de France.

1. `scripts/build.mjs` asks Gallica's `services/Issues` API for the list of issues of each paper, for the year 100 years ago and the next one, and writes a small index to `data/issues.json` (`year → MM-DD → [{ paper, ark }]`).
2. The page loads that index, picks today's date minus 100 years, and displays each front page through Gallica's [IIIF](https://iiif.io) image API. An `<img>` needs no CORS, so the images are loaded straight from Gallica.

The index is generated ahead of time because Gallica sends no CORS headers (the browser cannot call the API) and rejects requests without a `User-Agent`.

No framework, no bundler, no dependency: plain HTML, CSS and JavaScript modules, served as static files by GitHub Pages.

## Development

Requires Node.js 20 or later.

```sh
npm test          # unit tests (node:test)
npm run build     # regenerate data/issues.json (~2 minutes, Gallica is slow)
npm run serve     # http://localhost:8000
```

### Yearly update

The index covers two years. Run `npm run build` once a year and commit `data/issues.json`, otherwise the site runs out of dates.

## Project structure

```
index.html          page, styles and SEO metadata
app.js              rendering, day navigation and full-screen viewer
lib/issues.mjs      Gallica XML parser and URL helpers
scripts/build.mjs   builds data/issues.json from Gallica
data/issues.json    generated index of issues
test/               unit tests
```

## Credits

- Newspaper scans: [gallica.bnf.fr](https://gallica.bnf.fr) / Bibliothèque nationale de France.
- Typeface: [Jost](https://github.com/indestructible-type/Jost) by indestructible type*, under the SIL Open Font License (`fonts/OFL.txt`).

## License

Code under the [MIT License](LICENSE). Made by [Anthony Rimet](https://github.com/arimet).
