import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

// heartbank.ceo — a static, multi-page site on GitHub Pages.
//
// ⭐⭐ IT IS STATIC ON PURPOSE, AND THE PURPOSE IS A PROPERTY. The site is the Office of the CEO and
//     nothing else; every B-Shops surface lives on thank.heartbank.ceo. With no Firebase project, no
//     router and no service worker, "the institution site carries no app machinery" is not a rule
//     anyone has to remember — there is nothing here to add a database call TO.
//
// The shape is brand.333.eco's: plain HTML documents, shared chrome resolved at BUILD time, and one
// NAV array that every list of pages is derived from or checked against.
//
// ⚠️ The pages sit at the REPOSITORY ROOT (index.html, office/index.html, 404.html) rather than
//   under src/, because the estate's shared workflows find a page's source by that layout — the
//   snapshot workflow maps /office to office/index.html, and the IndexNow, Google-sitemap and
//   snapshot workflows all read static/sitemap.xml. Those workflow files are byte-identical across
//   the estate and must not be edited to suit one repo, so the repo is laid out to suit them.

// ---------------------------------------------------------------- the pages ---
//
// ONE definition of the site's shape. The build inputs, the header's menu, and the checks on
// static/sitemap.xml and snapshot-urls.txt are all derived from it — a page that is not an input
// cannot appear in the menu, and a page in the menu cannot 404.
//
// `dir` is the directory under the repo root; "" is the home page. `label` is its menu text, or
// null for a page the menu does not list (the home page is the wordmark's link).
const NAV: { dir: string; label: string | null; label_km: string | null }[] = [
    { dir: "", label: null, label_km: null },
    { dir: "office", label: "The Office", label_km: "ការិយាល័យ" },
    { dir: "franchise", label: "Franchise Arm", label_km: "ផ្នែកហ្វ្រេនឆាយ" }
];

// ⭐ EVERY PAGE IN BOTH LANGUAGES (founder 2026-11-22): English at /<dir>/, Khmer at /km/<dir>/. The Khmer is OUR DRAFT
//   until a native reader approves it through /khmer-review, and the Khmer footer says so. Each Khmer page is its own file
//   (km/office/index.html), made from the English page run by run; the review pairs the two by their shape, so keep them in
//   step. The menu labels above, and the language switch's own label below, are the Khmer review's too.
const LANGS = [
    { code: "en", prefix: "", locale: "en_US", name: "EN", group: "Language" },
    { code: "km", prefix: "km", locale: "km_KH", name: "ខ្មែរ", group: "ភាសា" }
] as const;
type Lang = (typeof LANGS)[number]["code"];
const langOf = (path: string): Lang => (path.startsWith("/km/") ? "km" : "en");
// every document the build makes from NAV: one per page per language
const PAGES = NAV.flatMap((n) => LANGS.map((l) => ({ ...n, lang: l.code as Lang, file: join(l.prefix, n.dir, "index.html") })));

// Addresses that USED to be pages. Each gets a generated forwarding document at `from/index.html`,
// because GitHub Pages cannot send a 301 of its own: an instant meta refresh (which search engines
// treat as a permanent redirect) plus a canonical link, plus a script that carries the #fragment.
// ⛔ Never delete a row — a published address is cited somewhere, and a row costs nothing.
// ⚠️ Generated rather than committed, so a forward cannot point at a page that no longer exists:
//   the build fails if `to` is not in NAV, or if `from` is.
const MOVED: { from: string; to: string }[] = [
    // 2026-09-20 — the Office essay was /about/ until the franchise arm got its own page.
    { from: "about", to: "office" }
];

const urlOf = (dir: string, lang: Lang = "en") => {
    const path = [lang === "km" ? "km" : "", dir].filter(Boolean).join("/");
    return path ? `/${path}/` : "/";
};
const ORIGIN = "https://heartbank.ceo";
const ROOT = import.meta.dirname;

// The B-Emblem's path, VENDORED from brand.333.eco (src/brand/emblem.path.txt — the layer ships it
// alone, "for generators", and this build is one). brand.lock hashes it and check-brand.mjs runs
// before every build, so the mark cannot be redrawn here without the build failing.
//
// ⛔ The rotation is baked into the coordinates — never a `transform` attribute, which a CSS
//   animation on `transform` (the heartbeat) would silently override.
const EMBLEM_PATH = readFileSync(join(ROOT, "src/brand/emblem.path.txt"), "utf8").trim();
const emblem = (classes: string) =>
    `<svg class="${classes}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
    `<path fill="currentColor" d="${EMBLEM_PATH}"/></svg>`;

// Shared chrome, resolved at BUILD time rather than by the client — every document shares ONE copy
// of the head, header and footer. transformIndexHtml runs in dev AND build, so what the dev server
// shows is what ships.
function htmlPartials(): Plugin {
    // a Khmer page takes `<name>-km.html` where one exists (the footer); the head and header are one file for both,
    // their language-dependent parts resolved by the directives below
    const read = (name: string, lang: Lang) => {
        const km = join(ROOT, "partials", `${name}-km.html`);
        return readFileSync(lang === "km" && existsSync(km) ? km : join(ROOT, "partials", `${name}.html`), "utf8");
    };

    return {
        name: "ceo-html-partials",
        enforce: "pre",
        transformIndexHtml: {
            order: "pre",
            handler(html, ctx) {
                // ctx.path is "/index.html", "/office/index.html" or "/km/office/index.html" in dev and build alike.
                const here = ctx.path.replace(/index\.html$/, "");
                const lang = langOf(ctx.path);
                const L = LANGS.find((l) => l.code === lang)!;
                // this page's NAV entry (none for 404.html), so the switch and the alternates name its other language
                const page = NAV.find(({ dir }) => urlOf(dir, lang) === here);

                // the language switch: this page in each language (the front page where it has no counterpart)
                const langs =
                    `<span class="flex items-center gap-0.5 border border-line rounded-pill p-0.5 font-mono text-12" role="group" aria-label="${L.group}">` +
                    LANGS.map((l) => {
                        const cur = l.code === lang ? ' aria-current="true"' : "";
                        return `<a href="${urlOf(page?.dir ?? "", l.code)}" hreflang="${l.code}" lang="${l.code}"${cur} class="px-2 py-0.5 rounded-pill no-underline hover:no-underline text-ink-faint hover:text-ink aria-[current=true]:bg-accent-wash aria-[current=true]:text-ink">${l.name}</a>`;
                    }).join("") +
                    `</span>`;
                const alternates = page
                    ? [...LANGS.map((l) => `<link rel="alternate" hreflang="${l.code}" href="${ORIGIN}${urlOf(page.dir, l.code)}" />`),
                       `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${urlOf(page.dir)}" />`].join("\n")
                    : "";

                const nav = NAV.filter(({ label }) => label !== null)
                    .map(({ dir, label, label_km }) => {
                        const url = urlOf(dir, lang);
                        // aria-current tells a screen reader which page this is. ⛔ Not styled:
                        //   the artboard draws no current-page state, so none is invented here.
                        const current = url === here ? ' aria-current="page"' : "";
                        return (
                            `<a href="${url}"${current} class="whitespace-nowrap text-accent-soft hover:text-accent py-0.5">` +
                            `${lang === "km" ? label_km : label}</a>`
                        );
                    })
                    .join("\n        ");

                const out = html
                    .replace(/<!--#include ([a-z]+)-->/g, (_m, name: string) => read(name, lang))
                    .replace("<!--#nav-->", nav)
                    .replace("<!--#langs-->", langs)
                    .replace("<!--#home-->", urlOf("", lang))
                    .replace("<!--#locale-->", L.locale)
                    .replace("<!--#alternates-->", alternates)
                    .replace(/<!--#emblem ([a-z -]+)-->/g, (_m, classes: string) =>
                        emblem(classes.trim())
                    );

                // A surviving directive ships as an HTML comment: invisible, and the page silently
                // loses its header or its mark. Fail the build instead.
                if (/<!--#(include|nav|emblem|langs|home|locale|alternates)/.test(out))
                    throw new Error(`html-partials: an unresolved directive survived in ${ctx.path}`);
                return out;
            }
        }
    };
}

// The lists that CANNOT import NAV, checked against it at build time.
//
// static/sitemap.xml and snapshot-urls.txt are read by GitHub workflows that never run a build, so
// neither can be generated from NAV — both are hand-written copies of the site's shape. Checking
// them here is not as good as generating them, but they are compared against the array they both
// describe, not against each other, so agreeing with each other while both being wrong is caught.
function siteShape(): Plugin {
    return {
        name: "ceo-site-shape",
        apply: "build",
        buildStart() {
            const want = PAGES.map(({ dir, lang }) => ORIGIN + urlOf(dir, lang));

            // The sitemap must list EXACTLY the pages — a missing page is never indexed, and an
            // extra one advertises an address that 404s.
            const sitemap = readFileSync(join(ROOT, "static/sitemap.xml"), "utf8");
            const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
            const missing = want.filter((u) => !locs.includes(u));
            const extra = locs.filter((u) => !want.includes(u));
            if (missing.length || extra.length)
                throw new Error(
                    `static/sitemap.xml disagrees with NAV — missing: ${missing.join(", ") || "none"}; ` +
                        `not a page: ${extra.join(", ") || "none"}`
                );

            // The snapshot manifest must carry every page; it may carry more (retired URLs).
            const manifest = readFileSync(join(ROOT, "snapshot-urls.txt"), "utf8")
                .split("\n")
                .map((l) => l.split("#")[0].trim());
            const unarchived = want.filter((u) => !manifest.includes(u));
            if (unarchived.length)
                throw new Error(
                    `snapshot-urls.txt is missing ${unarchived.join(", ")} — a page in NAV that is ` +
                        `never archived on push`
                );

            // ⛔ The kill switch must keep being served (static/sw.js explains why). Deleting it
            //   strands every browser that still runs the single-page build's worker.
            if (!existsSync(join(ROOT, "static/sw.js")))
                throw new Error("static/sw.js is missing — the old service worker can never be evicted");
            if (/navigator\.serviceWorker\.register/.test(
                ["index.html", "404.html", ...PAGES.map(({ file }) => file)]
                    .map((f) => readFileSync(join(ROOT, f), "utf8"))
                    .join("\n")
            ))
                throw new Error("a page registers a service worker — this site must register none");

            const dirs = NAV.map(({ dir }) => dir);
            for (const { from, to } of MOVED) {
                if (dirs.includes(from)) throw new Error(`MOVED: /${from}/ is still a page in NAV`);
                if (!dirs.includes(to)) throw new Error(`MOVED: /${from}/ forwards to /${to}/, which is not a page`);
            }

            // ⭐ every page in both languages: a Khmer page missing (or one the menu cannot reach) fails the build
            for (const { file } of PAGES)
                if (!existsSync(join(ROOT, file))) throw new Error(`${file} is missing — every page in NAV has an English and a Khmer document`);

            this.info(`site shape: ${NAV.length} pages × ${LANGS.length} languages; sitemap and snapshot manifest agree with NAV`);
        },
        closeBundle() {
            for (const { from, to } of MOVED) {
                const url = ORIGIN + urlOf(to);
                const dir = join(ROOT, "dist", from);
                mkdirSync(dir, { recursive: true });
                writeFileSync(
                    join(dir, "index.html"),
                    `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n` +
                        `<title>Moved — HeartBank® CEO</title>\n` +
                        `<link rel="canonical" href="${url}" />\n` +
                        `<meta http-equiv="refresh" content="0; url=${urlOf(to)}" />\n` +
                        `<script>location.replace(${JSON.stringify(urlOf(to))} + location.hash)</script>\n` +
                        `</head>\n<body>\n<p>This page is now at <a href="${urlOf(to)}">${url}</a>.</p>\n</body>\n</html>\n`
                );
            }
            this.info(`wrote ${MOVED.length} forwarding page(s): ${MOVED.map(({ from, to }) => `/${from}/ → /${to}/`).join(", ")}`);
        }
    };
}

export default defineConfig({
    root: ROOT,
    publicDir: "static",
    // ⭐ A multi-page app: the dev server answers an unknown path with 404 rather than falling back
    //   to index.html, which is what GitHub Pages does in production.
    appType: "mpa",
    plugins: [htmlPartials(), tailwindcss(), siteShape()],
    server: { port: 61283, host: true },
    preview: { port: 61283, host: true },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        target: "es2021",
        rollupOptions: {
            // Derived from NAV, so the menu and the build cannot disagree. 404.html is the one
            // document outside NAV: it is not a page anyone navigates to, and it is not in the
            // sitemap.
            input: {
                ...Object.fromEntries(
                    PAGES.map(({ dir, lang, file }) => [[lang === "km" ? "km" : "", dir].filter(Boolean).join("-") || "index", resolve(ROOT, file)])
                ),
                "404": resolve(ROOT, "404.html")
            }
        }
    }
});
