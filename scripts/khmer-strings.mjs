#!/usr/bin/env node
// This site's words for the native readers' Khmer review (/khmer-review): every text the pages show, each English page
// paired with its Khmer page run by run (and the footer with partials/footer-km.html), plus the menu labels and the language
// switch's label (vite.config.ts) and the 404 page's Khmer (its data-km attributes), written as the shared strings contract.
// The skill turns it into the review page on demo.heartbank.ceo. The Khmer is OUR DRAFT until a native reader approves it.
//
//   npm run khmer-strings        → staging/khmer-strings.json   (staging/ is ignored by git; never in the site's build)
//   npm run khmer-apply <pulled.json> [--dry]   → the approved Khmer into km/, partials/footer-km.html, vite.config.ts, 404.html
//   npm run khmer-capture        → the review's pictures (a local build of this site, in Khmer)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "../../../.claude/skills/khmer-review");
const { strings, apply } = await import(join(SKILL, "html-site.mjs"));

// the texts outside the pages: each { key, file, re (one capture group: the Khmer), en, note, note_km }
const unq = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
function others(root) {
  const cfg = readFileSync(join(root, "vite.config.ts"), "utf8"), nf = readFileSync(join(root, "404.html"), "utf8");
  const out = [];
  for (const m of cfg.matchAll(/\{ dir: "([a-z-]+)", label: "([^"]+)", label_km: "([^"]+)" \}/g))
    out.push({ key: `menu:${m[1]}`, file: "vite.config.ts", find: `label_km: "${m[3]}"`, make: (k) => `label_km: "${k}"`, en: m[2], km: m[3], note: "the menu at the top of every page", note_km: "ម៉ឺនុយនៅខាងលើគ្រប់ទំព័រ" });
  const g = cfg.match(/group: "(Language)" \},\s*\{ code: "km",[^}]*group: "([^"]+)"/);
  if (g) out.push({ key: "menu:language", file: "vite.config.ts", find: `group: "${g[2]}"`, make: (k) => `group: "${k}"`, en: g[1], km: g[2], note: "the language switch at the top, read aloud by a screen reader (not shown)", note_km: "ប៊ូតុងប្តូរភាសានៅខាងលើ អានឮៗដោយកម្មវិធីអានអេក្រង់ (មិនបង្ហាញ)" });
  for (const [i, m] of [...nf.matchAll(/<(h1|p|a)\b[^>]*data-km="([^"]+)"[^>]*>([^<]+)</g)].entries())
    out.push({ key: `404:${m[1]}${i + 1}`, file: "404.html", find: `data-km="${m[2]}"`, make: (k) => `data-km="${k.replace(/"/g, "&quot;")}"`, en: m[3].trim(), km: unq(m[2]),
      note: "the page shown for an address that is not here (in Khmer for a visitor in Cambodia)", note_km: "ទំព័រដែលបង្ហាញ ពេលអាសយដ្ឋានមិនមាននៅទីនេះ (ជាភាសាខ្មែរ សម្រាប់អ្នកមកលេងនៅកម្ពុជា)" });
  return out;
}

export const cfg = {
  root: ROOT,
  surface: "heartbank.ceo",
  title: "heartbank.ceo",
  about: "The Office of the CEO of HeartBank®: Miss Aquarius℠ as the named Chief Executive, and the franchise arm.",
  about_km: "ការិយាល័យប្រធានប្រតិបត្តិរបស់ HeartBank®៖ Miss Aquarius℠ ជាប្រធានប្រតិបត្តិដែលមានឈ្មោះ និងផ្នែកហ្វ្រេនឆាយ។",
  accent: "#15803d",
  pages: [
    { id: "home", name: "The front page", name_km: "ទំព័រដើម", en: "index.html", km: "km/index.html" },
    { id: "office", name: "The Office (/office/)", name_km: "ការិយាល័យ (/office/)", en: "office/index.html", km: "km/office/index.html" },
    { id: "franchise", name: "Franchise Arm (/franchise/)", name_km: "ផ្នែកហ្វ្រេនឆាយ (/franchise/)", en: "franchise/index.html", km: "km/franchise/index.html" },
    { id: "footer", name: "The footer of every page", name_km: "បាតទំព័រនៃគ្រប់ទំព័រ", en: "partials/footer.html", km: "partials/footer-km.html" },
  ],
  extra: {
    group: ["The menu, and the page for an address that is not here", "ម៉ឺនុយ និងទំព័រសម្រាប់អាសយដ្ឋានដែលមិនមាន"],
    read: (root) => others(root).map(({ key, en, km, note, note_km }) => ({ key, en, km, note, note_km })),
    write: (root, key, km, dry) => {
      const o = others(root).find((x) => x.key === key);
      if (!o) return false;
      const path = join(root, o.file), src = readFileSync(path, "utf8");
      if (src.split(o.find).length !== 2) return false;
      if (!dry) writeFileSync(path, src.replace(o.find, o.make(km)));
      return true;
    },
  },
};

const args = process.argv.slice(2);
if (args[0] === "apply") apply(cfg, JSON.parse(readFileSync(args[1], "utf8")), args.includes("--dry"));
else strings(cfg);
