# CLAUDE.md — `heartbank.ceo`

**Deploys to `heartbank.ceo`** — the Office of the CEO of HeartBank® (Miss Aquarius℠ as the named,
autonomous Chief Executive). ⚠️ **A PUBLIC repository**: everything committed here is published,
history included. Nothing private belongs in it — no plans, no figures, no pointers into private notes.

**Stack: a static, multi-page site** — Vite + Tailwind v4, plain HTML, deployed to **GitHub Pages**
by `.github/workflows/pages-deploy.yml`. Rebuilt from scratch on 2026-09-20; until then this domain
was a Lit single-page app on Firebase Hosting, now in the private `HeartBank/heartbank.ceo-firebase`.

## Commands

- `npm run dev` — Vite dev server on port 61283
- `npm run build` — three guards (`prebuild`), then `vite build` → `dist/`
- `npm run preview` — serve `dist/`
- `npm run brand:sync -- --from <path to brand.333.eco>` — re-vendor the brand layer

## ⭐⭐ Why it is static — and why that is a property, not a preference

The site is **the Office and nothing else**: every B-Shops surface (`/find`, opening a shop, the
verify hop) lives on `thank.heartbank.ceo`. With no Firebase project, no router and no service worker,
*"the institution site carries no app machinery"* is not a rule anyone has to remember — **there is
nothing here to add a database call to.** ⛔ Do not add one. A surface that needs data belongs to the
shops app.

## Layout

```
index.html            /         the Office — a build of demo.heartbank.ceo/Main.dc.html
office/index.html     /office/     the Office-of-the-CEO essay (no artboard: composed from the tokens)
franchise/index.html  /franchise/  the franchise arm — B-Tag™, B-Affiliate/B-Member, the pricing CEO
404.html              any unknown path — GitHub Pages serves it with a real 404 status
partials/             head · header · footer, substituted at BUILD time (vite.config.ts)
src/styles.css        @theme = the artboard's tokens
src/brand/            VENDORED from brand.333.eco — never edit in place
static/               copied verbatim: CNAME · robots · sitemap · analytics.js · IndexNow key · sw.js · icons
scripts/              check-brand.mjs (byte-identical estate-wide) · check-tokens.mjs
```

⚠️ **The pages sit at the repository root, not under `src/`,** because the estate's shared workflows
find a page's source by that layout (`snapshot.yml` maps `/office` → `office/index.html`) and read
`static/sitemap.xml` without building. ⛔ Those workflow files are **byte-identical across the estate**
— lay the repo out to suit them; never edit them to suit the repo.

⭐⭐ **ONE definition of the site's shape: `NAV` in `vite.config.ts`.** The build inputs and the header
menu are derived from it; `static/sitemap.xml` and `snapshot-urls.txt` (which the workflows read raw,
so they cannot be generated) are **checked against it**, and the build FAILS if either disagrees.
**To add a page:** add it to `NAV`, create `<dir>/index.html`, add its URL to both files, and add the
file to the `@source` list in `styles.css`. ⭐ **To move one, add a `MOVED` row** — the build writes a
forwarding page at the old address (GitHub Pages cannot 301 on its own) and fails if the target is not
a page. ⛔ Never delete a `MOVED` row; `/about/` → `/office/` is the first (2026-09-20).

## The design — the artboard is the spec, including its numbers

⭐⭐ **The design of record is `../demo.heartbank.ceo/Main.dc.html`.** Every colour, size, radius and
face reaches the build through `@theme` in `src/styles.css`, and **`npm run tokens:check` diffs it
against the drawing before every build** — in CI too, where the workflow checks the (public) demo
repo out as a sibling. ⛔ **Never style this site with Tailwind's default scale** (`emerald-700`,
`text-4xl`, `rounded-2xl`, `gray-200`) — another design system's numbers produce a page that looks
*nearly* like its drawing, which is the one failure the artboards exist to prevent.

- ⭐ The illustrations in `index.html` are the artboard's own SVG, lifted verbatim. ⛔ Never redraw
  them; change the artboard first and re-extract. ⛔ The office scene is empty on purpose — no face,
  avatar or portrait.
- ⚠️ `/office/` and `/franchise/` have **no artboard**: they are composed from the existing tokens and the home page's own
  devices. ⛔ No new numbers there.
- ⭐ Dark mode follows the OS via `@media (prefers-color-scheme: dark)` — there is no toggle and no
  script to stamp a class. The dark palette is derived from the light one, not redrawn.
- ⛔ **Tailwind's sources are NAMED in `styles.css`, not detected** — detection honours `.gitignore`
  only inside a git repository, and a build from a fresh copy scanned `node_modules/` (63 kB of
  unused utilities). A new file that carries class names must be added to the `@source` list.

## The brand layer — vendored, guarded

`brand.uses` declares what this repo takes from `brand.333.eco`; `brand.lock` hashes it;
`check-brand.mjs` runs in `prebuild`, so a drifted copy **fails the build** rather than shipping.
⛔ Never `npm install` the brand package here, and never edit `src/brand/`.

- ⭐ **The B-Wordmark is a composition, not an asset.** The header's `<!--#emblem …-->` directive is
  replaced at build time with an inline `<svg>` built from the vendored `emblem.path.txt`, so
  `currentColor` reaches it. ⛔ Never `<img src>`, never a `wordmark.svg`. The mark stands for the B in
  *Bank*, never the H in *Heart*; `.beating` goes on the `<svg>` (chrome only, never beside a
  person's name).
- ⚠️ **Its geometry is measured, not tuned** — `mark.geometry` in `brand.333.eco/data/brand.json`.
  `styles.css` carries the four insets (they differ because the path is not centred) and the one
  number that is this site's: Newsreader's cap height, `.7083em`. ⛔ Never `transform: scale()`.
- ⚠️ `tokens.css` is vendored and deliberately **not imported**: its `--accent` is a different green
  from the artboard's `#15803d`, and the two are unreconciled (`src/brand/README.md`).

## `static/sw.js` is a KILL SWITCH — keep serving it

⛔⛔ **No page on this site registers a service worker, and the build fails if one does.** The file
exists because the Firebase-era app registered a worker at `/sw.js` with scope `/`, and it is still
installed in every browser that opened the old site. When such a browser re-checks the script, it
gets this one, which drops every cache, unregisters itself and reloads the page. ⛔ **Deleting it
strands whoever has not come back yet** — cheap to keep, expensive to remove. ⛔ Line comments only in
that file (a block comment containing its own terminator once broke a sibling's copy).

## Search, previews, analytics

- `robots.txt` allows everything; the sitemap lists `/`, `/office/` and `/franchise/`. `404.html` hides itself from
  search **by named crawler** (`googlebot`, `bingbot`), never a blanket `robots` meta — a link-preview
  crawler can read the blanket form as "do not process" too.
- ⛔ `og:image` must be an **absolute** URL, or previews render without an image and nothing errors.
- `static/analytics.js` — Cloudflare Web Analytics + the estate's first-party `page_view` beacon to
  `thonly.org/api/track`; no-ops on local hosts. Plain script, no Firebase.
- `/about` → 301 `/about/` (GitHub Pages) → the generated forwarding page → `/office/`. The essay's
  franchise sections moved to `/franchise/` the same day.

## Workflows

`pages-deploy.yml` (this repo's) · `snapshot.yml`, `indexnow.yml`, `google-sitemap.yml` (estate-wide,
byte-identical — ⛔ never edit here). The Google leg needs the `GOOGLE_SITEMAP_CREDENTIALS` secret and
skips gracefully without it. **A public repo's Actions minutes are free.**

## Verifying a deploy

⛔ **Do not trust "deployed".** Fetch the live page and grep it for the new copy *and* the old.
⭐ A browser, not `curl`, is the only check for anything involving a service worker.
