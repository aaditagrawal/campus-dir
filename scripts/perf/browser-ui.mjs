// StyleX port fixture measures only the consumed theme API.
/**
 * Actual React provider + prepaint comparison against the committed baseline.
 * Build preparation uses Bun; measurements run in one pinned Chromium process.
 * BASELINE_THEMES points at a temporary/cache next-themes 0.4.6 installation.
 * PLAYWRIGHT_MODULE points at a temporary/cache playwright-core ESM entry.
 * NODE_ENV=production bun scripts/perf/browser-ui.mjs [rounds=25]
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir, cpus, loadavg } from "node:os";
import path from "node:path";

const base = "e3b74374ce6f439eee044b2eefbd7a09f42c8ee3";
assert.equal(process.env.NODE_ENV, "production");
const root = process.cwd();
const environment = { cpu: cpus()[0].model, cores: cpus().length, load: loadavg() };
const require = createRequire(path.join(root, "package.json"));
const baseline = process.env.BASELINE_THEMES;
assert.ok(baseline, "Set BASELINE_THEMES to a next-themes 0.4.6 package directory");
assert.equal(JSON.parse(await readFile(path.join(baseline, "package.json"))).version, "0.4.6");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright-core");
const temporary = await mkdtemp(path.join(tmpdir(), "campus-theme-perf-"));
const checkOnly = process.argv.includes("--check-only");
const rounds = checkOnly ? 25 : Number(process.argv[2] || 25);
assert.ok(rounds >= 9);
const baselineProvider = execFileSync(
  "git",
  ["show", `${base}:src/components/theme-provider.tsx`],
  { encoding: "utf8" },
);
await writeFile(path.join(temporary, "baseline.tsx"), baselineProvider);
const { transformSync } = require("@babel/core");
const summarize = (values) => {
  const sorted = values.toSorted((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    min: sorted[0],
    max: sorted.at(-1),
  };
};
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
const hydrationConsumer = `function HydrationConsumer() {
  const { theme } = useTheme();
  const mounted = useIsClient();
  return <span id="hydration-state" data-icon={mounted && theme === "dark" ? "sun" : "moon"}>{mounted ? theme : "pending"}</span>;
}`;
for (const variant of ["baseline", "candidate"]) {
  for (const control of ["button", "label"]) {
    const file = `src/components/ui/${control}.tsx`;
    let source =
      variant === "baseline"
        ? execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8" })
        : await readFile(path.join(root, file), "utf8");
    fingerprints[`${variant}/${file}`] = createHash("sha256").update(source).digest("hex");
    if (control === "label")
      source +=
        '\nconst benchmarkFields = stylex.create({ field: { display: "block", marginBottom: "0.5rem" }, large: { display: "block", marginBottom: "0.75rem" } }); export const benchmarkFieldLabel = benchmarkFields.field; export const benchmarkFieldLabelLarge = benchmarkFields.large;';
    if (control === "button")
      source +=
        '\nconst benchmarkActual = stylex.create({ copy: { height: "1.75rem", paddingInline: "0.5rem", cursor: "pointer" }, favorite: { position: "relative", zIndex: 20, cursor: "pointer", transitionProperty: "color, background-color, border-color, box-shadow, transform, opacity", transitionDuration: "200ms" }, small: { width: "1.75rem", height: "1.75rem" } }); export const benchmarkCopyButton = benchmarkActual.copy; export const benchmarkFavorite = benchmarkActual.favorite; export const benchmarkFavoriteSize = benchmarkActual.small;';
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
  const hydrationProof = {};
  for (const variant of ["baseline", "candidate"]) {
    const provider =
      variant === "baseline"
        ? path.join(temporary, "baseline.tsx")
        : path.join(root, "src/components/theme-provider.tsx");
    const hook = variant === "baseline" ? "next-themes" : provider;
    const entry = path.join(temporary, `${variant}-entry.tsx`);
    const serverEntry = path.join(temporary, `${variant}-server.tsx`);
    await writeFile(
      serverEntry,
      `
      import React from "react";
      import { renderToString } from "react-dom/server";
      import { ThemeProvider } from ${JSON.stringify(provider)};
      import { useTheme } from ${JSON.stringify(hook)};
      import { useIsClient } from ${JSON.stringify(path.join(root, "src/hooks/useClientSnapshot.ts"))};
      ${hydrationConsumer}
      console.log(JSON.stringify({ hasWindow: !!globalThis.window, markup: renderToString(<ThemeProvider attribute="class" defaultTheme="system" enableSystem><HydrationConsumer /></ThemeProvider>) }));
    `,
    );
    const serverBuild = await Bun.build({
      entrypoints: [serverEntry],
      target: "bun",
      define: { "process.env.NODE_ENV": '"production"' },
      plugins: [
        {
          name: "server-fixture-resolution",
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
            build.onResolve({ filter: /^@\// }, ({ path: specifier }) => ({
              path: path.join(root, "src", `${specifier.slice(2)}.ts`),
            }));
          },
        },
      ],
    });
    assert.ok(serverBuild.success, serverBuild.logs.join("\n"));
    const serverFile = path.join(temporary, `${variant}-server.mjs`);
    await writeFile(serverFile, await serverBuild.outputs[0].text());
    const server = JSON.parse(
      execFileSync(process.execPath, [serverFile], {
        encoding: "utf8",
        env: { ...process.env, NODE_ENV: "production" },
      }),
    );
    assert.equal(server.hasWindow, false, "render server fixture without browser globals");
    await writeFile(
      entry,
      `
      import React from "react";
      import { createRoot, hydrateRoot } from "react-dom/client";
      import { flushSync } from "react-dom";
      import { renderToStaticMarkup } from "react-dom/server.browser";
      import { ThemeProvider } from ${JSON.stringify(provider)};
      import { useTheme } from ${JSON.stringify(hook)};
      import { useIsClient } from ${JSON.stringify(path.join(root, "src/hooks/useClientSnapshot.ts"))};
      import { Button, benchmarkCopyButton, benchmarkFavorite, benchmarkFavoriteSize, ${variant === "baseline" ? "Button as ButtonLink" : "buttonProps"} } from ${JSON.stringify(path.join(temporary, `${variant}-button.js`))};
      import { Label, benchmarkFieldLabel, benchmarkFieldLabelLarge } from ${JSON.stringify(path.join(temporary, `${variant}-label.js`))};
      import Link from "next/link";
      const props = { attribute: "class", defaultTheme: "system", enableSystem: true };
      ${hydrationConsumer}
      window.hydrationErrors = [];
      function Consumer({ id = "state" }) {
        const state = useTheme();
        window.selectTheme = state.setTheme;
        return <span id={id}>{state.theme}</span>;
      }
      const html = renderToStaticMarkup(<ThemeProvider {...props}><div /></ThemeProvider>);
      const template = document.createElement("template");
      template.innerHTML = html;
      window.prepaint = new Function(template.content.querySelector("script").textContent);
      let root;
      window.mount = (consumers = 1) => {
        root = createRoot(document.getElementById("app"));
        flushSync(() => root.render(<ThemeProvider {...props}><Consumer />{consumers > 1 && <Consumer id="mirror" />}</ThemeProvider>));
        flushSync(() => {});
      };
      window.unmount = () => flushSync(() => root.unmount());
      window.hydrate = (markup) => {
        const app = document.getElementById("app");
        app.innerHTML = markup;
        new Function(app.querySelector("script").textContent)();
        root = hydrateRoot(app, <ThemeProvider {...props}><HydrationConsumer /></ThemeProvider>, { onRecoverableError: (error) => window.hydrationErrors.push(error.message) });
      };
      window.toggle = (value) => flushSync(() => window.selectTheme(value));
      window.storageChange = (value) => {
        if (value === null) localStorage.removeItem("theme"); else localStorage.setItem("theme", value);
        flushSync(() => window.dispatchEvent(new StorageEvent("storage", { key: "theme", newValue: value })));
      };
      function Controls({ count, tick }) {
        return <form>{Array.from({ length: count }, (_, index) => <section key={index}>
          <Label htmlFor={"field-" + index} xstyle={index % 4 === 3 ? benchmarkFieldLabelLarge : benchmarkFieldLabel}>Student name</Label><input id={"field-" + index} defaultValue="A Student" />
          <Button ref={(node) => { if (index === 0) window.nativeButtonRef = node; }} type="button" variant="ghost" size={index % 2 === 0 ? "sm" : "icon"} xstyle={index % 2 === 0 ? benchmarkCopyButton : [benchmarkFavorite, benchmarkFavoriteSize, undefined]} onClick={() => window.controlClicks++}>Save {tick}</Button>
          ${variant === "baseline" ? '<Button asChild variant="secondary" size="sm"><a href="tel:9876543210">Call</a></Button><Button asChild variant="outline" size="sm"><Link href="/hostels">Hostels</Link></Button>' : '<a href="tel:9876543210" {...buttonProps("secondary", "sm")}>Call</a><Link href="/hostels" {...buttonProps("outline", "sm")}>Hostels</Link>'}
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
            // Match the aliases supplied by Next's production browser bundler.
            build.onResolve({ filter: /^@babel\/runtime\// }, ({ path: specifier }) => ({
              path: require.resolve(`next/dist/compiled/${specifier}`),
            }));
            build.onResolve({ filter: /^react-server-dom-webpack\/client$/ }, () => ({
              path: require.resolve("next/dist/compiled/react-server-dom-webpack/client.browser"),
            }));
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
            // Both sides use the same public Next/link entry in this isolated
            // component fixture. Full App Router navigation is outside its scope.
            build.onResolve({ filter: /^next\/link$/ }, () => ({
              path: require.resolve("next/link"),
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
    const context = await browser.newContext({ colorScheme: "light" });
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
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
    const hydrationCases = [];
    for (const [preference, scheme] of [
      ["light", "light"],
      ["dark", "light"],
      ["system", "light"],
      ["system", "dark"],
    ]) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.evaluate(
        ({ markup, preference }) => {
          localStorage.setItem("theme", preference);
          window.hydrate(markup);
        },
        { markup: server.markup, preference },
      );
      await page.waitForFunction(
        (theme) => document.getElementById("hydration-state").textContent === theme,
        preference,
      );
      const actual = await page.evaluate(() => ({
        icon: document.getElementById("hydration-state").dataset.icon,
        class: document.documentElement.className,
        errors: window.hydrationErrors,
      }));
      assert.equal(actual.icon, preference === "dark" ? "sun" : "moon");
      assert.equal(actual.class, `font-sans ${preference === "system" ? scheme : preference}`);
      assert.deepEqual(actual.errors, []);
      hydrationCases.push({ preference, scheme, ...actual });
      await page.evaluate(() => window.unmount());
    }
    hydrationProof[variant] = { serverWithoutWindow: true, cases: hydrationCases };
    await page.emulateMedia({ colorScheme: "light" });
    // Actual mounted provider compatibility, including CSS classes and storage.
    await page.evaluate(() => {
      localStorage.setItem("theme", "system");
      window.prepaint();
      window.mount();
    });
    await page.waitForFunction(() => document.getElementById("state").textContent === "system");
    await page.evaluate(() => window.toggle("dark"));
    assert.equal(await page.evaluate(() => document.documentElement.className), "font-sans dark");
    assert.equal(await page.evaluate(() => localStorage.getItem("theme")), "dark");
    await page.evaluate(() => window.storageChange("light"));
    await page.waitForFunction(() => document.getElementById("state").textContent === "light");
    await page.evaluate(() => window.storageChange(null));
    await page.waitForFunction(() => document.getElementById("state").textContent === "system");
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.classList.contains("light"));
    await page.evaluate(() => window.unmount());
    const remote = await page.context().newPage();
    await remote.route("https://theme-bench.invalid/**", (route) =>
      route.fulfill({ contentType: "text/html", body: "<html><body>Storage peer</body></html>" }),
    );
    await remote.goto("https://theme-bench.invalid/storage");
    await page.evaluate(() => window.mount(2));
    await remote.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.waitForFunction(
      () =>
        document.getElementById("state").textContent === "dark" &&
        document.getElementById("mirror").textContent === "dark",
    );
    await remote.evaluate(() => localStorage.removeItem("theme"));
    await page.waitForFunction(() => document.getElementById("state").textContent === "system");
    await page.evaluate(() => window.unmount());
    await remote.close();
    await page.bringToFront();
    await page.evaluate(() => window.mountControls(24));
    const label = page.locator("label").first();
    await label.click();
    await page.waitForFunction(() => document.activeElement.id === "field-0");
    await page.locator("button").first().focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => window.controlClicks), 1);
    await page.evaluate(() => {
      if (window.nativeButtonRef !== document.querySelector("button"))
        throw new Error("native Button ref mismatch");
      window.nativeButtonRef.disabled = true;
      window.nativeButtonRef.click();
      if (window.controlClicks !== 1) throw new Error("disabled Button must not activate");
      window.nativeButtonRef.disabled = false;
    });
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
    for (const viewport of [
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport);
      for (const color of ["light", "dark"]) {
        await page.evaluate((theme) => {
          window.mount();
          window.toggle(theme);
          document.activeElement?.blur();
        }, color);
        await page.waitForFunction(
          (theme) => document.documentElement.classList.contains(theme),
          color,
        );
        await page.evaluate(async () => {
          document.getAnimations().forEach((animation) => animation.finish());
          await new Promise(requestAnimationFrame);
          document.getAnimations().forEach((animation) => animation.finish());
          window.scrollTo(0, 0);
        });
        const visual = await page.locator("#controls").evaluate((element) => {
          const properties = [
            "display",
            "color",
            "backgroundColor",
            "fontFamily",
            "fontSize",
            "fontWeight",
            "lineHeight",
            "borderRadius",
            "borderColor",
            "padding",
            "margin",
            "gap",
            "height",
            "width",
            "boxShadow",
            "outline",
            "transform",
            "transitionProperty",
            "transitionDuration",
            "transitionTimingFunction",
          ];
          return [...element.querySelectorAll("label,input,button,a")].map((node) => {
            const computed = getComputedStyle(node);
            return [
              node.tagName,
              properties.map((key) => computed[key]),
              node.getBoundingClientRect().toJSON(),
            ];
          });
        });
        const png = await page.locator("#controls").screenshot({ animations: "disabled" });
        const pixels = createHash("sha256").update(png).digest("hex");
        const visualKey = `${viewport.width}-${color}`;
        if (process.env.VISUAL_ARTIFACTS) {
          await mkdir(process.env.VISUAL_ARTIFACTS, { recursive: true });
          await writeFile(
            path.join(process.env.VISUAL_ARTIFACTS, `${variant}-${visualKey}.png`),
            png,
          );
        }
        if (variant === "baseline") {
          pages[`visual-${visualKey}`] = JSON.stringify(visual);
          pages[`pixels-${visualKey}`] = pixels;
        } else {
          assert.equal(
            JSON.stringify(visual),
            pages[`visual-${visualKey}`],
            `${color} computed styles and geometry`,
          );
          assert.equal(pixels, pages[`pixels-${visualKey}`], `${color} screenshot pixels`);
        }
        await page.evaluate(() => window.unmount());
      }
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => window.unmountControls());
    await page.evaluate(() => {
      const original = Object.getOwnPropertyDescriptor(window, "localStorage");
      try {
        Object.defineProperty(window, "localStorage", {
          configurable: true,
          get() {
            throw new DOMException("Denied", "SecurityError");
          },
        });
        window.prepaint();
        window.mount(2);
        window.toggle("dark");
        if (
          document.getElementById("state").textContent !== "dark" ||
          document.getElementById("mirror").textContent !== "dark" ||
          !document.documentElement.classList.contains("dark")
        )
          throw new Error("denied-storage preference must update all consumers");
        window.toggle("system");
        window.unmount();
      } finally {
        Object.defineProperty(window, "localStorage", original);
      }
      window.mount(2);
      window.toggle("dark");
      if (document.getElementById("mirror").textContent !== "dark")
        throw new Error("context consumer mismatch");
      window.toggle("system");
      window.unmount();
      window.mediaChange = new Promise((resolve) =>
        matchMedia("(prefers-color-scheme: dark)").addEventListener(
          "change",
          () => requestAnimationFrame(resolve),
          { once: true },
        ),
      );
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => window.mediaChange);
    assert.equal(
      await page.evaluate(() => document.documentElement.classList.contains("light")),
      true,
      "unmounted media listener must not apply a new theme",
    );
    const cdp = await page.context().newCDPSession(page);
    const { result: windowHandle } = await cdp.send("Runtime.evaluate", { expression: "window" });
    const { listeners } = await cdp.send("DOMDebugger.getEventListeners", {
      objectId: windowHandle.objectId,
    });
    assert.equal(
      listeners.filter((listener) => listener.type === "storage").length,
      0,
      "storage subscriptions removed on unmount",
    );
    await cdp.detach();
    await page.emulateMedia({ colorScheme: "light" });
    assert.deepEqual(pageErrors, [], `${variant} browser errors`);
    assert.deepEqual(consoleErrors, [], `${variant} console/hydration errors`);
  }
  const results = [];
  for (const workload of checkOnly
    ? []
    : [
        "prepaint-system",
        "prepaint-saved",
        "mount",
        "toggle",
        "storage",
        "storage-noop",
        "controls-1",
        "controls-24",
        "controls-240",
      ]) {
    const controls = Number(workload.split("-")[1]);
    const count = workload.startsWith("prepaint")
      ? 20000
      : workload.startsWith("controls")
        ? Math.max(4, Math.floor(512 / controls))
        : workload === "mount"
          ? 512
          : // Bound synchronous selections below React's nested-update limit.
            // Real user events yield between selections.
            128;
    const samples = { baseline: [], candidate: [] };
    for (let round = -4; round < rounds; round++) {
      for (const variant of round % 2 === 0
        ? ["baseline", "candidate"]
        : ["candidate", "baseline"]) {
        await pages[variant].bringToFront();
        const elapsed = await pages[variant]
          .evaluate(
            async ({ workload, count }) => {
              localStorage.setItem("theme", workload === "prepaint-saved" ? "dark" : "system");
              const controls = Number(workload.split("-")[1]);
              if (
                !workload.startsWith("controls") &&
                !workload.startsWith("prepaint") &&
                workload !== "mount"
              ) {
                window.mount();
                window.mountControls(24);
                if (workload === "storage-noop") window.toggle("dark");
              }
              const start = performance.now();
              let yieldedMs = 0;
              for (let index = 0; index < count; index++) {
                if (workload.startsWith("controls")) {
                  window.mountControls(controls);
                  window.updateControls(controls, index + 1);
                  document.querySelector("button").click();
                  window.layoutSink = document.body.offsetHeight;
                  window.unmountControls();
                } else if (workload.startsWith("prepaint")) {
                  // Model startup with a fresh root; retain this equal reset cost.
                  document.documentElement.className = "font-sans";
                  document.documentElement.style.colorScheme = "";
                  window.prepaint();
                } else if (workload === "mount") {
                  window.mount();
                  window.unmount();
                } else if (workload === "toggle") window.toggle(index % 2 === 0 ? "dark" : "light");
                else
                  window.storageChange(
                    workload === "storage-noop" ? "dark" : index % 2 === 0 ? "dark" : "light",
                  );
                if (workload === "toggle" || workload.startsWith("storage")) {
                  window.layoutSink = document.body.offsetHeight;
                  if (index % 8 === 7) {
                    const yieldStart = performance.now();
                    await new Promise((resolve) => setTimeout(resolve, 0));
                    yieldedMs += performance.now() - yieldStart;
                  }
                }
              }
              const elapsedMs = performance.now() - start;
              if (
                !workload.startsWith("controls") &&
                !workload.startsWith("prepaint") &&
                workload !== "mount"
              ) {
                window.unmountControls();
                window.unmount();
              }
              return {
                wall: (elapsedMs * 1000) / count,
                active: ((elapsedMs - yieldedMs) * 1000) / count,
              };
            },
            { workload, count },
          )
          .catch((error) => {
            throw new Error(`${variant}/${workload}/round${round}`, { cause: error });
          });
        if (round >= 0) samples[variant].push(elapsed);
      }
    }
    results.push({
      workload,
      operationsPerSample: count,
      samples: rounds,
      units: "us/op",
      baseline: {
        ...summarize(samples.baseline.map((sample) => sample.wall)),
        active: summarize(samples.baseline.map((sample) => sample.active)),
      },
      candidate: {
        ...summarize(samples.candidate.map((sample) => sample.wall)),
        active: summarize(samples.candidate.map((sample) => sample.active)),
      },
      rawSamples: samples,
    });
  }
  for (const controls of checkOnly ? [] : [1, 24, 240]) {
    const samples = { baseline: [], candidate: [] };
    const events = { baseline: [], candidate: [] };
    for (let round = -4; round < rounds; round++) {
      for (const variant of round % 2 === 0
        ? ["baseline", "candidate"]
        : ["candidate", "baseline"]) {
        const page = pages[variant];
        await page.bringToFront();
        await page.evaluate((count) => {
          localStorage.setItem("theme", "system");
          window.mount();
          window.mountControls(count);
        }, controls);
        await page.emulateMedia({ colorScheme: "light" });
        await page.waitForFunction(() => document.documentElement.classList.contains("light"));
        const latencies = [];
        for (let index = 0; index < 8; index++) {
          const expected = index % 2 === 0 ? "dark" : "light";
          await page.evaluate((color) => {
            window.systemLatency = new Promise((resolve, reject) => {
              matchMedia("(prefers-color-scheme: dark)").addEventListener(
                "change",
                (event) => {
                  requestAnimationFrame(() => {
                    if (!document.documentElement.classList.contains(color)) {
                      reject(new Error("system preference was not applied before frame"));
                      return;
                    }
                    window.layoutSink = document.body.offsetHeight;
                    resolve((performance.now() - event.timeStamp) * 1000);
                  });
                },
                { once: true },
              );
            });
          }, expected);
          await page.emulateMedia({ colorScheme: expected });
          latencies.push(await page.evaluate(() => window.systemLatency));
        }
        await page.evaluate(() => {
          window.unmountControls();
          window.unmount();
        });
        if (round >= 0) {
          events[variant].push(latencies);
          samples[variant].push(
            latencies.reduce((sum, value) => sum + value, 0) / latencies.length,
          );
        }
      }
    }
    results.push({
      workload: `system-media-${controls}`,
      operationsPerSample: 8,
      samples: rounds,
      units: "us/native-event-to-layout-frame",
      baseline: summarize(samples.baseline),
      candidate: summarize(samples.candidate),
      rawSamples: samples,
      rawEventLatencies: events,
    });
  }
  console.log(
    JSON.stringify(
      {
        baselineRef: base,
        mode: checkOnly ? "compatibility-only" : "timing-and-compatibility",
        fingerprints,
        browser: await browser.version(),
        preparation: `Bun ${Bun.version}`,
        node: process.versions.node,
        environment,
        correctness:
          "Actual mounted providers: prepaint, selection, persistence, storage removal, system changes, font classes. Mixed control DOM equality, label focus, keyboard button activation, native tel/internal Next links. Original compiled CSS and forced layout included.",
        warmups: 4,
        order: "alternating paired samples; same browser, separate pages",
        scheduling:
          "128 theme selections/sample, yield setTimeout(0) after each8; wall includes all delays, active excludes measured yields only. Every selection forces layout. Prepaint resets root classes/colorScheme before every invocation on both sides.",
        statistic:
          "Median/p95/min/max of batch-average microseconds per operation; raw wall samples primary, all React/layout/GC retained. Active timings subtract measured timer yields only.",
        visualHashes: Object.fromEntries(
          Object.entries(pages).filter(([key]) => key.startsWith("pixels-")),
        ),
        hydrationProof,
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
