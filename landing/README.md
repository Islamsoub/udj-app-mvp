# Unipocket landing (unipocket.io)

This is a static site with no build step: plain HTML, CSS and JS. Nothing loads from another website.

## Preview locally
- **Quickest:** double-click `index.html`. It works from `file://`, offline, in FR and AR (use the FR / ع toggle, or open `index.html?lang=ar`).
- **Like production:** from the repo root, run `npx serve landing` or `python3 -m http.server -d landing 8080`, then open http://localhost:8080.
- `_design/overview.html` shows desktop, tablet and phone in FR and AR side by side. Open it through the local server. **Don't publish `_design/`** (`robots.txt` already disallows it).

## Files
| Path | What it is |
|---|---|
| `index.html`, `404.html`, `privacy.html`, `terms.html` | Pages. Each one inlines the icon sprite right after `<body>` |
| `css/tokens.css` | Every colour, font, size, spacing step, radius, shadow and motion token, plus the `@font-face` rules |
| `css/styles.css` | Layout and components. Uses tokens only |
| `js/main.js` | Language switch, links, menu, sticky bar, reveal, toast. Exposes `window.Unipocket` |
| `js/calculator.js`, `js/qr-card.js`, `js/offline-demo.js` | One file per interactive block |
| `i18n/strings.js` | All FR and AR text, keyed like the `data-i18n` attributes |
| `config/links.js` | Every outgoing link |
| `assets/…` | brand, favicons, icons (+ `icons.svg` sprite), images, screenshots, fonts (WOFF2 + OFL licences) |
| `site.webmanifest`, `robots.txt`, `sitemap.xml` | Meta files (domain: `https://unipocket.io/`) |
| `DESIGN-SPEC.md` | The full spec. **Read §0 "Open questions" first** |

Scripts load with `defer` in this order: `config/links.js` → `i18n/strings.js` → `js/main.js` → block scripts. They are classic scripts, not ES modules, so they still run from `file://`.

## Deploy
Copy the folder to any static host (GitHub Pages, Netlify, Cloudflare Pages, nginx). Exclude `_design/`. Configure `404.html` as the not-found page. Turn on gzip or brotli, and set long cache headers on `assets/`.

## Swapping placeholders
Every placeholder in the HTML carries `data-placeholder="…"`, so you can find it with search. Exact sizes and what the real file should look like are in DESIGN-SPEC §6.

1. **Links:** fill in `config/links.js`. Any key left empty shows a "coming soon" toast when clicked. A social network is only shown once its value is set.
2. **Screenshots (3, already filled from the project prototypes):** to refresh, overwrite the files in `assets/screenshots/` using the **same names and sizes**: `*-1280x800.webp`, `*-640x400.webp` and `*-1280x800.png`. No HTML change is needed. Export the WebP files at quality ~80.
3. **Testimonials and figures:** in `index.html`, find `BEGIN proof-block`. Remove `hidden` from the `<section>` and replace every `[ … ]`. Add the photos as `assets/images/testimonial-*-160x160.webp/.png`. Add the AR text for those strings to `i18n/strings.js` and give each element a `data-i18n` key. If you have no real content, delete everything from `BEGIN` to `END proof-block`.
4. **Legal text:** in `privacy.html` and `terms.html`, replace the contents of `<div class="prose">` and the `[JJ/MM/AAAA]` date. For Arabic, add keys to `strings.js` and `data-i18n` attributes, or serve separate AR pages.
5. **Store badges:** swap the `.store-btn` contents for the official Google Play and App Store badge SVGs (FR and AR). Keep the `data-link` attribute.
6. **Download QR:** `assets/images/qr-download-unipocket-io.svg` encodes `https://unipocket.io/`. To point it somewhere else, regenerate it, e.g. `npx qrcode -t svg -e M -o assets/images/qr-download.svg "https://…"`, then update the `src` in the CTA.

## Editing text
- Change the FR text in **both** the HTML (for no-JS and search engines) and `i18n/strings.js` → `fr`. Change the AR text in `strings.js` → `ar`.
- New element: add `data-i18n="myKey"`, plus the key in `fr` and `ar`. Use `data-i18n-aria` or `data-i18n-alt` for labels and alt text.
- **Have native speakers proofread all Arabic** (DESIGN-SPEC §9).

## Re-subsetting fonts (when copy changes)
The WOFF2 files only contain the characters used on the pages. After adding text with new characters (or new Arabic letters), regenerate them, for example with `pip install fonttools brotli`:
```
pyftsubset PlusJakartaSans[wght].ttf --unicodes="U+0020-007E,U+00A0-00FF,U+0152-0153,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2212,U+00D7,U+00F7,U+20AC,U+2713" --layout-features="*" --flavor=woff2 --output-file=assets/fonts/plus-jakarta-sans-var-latin.woff2
pyftsubset NotoNaskhArabic[wght].ttf --text-file=arabic-chars.txt --layout-features="*" --flavor=woff2 --output-file=assets/fonts/noto-naskh-arabic-var-arabic.woff2
```
Keep `--layout-features="*"`, which Arabic letter joining needs. The source TTFs come from github.com/google/fonts (OFL). The licence files sit next to the fonts.

## Icons
Each icon is one file in `assets/icons/`. If you change or add one, also update `assets/icons/icons.svg` and the inline sprite copy at the top of each page. Pages use `<svg class="i"><use href="#i-NAME"></use></svg>`.
