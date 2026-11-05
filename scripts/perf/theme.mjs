/**
 * Actual React provider + prepaint comparison against the committed baseline.
 * Build preparation uses Bun; measurements run in one pinned Chromium process.
 * BASELINE_THEMES points at a temporary/cache next-themes 0.4.6 installation.
 * PLAYWRIGHT_MODULE points at a temporary/cache playwright-core ESM entry.
 * NODE_ENV=production bun scripts/perf/theme.mjs [rounds=19]
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const base = "60db7f964668422891acd43732a6be473e419e3b";
assert.equal(process.env.NODE_ENV, "production");
const root = process.cwd();
const require = createRequire(path.join(root, "package.json"));
const baseline = process.env.BASELINE_THEMES;
assert.ok(baseline, "Set BASELINE_THEMES to a next-themes 0.4.6 package directory");
assert.equal(JSON.parse(await readFile(path.join(baseline, "package.json"))).version, "0.4.6");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright-core");
const temporary = await mkdtemp(path.join(tmpdir(), "campus-theme-perf-"));
const rounds = Number(process.argv[2] || 19);
assert.ok(rounds >= 9);
const baselineProvider = execFileSync(
  "git",
  ["show", `${base}:src/components/theme-provider.tsx`],
  { encoding: "utf8" },
);
await writeFile(path.join(temporary, "baseline.tsx"), baselineProvider);
const { transformSync } = require("@babel/core");
const fingerprints = {};
fingerprints["baseline/src/components/theme-provider.tsx"] = createHash("sha256")
  .update(baselineProvider)
  .digest("hex");
for (const file of ["src/components/theme-provider.tsx", "src/lib/theme.ts"]) {
  fingerprints[`candidate/${file}`] = createHash("sha256")
    .update(await readFile(path.join(root, file)))
    .digest("hex");
}
const styles = [];
for (const variant of ["baseline", "candidate"]) {
  for (const control of ["button", "label"]) {
    const file = `src/components/ui/${control}.tsx`;
    const source =
      variant === "baseline"
        ? execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8" })
        : await readFile(path.join(root, file), "utf8");
    fingerprints[`${variant}/${file}`] = createHash("sha256").update(source).digest("hex");
    const compiled = transformSync(source, { filename: path.join(root, file) });
    styles.push(...compiled.metadata.stylex.map((rule) => rule[1].ltr));
    await writeFile(path.join(temporary, `${variant}-${control}.js`), compiled.code);
  }
}
const globals = await readFile(path.join(root, "src/app/globals.css"), "utf8");
await writeFile(path.join(temporary, "constants.js"), "module.exports = {};");
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const stop = async () => {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
  process.exit(130);
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
try {
  const pages = {};
  for (const variant of ["baseline", "candidate"]) {
    const provider =
      variant === "baseline"
        ? path.join(temporary, "baseline.tsx")
        : path.join(root, "src/components/theme-provider.tsx");
    const hook = variant === "baseline" ? "next-themes" : provider;
    const entry = path.join(temporary, `${variant}-entry.tsx`);
    await writeFile(
      entry,
      `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import { flushSync } from "react-dom";
      import { renderToStaticMarkup } from "react-dom/server.browser";
      import { ThemeProvider } from ${JSON.stringify(provider)};
      import { useTheme } from ${JSON.stringify(hook)};
      import { Button, ${variant === "baseline" ? "Button as ButtonLink" : "ButtonLink"} } from ${JSON.stringify(path.join(temporary, `${variant}-button.js`))};
      import { Label } from ${JSON.stringify(path.join(temporary, `${variant}-label.js`))};
      import Link from "next/link";
      const props = ${variant === "baseline" ? '{ attribute: "class", defaultTheme: "system", enableSystem: true }' : "{}"};
      function Consumer() {
        const state = useTheme();
        window.selectTheme = state.setTheme;
        return <span id="state">{state.theme}:{state.resolvedTheme}</span>;
      }
      const html = renderToStaticMarkup(<ThemeProvider {...props}><div /></ThemeProvider>);
      const template = document.createElement("template");
      template.innerHTML = html;
      window.prepaint = new Function(template.content.querySelector("script").textContent);
      let root;
      window.mount = () => {
        root = createRoot(document.getElementById("app"));
        flushSync(() => root.render(<ThemeProvider {...props}><Consumer /></ThemeProvider>));
        flushSync(() => {});
      };
      window.unmount = () => flushSync(() => root.unmount());
      window.toggle = (value) => flushSync(() => window.selectTheme(value));
      window.storageChange = (value) => flushSync(() => window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: value })));
      function Controls({ count, tick }) {
        return <form>{Array.from({ length: count }, (_, index) => <section key={index}>
          <Label htmlFor={"field-" + index}>Student name</Label><input id={"field-" + index} defaultValue="A Student" />
          <Button type="button" variant="outline" size="sm" onClick={() => window.controlClicks++}>Save {tick}</Button>
          ${variant === "baseline" ? '<Button asChild variant="secondary" size="sm"><a href="tel:9876543210">Call</a></Button><Button asChild variant="outline" size="sm"><Link href="/hostels">Hostels</Link></Button>' : '<ButtonLink variant="secondary" size="sm" href="tel:9876543210">Call</ButtonLink><ButtonLink variant="outline" size="sm" href="/hostels">Hostels</ButtonLink>'}
        </section>)}</form>;
      }
      window.controlClicks = 0;
      let controlsRoot;
      window.mountControls = (count) => {
        controlsRoot = createRoot(document.getElementById("controls"));
        flushSync(() => controlsRoot.render(<Controls count={count} tick={0} />));
      };
      window.updateControls = (count, tick) => flushSync(() => controlsRoot.render(<Controls count={count} tick={tick} />));
      window.unmountControls = () => flushSync(() => controlsRoot.unmount());
      window.ready = true;
    `,
    );
    const result = await Bun.build({
      entrypoints: [entry],
      target: "browser",
      minify: true,
      define: {
        "process.env.NODE_ENV": '"production"',
        "process.env": '{"NODE_ENV":"production","__NEXT_TRAILING_SLASH":true}',
      },
      plugins: [
        {
          name: "benchmark-resolution",
          setup(build) {
            build.onResolve(
              { filter: /^(react(?:\/.*)?|react-dom(?:\/.*)?|next-themes)$/ },
              ({ path: specifier }) => ({
                path:
                  specifier === "next-themes"
                    ? path.join(baseline, "dist/index.mjs")
                    : require.resolve(specifier),
              }),
            );
            build.onResolve({ filter: /^@radix-ui\// }, ({ path: specifier }) => {
              const versions = {
                "@radix-ui/react-label": "2.1.17",
                "@radix-ui/react-slot": "1.5.0",
                "@radix-ui/react-primitive": "2.2.0",
                "@radix-ui/react-compose-refs": "1.1.5",
              };
              return {
                path: path.join(
                  path.dirname(baseline),
                  `${specifier}@${versions[specifier]}@@@1/dist/index.mjs`,
                ),
              };
            });
            build.onResolve({ filter: /^next\/link$/ }, () => ({
              path: require.resolve("next/dist/client/app-dir/link.js"),
            }));
            build.onResolve({ filter: /^@stylexjs\/stylex$/ }, () => ({
              path: require.resolve("@stylexjs/stylex"),
            }));
            build.onResolve({ filter: /^@swc\/helpers\// }, ({ path: specifier }) => ({
              path: require.resolve(specifier),
            }));
            build.onResolve({ filter: /^@\/styles\/constants.stylex$/ }, () => ({
              path: path.join(temporary, "constants.js"),
            }));
            build.onResolve({ filter: /^@\// }, ({ path: specifier }) => ({
              path: path.join(root, "src", `${specifier.slice(2)}.ts`),
            }));
          },
        },
      ],
    });
    assert.ok(result.success, result.logs.join("\n"));
    const bundle = await result.outputs[0].text();
    const page = await browser.newPage({ colorScheme: "light" });
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => console.error(variant, error.message));
    await page.route("https://theme-bench.invalid/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html class="font-sans"><body><div id="app"></div><div id="controls"></div></body></html>',
      }),
    );
    await page.goto("https://theme-bench.invalid/");
    await page.addStyleTag({ content: globals + styles.join("\n") });
    await page.addScriptTag({ content: bundle });
    await page.waitForFunction(() => window.ready);
    pages[variant] = page;
    // Actual mounted provider compatibility, including CSS classes and storage.
    await page.evaluate(() => {
      localStorage.setItem("theme", "system");
      window.prepaint();
      window.mount();
    });
    await page.waitForFunction(
      () => document.getElementById("state").textContent === "system:light",
    );
    await page.evaluate(() => window.toggle("dark"));
    assert.equal(await page.evaluate(() => document.documentElement.className), "font-sans dark");
    assert.equal(await page.evaluate(() => localStorage.getItem("theme")), "dark");
    await page.evaluate(() => window.storageChange("light"));
    await page.waitForFunction(
      () => document.getElementById("state").textContent === "light:light",
    );
    await page.evaluate(() => window.storageChange(null));
    await page.waitForFunction(
      () => document.getElementById("state").textContent === "system:light",
    );
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.classList.contains("light"));
    await page.evaluate(() => window.unmount());
    await page.evaluate(() => window.mountControls(24));
    const label = page.locator("label").first();
    await label.click();
    await page.waitForFunction(() => document.activeElement.id === "field-0");
    await page.locator("button").first().focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => window.controlClicks), 1);
    assert.equal(await page.locator('a[href="/hostels"], a[href="/hostels/"]').count(), 24);
    assert.equal(await page.locator('a[href="tel:9876543210"]').count(), 24);
    const markup = await page.locator("#controls").evaluate((element) => {
      function canonical(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        return [
          node.nodeName,
          [...node.attributes]
            .map((attribute) => [attribute.name, attribute.value])
            .sort((a, b) => a[0].localeCompare(b[0])),
          [...node.childNodes].map(canonical),
        ];
      }
      return JSON.stringify(canonical(element));
    });
    if (variant === "baseline") pages.controlMarkup = markup;
    else
      assert.equal(
        markup,
        pages.controlMarkup,
        "actual DOM parity for form, button, tel and internal Next links",
      );
    await page.evaluate(() => window.unmountControls());
  }
  const results = [];
  for (const workload of [
    "prepaint-system",
    "prepaint-saved",
    "mount",
    "toggle",
    "storage",
    "controls-1",
    "controls-24",
    "controls-240",
  ]) {
    const controls = Number(workload.split("-")[1]);
    const count = workload.startsWith("prepaint")
      ? 500
      : workload.startsWith("controls")
        ? Math.max(2, Math.floor(100 / controls))
        : workload === "mount"
          ? 40
          : 150;
    const samples = { baseline: [], candidate: [] };
    for (let round = -4; round < rounds; round++) {
      for (const variant of round % 2 === 0
        ? ["baseline", "candidate"]
        : ["candidate", "baseline"]) {
        const elapsed = await pages[variant].evaluate(
          ({ workload, count }) => {
            localStorage.setItem("theme", workload === "prepaint-saved" ? "dark" : "system");
            const controls = Number(workload.split("-")[1]);
            if (
              !workload.startsWith("controls") &&
              !workload.startsWith("prepaint") &&
              workload !== "mount"
            ) {
              window.mount();
              window.mountControls(24);
            }
            const start = performance.now();
            for (let index = 0; index < count; index++) {
              if (workload.startsWith("controls")) {
                window.mountControls(controls);
                window.updateControls(controls, index + 1);
                document.querySelector("button").click();
                window.layoutSink = document.body.offsetHeight;
                window.unmountControls();
              } else if (workload.startsWith("prepaint")) window.prepaint();
              else if (workload === "mount") {
                window.mount();
                window.unmount();
              } else if (workload === "toggle") window.toggle(index % 2 === 0 ? "dark" : "light");
              else window.storageChange(index % 2 === 0 ? "dark" : "light");
              if (workload === "toggle" || workload === "storage")
                window.layoutSink = document.body.offsetHeight;
            }
            const microseconds = ((performance.now() - start) * 1000) / count;
            if (
              !workload.startsWith("controls") &&
              !workload.startsWith("prepaint") &&
              workload !== "mount"
            ) {
              window.unmountControls();
              window.unmount();
            }
            return microseconds;
          },
          { workload, count },
        );
        if (round >= 0) samples[variant].push(elapsed);
      }
    }
    const summarize = (values) => {
      const sorted = values.toSorted((a, b) => a - b);
      return {
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        min: sorted[0],
        max: sorted.at(-1),
      };
    };
    results.push({
      workload,
      operationsPerSample: count,
      samples: rounds,
      units: "us/op",
      baseline: summarize(samples.baseline),
      candidate: summarize(samples.candidate),
    });
  }
  console.log(
    JSON.stringify(
      {
        baselineRef: base,
        fingerprints,
        browser: await browser.version(),
        preparation: `Bun ${Bun.version}`,
        node: process.versions.node,
        correctness:
          "Actual mounted providers: prepaint, selection, persistence, storage removal, system changes, font classes. Mixed control DOM equality, label focus, keyboard button activation, native tel/internal Next links. Original compiled CSS and forced layout included.",
        warmups: 4,
        order: "alternating paired samples; same browser, separate pages",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
