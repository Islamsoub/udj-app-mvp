# Unipocket landing (unipocket.io)

The site itself is `landing/` at the repo root: a static site with no build step, plain HTML, CSS and JS. Nothing loads from another website.

Everything in `landing/` goes online. This folder, `design/landing-handoff/`, holds what must not: this README, `DESIGN-SPEC.md`, `_design/` and the testimonial photos (`testimonial-photos/`). Paths below are relative to `landing/` unless they start with `design/`.

## Preview locally
- **Quickest:** double-click `landing/index.html`. It works from `file://`, offline, in FR and AR (use the FR / ع toggle, or open `index.html?lang=ar`).
- **Like production:** from the repo root, run `npx wrangler pages dev landing`, then open the address it prints (http://localhost:8788). This is Cloudflare's local Pages server, which applies `_headers`, the clean URLs and `404.html` the same way production does. It runs only on your machine and needs no Cloudflare account. `npx serve landing` also works, but it ignores `_headers`.
- `design/landing-handoff/_design/overview.html` shows desktop, tablet and phone in FR and AR side by side. Serve the **repo root** (for example `npx serve .`) and open `/design/landing-handoff/_design/overview.html`, because its frames load `../../../landing/…`.

## Hosting
Production runs on **Cloudflare Pages** as a plain static site.

- **Build settings:** framework preset *None*, **no build command**, build output directory **`landing`**. The **production branch** is still to be decided.
- **Clean URLs and 404:** Pages does these by itself, with no config. `/privacy` serves `privacy.html`, and `/privacy.html` redirects (308) to `/privacy`. An unknown address gets `404.html` with status 404. Don't delete `404.html`: without it, Pages treats the site as a single-page app and answers every unknown address with the home page.
- **`landing/_headers`:** response headers, in Cloudflare's format. Pages reads it at deploy and never serves it.
  - Every response gets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`. It also drops the `Access-Control-Allow-Origin: *` header that Pages adds by default, since nothing here is meant to be fetched by other sites.
  - `assets/fonts`, `icons`, `brand`, `favicons` and `images` are cached for 30 days. File names aren't hashed, so when you replace one of those files, give it a new name or visitors may keep the old one for up to 30 days.
  - Pages (clean and `.html` paths), `css/`, `js/`, `i18n/` and `config/` are revalidated on every visit. So are screenshots, `robots.txt` and the other meta files, because that is Pages' own default (`public, max-age=0, must-revalidate`).
  - When several rules match one request, Pages **joins** their values with a comma, and two `Cache-Control` values joined that way are invalid. So no path may match two `Cache-Control` rules, and `/*` sets only the security headers. Keep it that way when you add a rule.
- **What Pages serves:** every file in `landing/` except `_headers`. There is no ignore file, so anything that must stay offline lives in this folder.

## Files (in `landing/`)
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
| `_headers` | Cloudflare Pages response headers (see Hosting) |

The full spec is `design/landing-handoff/DESIGN-SPEC.md`. **Read §0 "Open questions" first.**

Scripts load with `defer` in this order: `config/links.js` → `i18n/strings.js` → `js/main.js` → block scripts. They are classic scripts, not ES modules, so they still run from `file://`.

## Deploy elsewhere
Copy `landing/` to any static host (GitHub Pages, Netlify, nginx). Configure `404.html` as the not-found page. Turn on gzip or brotli, and recreate the `_headers` rules in that host's format.

## Swapping placeholders
Every placeholder in the HTML carries `data-placeholder="…"`, so you can find it with search. Exact sizes and what the real file should look like are in DESIGN-SPEC §6.

1. **Links:** fill in `config/links.js`. Any key left empty shows a "coming soon" toast when clicked. A social network is only shown once its value is set.
2. **Screenshots (3, already filled from the project prototypes):** to refresh, overwrite the files in `assets/screenshots/` using the **same names and sizes**: `*-1280x800.webp`, `*-640x400.webp` and `*-1280x800.png`. No HTML change is needed. Export the WebP files at quality ~80.
3. **Testimonials and figures:** in `index.html`, find `BEGIN proof-block`. Remove `hidden` from the `<section>` and replace every `[ … ]`. Add the AR text for those strings to `i18n/strings.js` and give each element a `data-i18n` key. If you have no real content, delete everything from `BEGIN` to `END proof-block`.
   The photos are kept out of the site until then. To turn them on:
   - Copy the real (consented) photos into `landing/assets/images/`. The placeholders are in `design/landing-handoff/testimonial-photos/`.
   - In `index.html`, replace each `<!-- photo-student: … -->` / `<!-- photo-staff: … -->` comment with:
     ```html
     <picture><source type="image/webp" srcset="assets/images/testimonial-student-160x160.webp"><img src="assets/images/testimonial-student-160x160.png" width="80" height="80" loading="lazy" decoding="async" alt="" data-placeholder="testimonial-student"></picture>
     ```
     For the staff photo, write `staff` instead of `student` in all three places.
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
