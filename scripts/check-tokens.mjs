/**
 * ⭐⭐ THE DIFF THAT MAKES "THE DRAWING IS THE SOURCE" A FACT INSTEAD OF A CLAIM — root-site copy.
 *
 * ⚠️ IN CI THE ARTBOARDS ARE A SECOND CHECKOUT. `demo.heartbank.ceo` is public, so the Pages
 *   workflow checks it out beside this repo and `ARTBOARDS` resolves the same way it does on a
 *   laptop — the guard runs before every deploy, not only before a local build.
 *
 * `src/styles.css` opens with *"Every value below is lifted from `Main.dc.html`"*. That was a claim
 * about the world with nothing performing the diff, which is the standing failure mode of a surface
 * asserting a record nobody made. This is the record (roadmap A204).
 *
 * ⚠️⚠️ IT EXISTS BECAUSE THE SIBLING'S SILENCE WAS READ AS COVERING BOTH. `thank.heartbank.ceo`
 *      has had this guard since A195; the estate has TWO `@theme` blocks fed by the same artboards,
 *      and only one was ever diffed — an instrument watching one member of a class of two
 *      (§the-health-aperture). Run from this directory the sibling's copy immediately found real
 *      defects here, including a base type that had never been set.
 *
 * ⛔ THIS IS A SECOND COPY, AND THAT IS A KNOWN COST. The estate's precedent for a cross-repo script
 *   is `snapshot.yml` — byte-identical everywhere, *never re-diverge* — but these two cannot be
 *   byte-identical, because they answer to DIFFERENT DRAWINGS. The per-repo facts are isolated in
 *   the CONFIG block below so the logic can later move to `shared.333.eco` with the config staying
 *   per repo, the way `brand.uses` already differs beside an identical `check-brand.mjs`. ⏳ That
 *   consolidation is the open half of A204.
 *
 * Reports four things and FAILS on the first three:
 *   ⛔ DRIFTED  — the drawing and the theme disagree on a value
 *   ⛔ MISSING  — the drawing has it, the theme does not
 *   ⛔ UNASSIGNED — an artboard exists that nobody has said is ours or not (see below)
 *                 ⚠️ *Unassigned*, and deliberately not the other word (sig-ok: naming the rule): `/check`'s `registry-absence` reads
 *                 the latter as B-Registry's sense — a name nobody has registered, which
 *                 must never be rendered as a state — and it is a different concept. This
 *                 is the more precise word anyway, which is the only reason it was changed;
 *                 ⛔ a regex is not a reason to rename honest code (roadmap A205).
 *   ⚠️ SPLIT / UNDRAWN — reported, never fatal
 *
 * ⚠️ It can only see tokens that were WRITTEN. An artboard that styles with a literal instead of
 *   its own token is invisible here.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/* ------------------------------------------------------------------ CONFIG --- */
/* ⚠️ The only per-repo block. Everything below it is the sibling's logic. */

const ARTBOARDS = "../demo.heartbank.ceo";
const THEME = "src/styles.css";

/**
 * ⛔⛔ THE ROOT SITE'S DRAWINGS ARE THREE OF THIRTY-EIGHT. The other 35 are the shops app's and
 *     belong to `thank.heartbank.ceo`, which diffs them against its own theme. Checking all 38
 *     here is what made the sibling's copy report `--font-khmer` MISSING — true of the shops
 *     drawings, false of this site's.
 */
const ROOT_DRAWINGS = ["Main.dc.html"];

/**
 * ⭐⭐ A HAND-KEPT LIST GOES STALE, SO THE INSTRUMENT WATCHES THE CLASS GROW. If a `.dc.html`
 *     appears that is neither a root drawing nor one of the shops app's, this FAILS and asks whose
 *     it is. ⛔ Without this the scope narrows silently every time somebody draws a new screen,
 *     which is the aperture failure the row above was opened for — one level up.
 */
const EXPECTED_OTHERS = 37;

/**
 * ⭐ ONE DRAWING, SO NOTHING CAN SPLIT. `Main.dc.html` states `font-size:16px; line-height:1.65`
 *   and it is the only root drawing there is. ⚠️ The machinery for a SPLIT is deliberately kept —
 *   it reported a real one until 2026-09-20 — so a second root drawing that disagrees is caught
 *   the day it appears rather than silently averaged.
 */
const BASE_TYPE_REFERENCE = "Main.dc.html";
const BODY_PROPS = ["font-size", "line-height"];

/**
 * ⭐ DOES THIS SITE RENDER THROUGH SHADOW ROOTS? The `:host` checks below exist because a Lit app
 *   adopts the sheet into every component, where preflight's `html, :host` rule beats inheritance
 *   from `<body>` (A203). ⛔⛔ This site stopped being a Lit app on 2026-09-20 (A211): it is plain
 *   static HTML with no components, so `:host` matches nothing and requiring a rule there would
 *   demand dead CSS. ⚠️ Stated as a switch rather than deleted, so the day a component returns,
 *   turning this back on restores the check that would otherwise have been forgotten.
 */
const SHADOW_ROOTS = false;

/** The drawing's names → Tailwind's namespaces. Anything not listed is not a theme token. */
const FOLD = {
    "--bg": "--color-bg",
    "--bg-tint": "--color-bg-tint",
    "--surface": "--color-surface",
    "--surface-2": "--color-surface-2",
    "--line": "--color-line",
    "--line-strong": "--color-line-strong",
    "--ink": "--color-ink",
    "--ink-dim": "--color-ink-dim",
    "--ink-faint": "--color-ink-faint",
    "--accent": "--color-accent",
    "--accent-soft": "--color-accent-soft",
    "--accent-ink": "--color-accent-ink",
    "--accent-wash": "--color-accent-wash",
    "--accent-edge": "--color-accent-edge",
    "--font-display": "--font-display",
    "--font-text": "--font-text",
    "--font-mono": "--font-mono",
    "--font-khmer": "--font-khmer",
    "--r-card": "--radius-card",
    "--r-control": "--radius-control",
    "--r-pill": "--radius-pill"
};

/* -------------------------------------------------------------------- LOGIC --- */

/**
 * ⚠️ `rgba(20,16,30,.12)` and `rgba(20, 16, 30, 0.12)` are THE SAME COLOUR and must compare equal.
 * ⛔⛔ The sibling normalises whitespace only, so it reported four of those as DRIFTED on this
 *     repo's theme — and an instrument that cries wolf on a correct value is one people learn to
 *     silence.
 * ⚠️⚠️ AND A LEADING-ZERO FIX ALONE WAS NOT ENOUGH — it then reported `0.1` ≠ `0.10`, which is the
 *      same wolf one digit over. Every numeric literal is put in canonical form instead of
 *      patching the two spellings that happened to show up. ⭐ A number is matched only after a
 *      start, space, `(` or `,`, which is what keeps `#f4f1fb` out of it.
 */
const canon = (n) => String(parseFloat(n));
const norm = (v) =>
    v
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/,\s+/g, ",")
        .replace(/;$/, "")
        .replace(/(^|[\s,(])(\d*\.?\d+)/g, (_, pre, n) => pre + canon(n));

function declarations(block) {
    const out = new Map();
    for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;}]+)/gi)) out.set(m[1], norm(m[2]));
    return out;
}

/** Every `prop: value` in a block, not only the custom properties. */
function allDeclarations(block) {
    const out = new Map();
    for (const m of block.matchAll(/([a-z-]+)\s*:\s*([^;}]+)/gi)) out.set(m[1].toLowerCase(), norm(m[2]));
    return out;
}

/**
 * EVERY rule whose selector list contains `sel`, merged in source order — ⛔ not the first match.
 * A stylesheet may split the ground from the type across two rules, and a first-match read reports
 * the second one MISSING however correct it is.
 */
function ruleFor(src, sel) {
    const out = new Map();
    for (const m of src.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g))
        if (m[1].split(",").some((s) => s.trim() === sel || s.trim().endsWith(` ${sel}`)))
            for (const [k, v] of allDeclarations(m[2])) out.set(k, v);
    return out;
}

function fromArtboards(dir) {
    const all = readdirSync(dir).filter((f) => f.endsWith(".dc.html"));
    if (all.length === 0) throw new Error(`no artboards found in ${dir}`);
    const unassigned = [];
    const others = all.filter((f) => !ROOT_DRAWINGS.includes(f));
    if (others.length !== EXPECTED_OTHERS)
        unassigned.push(
            `${others.length} non-root artboards, expected ${EXPECTED_OTHERS} — somebody drew a ` +
                `screen and nobody said whose it is. Add it to ROOT_DRAWINGS if this site renders ` +
                `it, or raise EXPECTED_OTHERS if the shops app does.`
        );
    for (const f of ROOT_DRAWINGS)
        if (!all.includes(f)) unassigned.push(`${f} is named as a root drawing and does not exist`);

    const said = new Map(); // token -> Map(value -> [files])
    const body = new Map(); // prop  -> Map(value -> [files])
    for (const f of ROOT_DRAWINGS) {
        if (!all.includes(f)) continue;
        const src = readFileSync(join(dir, f), "utf8");
        const root = src.match(/:root\s*\{([^}]*)\}/);
        if (root)
            for (const [name, value] of declarations(root[1])) {
                if (!(name in FOLD)) continue;
                const by = said.get(name) ?? new Map();
                by.set(value, [...(by.get(value) ?? []), f]);
                said.set(name, by);
            }
        for (const [prop, value] of ruleFor(src, "body")) {
            if (!BODY_PROPS.includes(prop)) continue;
            const by = body.get(prop) ?? new Map();
            by.set(value, [...(by.get(value) ?? []), f]);
            body.set(prop, by);
        }
    }
    return { said, body, unassigned };
}

/** The theme: the FIRST `@theme { … }` of the stylesheet. */
function fromTheme(path) {
    const src = readFileSync(path, "utf8");
    const i = src.indexOf("@theme");
    if (i < 0) throw new Error(`no @theme block in ${path}`);
    const open = src.indexOf("{", i);
    let depth = 0,
        end = open;
    for (let j = open; j < src.length; j++) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}" && --depth === 0) {
            end = j;
            break;
        }
    }
    // ⛔ Strip comments first: a token named inside a `/* … */` is prose, not a declaration.
    return declarations(src.slice(open + 1, end).replace(/\/\*[\s\S]*?\*\//g, ""));
}

const { said, body, unassigned } = fromArtboards(ARTBOARDS);
const themeSrc = readFileSync(THEME, "utf8");
const theme = fromTheme(THEME);
const drifted = [],
    missing = [],
    split = [],
    undrawn = [];

for (const [drawn, by] of said) {
    const mapped = FOLD[drawn];
    if (by.size > 1)
        split.push(
            `${drawn} — the root drawings disagree: ` +
                [...by].map(([v, fs]) => `${v} (${fs.join(", ")})`).join(" vs ")
        );
    const [value] = [...by.keys()];
    if (!theme.has(mapped))
        missing.push(`${drawn} = ${value} — the drawing has it, ${THEME} does not (as ${mapped})`);
    else if (theme.get(mapped) !== value)
        drifted.push(`${mapped}: theme ${theme.get(mapped)} ≠ drawing ${value} (${drawn})`);
}

/**
 * ⛔⛔ THE BASE TYPE IS CHECKED IN TWO PLACES, AND THE SECOND ONE IS THE ONE THAT MATTERS (A203).
 *
 * `body` is what the sibling checks, and on a Lit app it is NOT what the screens render through:
 * Tailwind's preflight puts `line-height` and `font-family` on `html, :host`, and every component
 * adopts this sheet — so that rule lands on each component's own host and beats inheritance from
 * `<body>`. The sibling's `body`-only check passed while every shops screen rendered at 1.5.
 * ⚠️ HONEST BOUND: this is a STATIC read of the stylesheet. It proves the rule is WRITTEN, never
 *   that the browser computes it — the measurement that found the defect adopted the BUILT sheet
 *   into a shadow root and read `getComputedStyle`. This catches the regression; it is not that.
 */
const ourBody = ruleFor(themeSrc, "body");
const ourHost = ruleFor(themeSrc, ":host");
for (const [prop, by] of body) {
    if (by.size > 1)
        split.push(
            `body { ${prop} } — the root drawings disagree: ` +
                [...by].map(([v, fs]) => `${v} (${fs.join(", ")})`).join(" vs ") +
                ` — comparing against ${BASE_TYPE_REFERENCE}; ⏳ unruled (A204)`
        );
    const ref = [...by].find(([, fs]) => fs.includes(BASE_TYPE_REFERENCE));
    if (!ref) continue;
    const value = ref[0];
    // ⛔⛔ `:host` IS CHECKED ONLY FOR WHAT PREFLIGHT ACTUALLY OVERRIDES, and font-size is not it.
    //    Preflight sets `line-height` and `font-family` on `html, :host` — never `font-size` — so
    //    font-size inherits from `body` correctly and needs no restatement. ⚠️ Pinning it at every
    //    shadow host would be worse than useless: it would reset any nested type scale a component
    //    sits inside. *Require what is overridden; requiring more is a different bug.*
    const HOST_PROPS = SHADOW_ROOTS ? ["line-height"] : [];
    for (const [where, rule] of [
        ["body", ourBody],
        ...(HOST_PROPS.includes(prop) ? [[":host", ourHost]] : [])
    ]) {
        if (!rule.has(prop))
            missing.push(`${where} { ${prop}: ${value} } — ${BASE_TYPE_REFERENCE} states it, ${THEME}'s ${where} rule does not`);
        else if (rule.get(prop) !== value)
            drifted.push(`${where} { ${prop} }: theme ${rule.get(prop)} ≠ drawing ${value}`);
    }
}
// `font-family` is not in BODY_PROPS (the drawings say `var(--font-text)`, which is ours too), but
// a `:host` rule that forgets it is exactly the A202 defect, so require it by name.
if (SHADOW_ROOTS && !ourHost.has("font-family"))
    missing.push(`:host { font-family } — absent, so preflight supplies its own system stack (A202)`);

const mappedNames = new Set(Object.values(FOLD));
for (const [name, value] of theme)
    if (!mappedNames.has(name)) undrawn.push(`${name} = ${value} — carried by the build, drawn nowhere`);

const say = (mark, title, rows) => {
    if (rows.length) {
        console.error(`\n${mark} ${title}`);
        for (const r of rows) console.error(`   ${r}`);
    }
};
say("⛔", "UNASSIGNED", unassigned);
say("⛔", "DRIFTED", drifted);
say("⛔", "MISSING", missing);
say("⚠️", "SPLIT — reported, not a failure", split);
say("⚠️", `UNDRAWN (${undrawn.length}) — reported, not a failure`, undrawn);

// ⛔ The scope is PRINTED on every run, pass or fail. An instrument that narrows its field of view
//   silently is the defect this one was written for.
console.log(`\nscope: ${ROOT_DRAWINGS.join(" · ")} (${EXPECTED_OTHERS} shops artboards are ` +
    `thank.heartbank.ceo's and are not read here)`);

const bad = unassigned.length + drifted.length + missing.length;
if (bad) {
    console.error(
        `\n${bad} token defect(s). ⛔ The drawing is the source — fix ${THEME}, or change the ` +
            `artboards first and then this.\n`
    );
    process.exit(1);
}
console.log(
    `tokens ok — ${said.size} tokens + ${body.size} base-type rules (${SHADOW_ROOTS ? "body AND :host" : "body — no shadow roots"}) agree with ` +
        `${ROOT_DRAWINGS.length} root drawings` +
        (split.length ? `; ${split.length} split` : "") +
        (undrawn.length ? `; ${undrawn.length} undrawn` : "")
);
