#!/usr/bin/env node
/**
 * The test this whole library stands or falls on: take what the Copy button
 * actually produces, paste it into a blank HTML file with no build step and
 * no packages, and check that it runs.
 *
 * It reads the snippet out of the running site rather than calling the
 * emitter directly, so what's tested is what a visitor gets, not what the
 * emitter thinks it emitted.
 *
 * Usage:
 *   node scripts/paste-test.mjs                 # every animation, both tabs
 *   node scripts/paste-test.mjs --tab jsGsap    # only the GSAP tab
 *   node scripts/paste-test.mjs --tab js        # only the zero-dependency tab
 *   node scripts/paste-test.mjs --only line-draw
 *   node scripts/paste-test.mjs --keep          # leave the pasted files behind
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";
import { readCatalog } from "./lib/catalog.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const animationsDir = join(root, "src/animations");
const outDir = join(root, ".capture/paste");

const args = process.argv.slice(2);
const only = args.reduce(
  (acc, a, i) => (a === "--only" && args[i + 1] ? [...acc, args[i + 1]] : acc),
  [],
);
const tabArg = args.includes("--tab") ? args[args.indexOf("--tab") + 1] : null;
// Both by default: the zero-dependency tab and the GSAP tab make the same
// promise, so verifying only one of them leaves half the claim untested.
const tabs =
  tabArg === "jsGsap"
    ? ["JS + GSAP"]
    : tabArg === "js"
      ? ["JS"]
      : ["JS", "JS + GSAP"];
const keep = args.includes("--keep");

/**
 * Splits the snippet on its own numbered headers rather than on fixed block
 * positions, since the GSAP tab carries an import map the vanilla tab has no
 * need for, and the numbering shifts with it.
 */
function splitBlocks(code) {
  const header =
    /^(?:<!-- (\d+)\. (.*?) -->|\/\* (\d+)\. (.*?) \*\/|\/\/ (\d+)\. (.*?))$/gm;
  const found = [];
  for (const m of code.matchAll(header)) {
    const kind = m[1] ? "html" : m[3] ? "css" : "js";
    found.push({
      kind,
      title: m[2] ?? m[4] ?? m[6],
      start: m.index,
      bodyStart: m.index + m[0].length,
    });
  }
  if (found.length === 0) throw new Error("snippet carried no numbered blocks");
  return found.map((b, i) => ({
    kind: b.kind,
    title: b.title,
    body: code
      .slice(b.bodyStart, i + 1 < found.length ? found[i + 1].start : undefined)
      .trim(),
  }));
}

/**
 * A blank HTML file. Nothing in it but the pasted blocks, each put where its
 * own header says it goes.
 */
function pasteInto(blocks) {
  const css = blocks.filter((b) => b.kind === "css").map((b) => b.body);
  const html = blocks.filter((b) => b.kind === "html");
  const importMaps = html.filter((b) => b.body.includes('type="importmap"'));
  const markup = html.filter((b) => !importMaps.includes(b)).map((b) => b.body);
  const js = blocks.filter((b) => b.kind === "js");
  // An import map only applies to module scripts, and must precede them.
  const moduleScript =
    importMaps.length > 0 || js.some((b) => /^\s*import\s/m.test(b.body));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>paste test</title>
${importMaps.map((b) => b.body).join("\n")}
    <style>
      body { background: #111; color: #eee; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      svg { width: 240px; height: auto; }
${css.length ? `\n${css.join("\n")}\n` : ""}    </style>
  </head>
  <body>
${markup.join("\n")}
    <script${moduleScript ? ' type="module"' : ""}>
${js.map((b) => b.body).join("\n")}
    </script>
  </body>
</html>
`;
}

async function main() {
  const catalog = (await readCatalog(animationsDir)).filter(
    (e) => only.length === 0 || only.includes(e.id),
  );
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const server = await createServer({ root, logLevel: "warn" });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  const browser = await chromium.launch();

  const results = [];

  for (const tabLabel of tabs) {
    console.log(`\n${tabLabel}`);
    for (const entry of catalog) {
      // 1. Read the snippet the Copy button would hand over.
      const reader = await browser.newContext({
        reducedMotion: "no-preference",
      });
      const page = await reader.newPage();
      await page.goto(`${base}a/${entry.id}`, { waitUntil: "load" });
      await page.waitForSelector(".detail-title");
      await page.getByRole("tab", { name: tabLabel, exact: true }).click();
      const code = await page.locator(".code-pre code").innerText();
      await reader.close();

      const blocks = splitBlocks(code);
      const file = join(
        outDir,
        tabLabel.replace(/\W+/g, "-").toLowerCase(),
        entry.id,
        "index.html",
      );
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, pasteInto(blocks));

      // 2. Open that file on its own. No dev server, no bundler, no packages.
      const context = await browser.newContext({
        reducedMotion: "no-preference",
      });

      // Record the rendered state every frame, from the first frame onwards.
      // GSAP doesn't use the Web Animations API — it writes inline styles from
      // its own ticker — so getAnimations() is blind to half of what ships
      // here. Watching computed style instead is the one check that sees both
      // engines, and it is the visual state CLAUDE.md asks to assert on.
      await context.addInitScript(() => {
        window.__frames = [];
        const sample = () => {
          const els = [...document.querySelectorAll("svg *")];
          if (els.length) {
            const cs = els.map((el) => {
              const s = getComputedStyle(el);
              // Geometry attributes matter as much as style here: a clip wipe
              // moves a rect's width, which no computed style on the artwork
              // reflects. Sampling style alone let clip-wipe pass on nothing
              // more than the <defs> appearing.
              const attrs = [
                "width",
                "height",
                "x",
                "y",
                "r",
                "d",
                "clip-path",
              ].map((a) => el.getAttribute(a) ?? "");
              return [
                s.transform,
                s.opacity,
                s.strokeDashoffset,
                s.strokeDasharray,
                ...attrs,
              ].join("|");
            });
            window.__frames.push(cs.join(" "));
          }
          if (window.__frames.length < 600) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });

      const pasted = await context.newPage();
      const errors = [];
      pasted.on("pageerror", (e) => errors.push(e.message));
      pasted.on(
        "console",
        (m) => m.type() === "error" && errors.push(m.text()),
      );
      await pasted.goto(`file://${file}`, { waitUntil: "load" });
      // Give it room to run: a module script fetches GSAP from the CDN first.
      await pasted.waitForTimeout(3000);

      const check = await pasted.evaluate(() => {
        const svg = document.querySelector("svg");
        if (!svg) return { ok: false, why: "no svg in the document" };
        const frames = window.__frames ?? [];
        if (frames.length < 2)
          return {
            ok: false,
            why: `only ${frames.length} rendered frames — the animation clock is frozen, so nothing here is measurable`,
          };
        const distinct = new Set(frames).size;
        if (distinct < 2)
          return {
            ok: false,
            why: "the pasted code never changed the rendered state",
          };
        const settled = frames[frames.length - 1] === frames[frames.length - 2];
        return { ok: true, frames: frames.length, distinct, settled };
      });

      await context.close();

      const pass = check.ok && errors.length === 0;
      results.push({ id: entry.id, tab: tabLabel, pass, errors, check });
      console.log(
        `  ${pass ? "PASS" : "FAIL"}  ${entry.id.padEnd(20)} ${
          check.ok
            ? `${check.frames} frames, ${check.distinct} distinct states, ${check.settled ? "settled" : "still moving"}`
            : check.why
        }${errors.length ? `  errors: ${errors.join("; ")}` : ""}`,
      );
    }
  }

  await browser.close();
  await server.close();
  if (!keep) await rm(outDir, { recursive: true, force: true });

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${results.length - failed.length}/${results.length} pasted and ran`,
  );
  failed.forEach((f) => console.log(`  FAILED: ${f.tab} / ${f.id}`));
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
