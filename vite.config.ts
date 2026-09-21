import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";
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
// ⚠️ The pages sit at the REPOSITORY ROOT (index.html, about/index.html, 404.html) rather than
//   under src/, because the estate's shared workflows find a page's source by that layout — the
//   snapshot workflow maps /about to about/index.html, and the IndexNow, Google-sitemap and
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
const NAV: { dir: string; label: string | null }[] = [
    { dir: "", label: null },
    { dir: "about", label: "The Office" }
];

const urlOf = (dir: string) => (dir === "" ? "/" : `/${dir}/`);
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

// Shared chrome, resolved at BUILD time rather than by the client — three documents share ONE copy
// of the head, header and footer. transformIndexHtml runs in dev AND build, so what the dev server
// shows is what ships.
function htmlPartials(): Plugin {
    const read = (name: string) => readFileSync(join(ROOT, "partials", `${name}.html`), "utf8");

    return {
        name: "ceo-html-partials",
        enforce: "pre",
        transformIndexHtml: {
            order: "pre",
            handler(html, ctx) {
                // ctx.path is "/index.html" or "/about/index.html" in dev and build alike.
                const here = ctx.path.replace(/index\.html$/, "");

                const nav = NAV.filter(({ label }) => label !== null)
                    .map(({ dir, label }) => {
                        const url = urlOf(dir);
                        // aria-current tells a screen reader which page this is. ⛔ Not styled:
                        //   the artboard draws no current-page state, so none is invented here.
                        const current = url === here ? ' aria-current="page"' : "";
                        return (
                            `<a href="${url}"${current} class="text-accent-soft hover:text-accent">` +
                            `${label}</a>`
                        );
                    })
                    .join("\n        ");

                const out = html
                    .replace(/<!--#include ([a-z]+)-->/g, (_m, name: string) => read(name))
                    .replace("<!--#nav-->", nav)
                    .replace(/<!--#emblem ([a-z -]+)-->/g, (_m, classes: string) =>
                        emblem(classes.trim())
                    );

                // A surviving directive ships as an HTML comment: invisible, and the page silently
                // loses its header or its mark. Fail the build instead.
                if (/<!--#(include|nav|emblem)/.test(out))
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
            const want = NAV.map(({ dir }) => ORIGIN + urlOf(dir));

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
                ["index.html", "404.html", ...NAV.map(({ dir }) => join(dir, "index.html"))]
                    .map((f) => readFileSync(join(ROOT, f), "utf8"))
                    .join("\n")
            ))
                throw new Error("a page registers a service worker — this site must register none");

            this.info(`site shape: ${NAV.length} pages; sitemap and snapshot manifest agree with NAV`);
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
                    NAV.map(({ dir }) => [dir === "" ? "index" : dir, resolve(ROOT, dir, "index.html")])
                ),
                "404": resolve(ROOT, "404.html")
            }
        }
    }
});
