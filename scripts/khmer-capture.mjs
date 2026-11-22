#!/usr/bin/env node
// The Khmer review's screenshots for this site (/khmer-review capture): the last build (dist/, `npm run build` first) served
// on :4333, every screen of scripts/khmer-states.json in Khmer, written beside the review page on demo.heartbank.ceo.
//   npm run khmer-capture            (then /khmer-review's `sheet` again, so the page lists the pictures, and push the demo repo)
import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL = join(ROOT, "../../../.claude/skills/khmer-review/capture.mjs");
const OUT = join(ROOT, "../demo.heartbank.ceo/khmer/heartbank.ceo/shots");
if (!existsSync(join(ROOT, "dist/index.html"))) { console.error("khmer-capture: no dist/ — npm run build first"); process.exit(1); }
execFileSync("npm", ["run", "-s", "khmer-strings"], { cwd: ROOT, stdio: "inherit" });
// vite itself, not through npx: npx does not pass the stop on, and a server left running keeps this script from exiting
const server = spawn(join(ROOT, "node_modules/.bin/vite"), ["preview", "--port", "4333", "--strictPort"], { cwd: ROOT, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
try {
  execFileSync(process.execPath, [SKILL, "--strings", join(ROOT, "staging/khmer-strings.json"), "--states", join(ROOT, "scripts/khmer-states.json"), "--out", OUT], { stdio: "inherit" });
} finally { server.kill(); }
