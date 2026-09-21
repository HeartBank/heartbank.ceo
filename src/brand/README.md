# Vendored — do not edit in place

These files are copies of `brand.333.eco` at the version in `../../brand.lock`.
⛔ **Editing one here is a fork with extra steps.** Change the brand layer, publish it,
re-vendor, and let `npm run check:brand` confirm the hashes.

## ⚠️ The `.ceo` green is UNRESOLVED, and this repo is what forces the question

Two greens are live in the institution right now and they are not the same number:

| where | value | measured for |
|---|---|---|
| the shops artboards + `thank.heartbank.ceo/src/brand.css` | `#15803d` | a surface accent, lifted from the artboards |
| `brand.333.eco` `data/tlds.json` → `candidateValues` | `#00875a` light · `#00a36c` dark | a **letterform** substitution, WCAG 4.5:1, grounds stated |

⭐ `tlds.json` says the rainbow stays unpinned until *"the first heartbank.{TLD} surface
actually needs them, and measure contrast then"*. **This repo is that surface**, so the gate
is met and the two candidates now have to be reconciled rather than both shipped.

⛔ **Not decided here.** This site uses the artboards' `#15803d` so that `heartbank.ceo` and
the shops surfaces match today; pinning the token is a brand-layer version bump and a founder
ratification, ⛔ never a silent edit. Roadmap **A177**.
