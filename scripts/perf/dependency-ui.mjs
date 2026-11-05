// Benchmark-only baseline packages and DOM tooling stay outside the project lock.
// Run: NODE_ENV=production bun scripts/perf/dependency-ui.mjs --setup,
// then repeat with the same environment and without --setup.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir, cpus, loadavg } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { transformSync } from "@babel/core";
import stylexPlugin from "@stylexjs/babel-plugin";

const base = "e3b74374ce6f439eee044b2eefbd7a09f42c8ee3";
assert.equal(process.env.NODE_ENV, "production", "benchmark React with NODE_ENV=production");
const root = process.cwd();
const fixture = path.join(
  tmpdir(),
  `campus-stylex-ui-${createHash("sha256").update(root).digest("hex").slice(0, 8)}`,
);
const packageFile = path.join(fixture, "package.json");
if (process.argv.includes("--setup")) {
  mkdirSync(fixture, { recursive: true });
  writeFileSync(
    packageFile,
    JSON.stringify({
      private: true,
      dependencies: {
        "@radix-ui/react-label": "2.1.17",
        "@radix-ui/react-slot": "1.5.0",
        "@stylexjs/stylex": "0.19.1",
        jsdom: "30.1.3",
        "next-themes": "0.4.6",
        react: "19.3.1",
        "react-dom": "19.3.1",
      },
    }),
  );
  execFileSync(process.execPath, ["install", "--prefer-offline"], {
    cwd: fixture,
    stdio: ["ignore", "ignore", "inherit"],
    timeout: 180000,
  });
}
assert.ok(existsSync(path.join(fixture, "node_modules/jsdom")), "run with --setup first");
const fixtureRequire = createRequire(packageFile);
const React = fixtureRequire("react");
const { renderToStaticMarkup } = fixtureRequire("react-dom/server");
const { JSDOM } = fixtureRequire("jsdom");
const h = React.createElement;

function compile(file, baseline = false, suffix = "") {
  let source = baseline
    ? execFileSync("git", ["show", `${base}:${file}`], { encoding: "utf8" })
    : readFileSync(file, "utf8");
  if (file.endsWith("ui/button.tsx")) {
    source +=
      '\nconst benchmarkStyles = stylex.create({ override: { width: "100%", color: "red", fontSize: "1rem" } }); export const benchmarkOverride = benchmarkStyles.override;';
  }
  const filename = path.join(root, file);
  const javascript = new Bun.Transpiler({
    loader: file.endsWith("tsx") ? "tsx" : "ts",
  }).transformSync(source);
  const result = transformSync(javascript, {
    filename,
    configFile: false,
    babelrc: false,
    plugins: [
      [
        stylexPlugin,
        {
          dev: false,
          runtimeInjection: false,
          enableInlinedConditionalMerge: true,
          treeshakeCompensation: true,
          aliases: { "@/*": [path.join(root, "src/*")] },
          unstable_moduleResolution: { type: "commonJS", rootDir: root },
        },
      ],
    ],
  });
  assert.ok(result?.code);
  const output = path.join(
    fixture,
    `${baseline ? "base" : "candidate"}-${path.basename(file).replace(/\.tsx?$/, "")}${suffix}.mjs`,
  );
  let code = result.code.replaceAll(
    '"@/styles/constants.stylex"',
    '"./candidate-constants.stylex.mjs"',
  );
  code = code.replaceAll('"@/lib/theme"', '"./candidate-theme.mjs"');
  if (suffix === "-client") {
    const entry = pathToFileURL(path.join(fixture, "node_modules/next-themes/dist/index.mjs"));
    code = code.replaceAll('"next-themes"', JSON.stringify(`${entry}?client`));
  }
  writeFileSync(output, code);
  return import(pathToFileURL(output).href);
}

await compile("src/styles/constants.stylex.ts");
const baselineButton = await compile("src/components/ui/button.tsx", true);
const candidateButton = await compile("src/components/ui/button.tsx");
const baselineBadge = await compile("src/components/ui/badge.tsx", true);
const candidateBadge = await compile("src/components/ui/badge.tsx");
const baselineLabel = await compile("src/components/ui/label.tsx", true);
const candidateLabel = await compile("src/components/ui/label.tsx");
const { themeInitializationScript } = await compile("src/lib/theme.ts");
const baselineProvider = await compile("src/components/theme-provider.tsx", true);
const candidateProvider = await compile("src/components/theme-provider.tsx");

function uiTree(button, badge, label, owned) {
  const links = ["/restaurants", "/emergency", "/hostels", "tel:08202920000"];
  return h(
    "main",
    null,
    ...links.map((href) =>
      owned
        ? h("a", { key: href, href, ...button.buttonProps("outline", "sm") }, "Contact")
        : h(
            button.Button,
            { key: href, variant: "outline", size: "sm", asChild: true },
            h("a", { href }, "Contact"),
          ),
    ),
    h(button.Button, { variant: "secondary", size: "sm", disabled: true }, "Download"),
    h(badge.Badge, { variant: "outline" }, "Open"),
    h(label.Label, { htmlFor: "name" }, "Student name"),
    h("input", { id: "name" }),
  );
}
const baseTree = () => uiTree(baselineButton, baselineBadge, baselineLabel, false);
const candidateTree = () => uiTree(candidateButton, candidateBadge, candidateLabel, true);
const baseMarkup = renderToStaticMarkup(baseTree());
assert.equal(
  renderToStaticMarkup(candidateTree()),
  baseMarkup,
  "native element markup and StyleX classes must match",
);
for (const variant of ["default", "destructive", "outline", "secondary", "ghost", "link"]) {
  for (const size of ["default", "sm", "lg", "icon"]) {
    assert.equal(
      renderToStaticMarkup(
        h(
          baselineButton.Button,
          { variant, size, asChild: true },
          h("a", { href: "/restaurants" }, "Browse"),
        ),
      ),
      renderToStaticMarkup(
        h("a", { href: "/restaurants", ...candidateButton.buttonProps(variant, size) }, "Browse"),
      ),
    );
    assert.equal(
      renderToStaticMarkup(
        h(
          baselineButton.Button,
          { variant, size, xstyle: baselineButton.benchmarkOverride, asChild: true },
          h("a", { href: "/restaurants" }, "Browse"),
        ),
      ),
      renderToStaticMarkup(
        h(
          "a",
          {
            href: "/restaurants",
            ...candidateButton.buttonProps(variant, size, candidateButton.benchmarkOverride),
          },
          "Browse",
        ),
      ),
    );
    assert.equal(
      renderToStaticMarkup(
        h(
          baselineButton.Button,
          { variant, size, xstyle: baselineButton.benchmarkOverride, disabled: true },
          "Download",
        ),
      ),
      renderToStaticMarkup(
        h(
          candidateButton.Button,
          { variant, size, xstyle: candidateButton.benchmarkOverride, disabled: true },
          "Download",
        ),
      ),
    );
  }
}

const restaurants = JSON.parse(
  execFileSync("git", ["show", `${base}:src/data/restaurants.json`], { encoding: "utf8" }),
);
const fields = [
  "studentName",
  "registrationNumber",
  "semester",
  "branch",
  "section",
  "block",
  "roomNumber",
  "fromDate",
  "toDate",
  "reason",
];
function largeTree(button, badge, label, owned) {
  return h(
    "main",
    null,
    ...restaurants.map((restaurant) =>
      h(
        "section",
        { key: restaurant.name },
        h("h2", null, restaurant.name),
        h(badge.Badge, { variant: "outline" }, "Open"),
        ...restaurant.phones.map((phone) =>
          owned
            ? h(
                "a",
                {
                  key: phone,
                  href: `tel:${phone}`,
                  ...button.buttonProps("secondary", "sm", button.benchmarkOverride),
                },
                "Call now",
              )
            : h(
                button.Button,
                {
                  key: phone,
                  variant: "secondary",
                  size: "sm",
                  xstyle: button.benchmarkOverride,
                  asChild: true,
                },
                h("a", { href: `tel:${phone}` }, "Call now"),
              ),
        ),
        h(button.Button, { variant: "outline", size: "sm" }, "Download contact"),
      ),
    ),
    h(
      "form",
      null,
      ...fields.map((field) =>
        h(
          "div",
          { key: field },
          h(label.Label, { htmlFor: field }, field),
          h("input", { id: field }),
        ),
      ),
      h(button.Button, { type: "submit" }, "Generate mail"),
    ),
  );
}
const baselineLargeTree = () => largeTree(baselineButton, baselineBadge, baselineLabel, false);
const candidateLargeTree = () => largeTree(candidateButton, candidateBadge, candidateLabel, true);
assert.equal(renderToStaticMarkup(baselineLargeTree()), renderToStaticMarkup(candidateLargeTree()));
const form = new JSDOM(baseMarkup);
assert.equal(form.window.document.querySelector("label").control.id, "name");
assert.equal(form.window.document.querySelector("input").labels[0].textContent, "Student name");
assert.equal(form.window.document.querySelectorAll("a").length, 4);
assert.equal(form.window.document.querySelector("button").disabled, true);
form.window.close();

const baselineServerTree = () =>
  h(
    baselineProvider.ThemeProvider,
    { attribute: "class", defaultTheme: "system", enableSystem: true },
    baseTree(),
  );
const candidateServerTree = () => h(candidateProvider.ThemeProvider, null, candidateTree());
const baselineScript = new JSDOM(
  renderToStaticMarkup(baselineServerTree()),
).window.document.querySelector("script").textContent;
const cases = [];
const environment = { cpu: cpus()[0].model, cores: cpus().length, load: loadavg() };

function summary(values) {
  values.sort((a, b) => a - b);
  return {
    median_us: values[Math.floor(values.length / 2)],
    p95_us: values[Math.ceil(values.length * 0.95) - 1],
    min_us: values[0],
    max_us: values.at(-1),
  };
}

function measure(name, baseline, candidate, iterations = 200, rounds = 25) {
  for (let warmup = 0; warmup < 5; warmup++) {
    for (let i = 0; i < iterations; i++) {
      baseline();
      candidate();
    }
  }
  const samples = [[], []];
  const cpuSamples = [[], []];
  for (let round = 0; round < rounds; round++) {
    for (const side of round % 2 ? [1, 0] : [0, 1]) {
      const run = side === 0 ? baseline : candidate;
      const start = performance.now();
      const cpu = process.cpuUsage();
      for (let i = 0; i < iterations; i++) run();
      samples[side].push(((performance.now() - start) * 1000) / iterations);
      const used = process.cpuUsage(cpu);
      cpuSamples[side].push((used.user + used.system) / iterations);
    }
  }
  const stats = samples.map((times, side) => ({
    ...summary(times),
    cpu: summary(cpuSamples[side]),
  }));
  cases.push({ name, iterations, rounds, baseline: stats[0], candidate: stats[1] });
}
measure(
  "form label SSR",
  () => renderToStaticMarkup(h(baselineLabel.Label, { htmlFor: "name" }, "Student name")),
  () => renderToStaticMarkup(h(candidateLabel.Label, { htmlFor: "name" }, "Student name")),
);
measure(
  "ordinary native button SSR",
  () =>
    renderToStaticMarkup(
      h(baselineButton.Button, { variant: "secondary", size: "sm" }, "Download contact"),
    ),
  () =>
    renderToStaticMarkup(
      h(candidateButton.Button, { variant: "secondary", size: "sm" }, "Download contact"),
    ),
);
measure(
  "styled link SSR",
  () =>
    renderToStaticMarkup(
      h(
        baselineButton.Button,
        { variant: "outline", size: "sm", asChild: true },
        h("a", { href: "/restaurants" }, "Browse restaurants"),
      ),
    ),
  () =>
    renderToStaticMarkup(
      h(
        "a",
        { href: "/restaurants", ...candidateButton.buttonProps("outline", "sm") },
        "Browse restaurants",
      ),
    ),
);
measure(
  "directory controls SSR",
  () => renderToStaticMarkup(baseTree()),
  () => renderToStaticMarkup(candidateTree()),
);
measure(
  "full restaurant controls and mail form SSR",
  () => renderToStaticMarkup(baselineLargeTree()),
  () => renderToStaticMarkup(candidateLargeTree()),
  30,
);
measure(
  "provider plus controls SSR",
  () => renderToStaticMarkup(baselineServerTree()),
  () => renderToStaticMarkup(candidateServerTree()),
);

// Execute each real initialization script in the same DOM environment.
function makeDom(preference = "system", dark = false, denied = false) {
  const dom = new JSDOM('<html class="font-token"><body><div id="root"></div></body></html>', {
    url: "https://directory.test",
    runScripts: "outside-only",
  });
  const mediaListeners = new Set();
  const media = {
    matches: dark,
    media: "(prefers-color-scheme: dark)",
    addListener: (listener) => mediaListeners.add(listener),
    removeListener: (listener) => mediaListeners.delete(listener),
    addEventListener: (event, listener) => mediaListeners.add(listener),
    removeEventListener: (event, listener) => mediaListeners.delete(listener),
  };
  dom.window.matchMedia = () => media;
  if (preference !== null) dom.window.localStorage.setItem("theme", preference);
  if (denied)
    Object.defineProperty(dom.window, "localStorage", {
      get() {
        throw new Error("storage denied");
      },
    });
  return { dom, media, mediaListeners };
}
function assertTheme(window, theme) {
  assert.ok(window.document.documentElement.classList.contains(theme));
  assert.equal(window.document.documentElement.style.colorScheme, theme);
  assert.ok(window.document.documentElement.classList.contains("font-token"));
}
for (const [preference, dark, expected] of [
  [null, false, "light"],
  [null, true, "dark"],
  ["system", true, "dark"],
  ["light", true, "light"],
  ["dark", false, "dark"],
]) {
  for (const script of [baselineScript, themeInitializationScript]) {
    const { dom } = makeDom(preference, dark);
    dom.window.eval(script);
    assertTheme(dom.window, expected);
    dom.window.close();
  }
}
const denied = makeDom(null, true, true);
denied.dom.window.eval(themeInitializationScript);
assertTheme(denied.dom.window, "dark");
denied.dom.window.close();
const startup = makeDom("system", true);
measure(
  "theme pre-paint script",
  () => startup.dom.window.eval(baselineScript),
  () => startup.dom.window.eval(themeInitializationScript),
);
startup.dom.window.close();

// A fresh browser import is necessary because next-themes captures SSR at import time.
const browser = makeDom("system", false);
const window = browser.dom.window;
const browserGlobals = {
  window,
  document: window.document,
  navigator: window.navigator,
  localStorage: window.localStorage,
  matchMedia: window.matchMedia,
};
for (const [name, value] of Object.entries(browserGlobals)) {
  Object.defineProperty(globalThis, name, { value, configurable: true });
}
const { createRoot } = fixtureRequire("react-dom/client");
const { flushSync } = fixtureRequire("react-dom");
const actualBaselineThemes = await import(
  `${pathToFileURL(path.join(fixture, "node_modules/next-themes/dist/index.mjs"))}?client`
);
const actualCandidateThemes = await compile("src/components/theme-provider.tsx", false, "-client");

function mountTheme(Provider, useTheme, baseline) {
  let value;
  function Consumer() {
    const current = useTheme();
    React.useLayoutEffect(() => {
      value = current;
    }, [current]);
    return h("span", null, current.theme);
  }
  const container = window.document.createElement("div");
  window.document.body.append(container);
  const reactRoot = createRoot(container);
  flushSync(() =>
    reactRoot.render(
      h(
        Provider,
        baseline ? { attribute: "class", defaultTheme: "system", enableSystem: true } : null,
        h(Consumer),
      ),
    ),
  );
  assert.ok(value);
  const preference = window.localStorage.getItem("theme") ?? "system";
  assert.equal(value.theme, preference, "provider must initialize from browser storage");
  assertTheme(
    window,
    preference === "system" ? (browser.media.matches ? "dark" : "light") : preference,
  );
  return {
    getValue: () => value,
    close() {
      flushSync(() => reactRoot.unmount());
      container.remove();
    },
  };
}
const baseMount = () =>
  mountTheme(actualBaselineThemes.ThemeProvider, actualBaselineThemes.useTheme, true);
const candidateMount = () =>
  mountTheme(actualCandidateThemes.ThemeProvider, actualCandidateThemes.useTheme, false);
for (const preference of ["light", "dark", "system"]) {
  window.localStorage.setItem("theme", preference);
  baseMount().close();
  candidateMount().close();
}
measure(
  "theme mount and cleanup",
  () => baseMount().close(),
  () => candidateMount().close(),
  25,
);
function lifecycle(make, noOp) {
  const mounted = make();
  const changes = (round) => {
    if (noOp) {
      flushSync(() => mounted.getValue().setTheme("dark"));
      flushSync(() =>
        window.dispatchEvent(
          new window.StorageEvent("storage", {
            key: "theme",
            newValue: "dark",
            storageArea: window.localStorage,
          }),
        ),
      );
      return;
    }
    flushSync(() => mounted.getValue().setTheme(round % 2 ? "dark" : "light"));
    flushSync(() => mounted.getValue().setTheme("system"));
    assertTheme(window, browser.media.matches ? "dark" : "light");
    browser.media.matches = !browser.media.matches;
    flushSync(() => {
      for (const listener of browser.mediaListeners) listener(browser.media);
    });
    assertTheme(window, browser.media.matches ? "dark" : "light");
    window.localStorage.setItem("theme", "dark");
    flushSync(() =>
      window.dispatchEvent(
        new window.StorageEvent("storage", {
          key: "theme",
          newValue: "dark",
          storageArea: window.localStorage,
        }),
      ),
    );
    assertTheme(window, "dark");
  };
  return { changes, close: mounted.close };
}
// Keep stores mounted one at a time so they cannot process each other's events.
function measureLifecycle(noOp = false) {
  const times = [[], []];
  const cpuTimes = [[], []];
  for (let round = -5; round < 25; round++) {
    for (const side of round % 2 ? [1, 0] : [0, 1]) {
      const active = lifecycle(side === 0 ? baseMount : candidateMount, noOp);
      active.changes(0);
      const start = performance.now();
      const cpu = process.cpuUsage();
      for (let i = 0; i < 50; i++) active.changes(i);
      const elapsed = ((performance.now() - start) * 1000) / 50;
      const used = process.cpuUsage(cpu);
      active.close();
      assert.equal(browser.mediaListeners.size, 0, "unmount must remove media listeners");
      if (round >= 0) {
        times[side].push(elapsed);
        cpuTimes[side].push((used.user + used.system) / 50);
      }
    }
  }
  const stats = times.map((values, side) => ({ ...summary(values), cpu: summary(cpuTimes[side]) }));
  cases.push({
    name: noOp ? "theme unchanged preference/storage" : "theme preference/system/storage cycle",
    iterations: 50,
    rounds: 25,
    baseline: stats[0],
    candidate: stats[1],
  });
}
measureLifecycle();
measureLifecycle(true);
const mounted = candidateMount();
flushSync(() =>
  window.dispatchEvent(
    new window.StorageEvent("storage", {
      key: "theme",
      newValue: null,
      storageArea: window.localStorage,
    }),
  ),
);
assert.equal(mounted.getValue().theme, "system");
flushSync(() =>
  window.dispatchEvent(
    new window.StorageEvent("storage", { key: null, storageArea: window.localStorage }),
  ),
);
assert.equal(mounted.getValue().theme, "system");
mounted.close();
browser.dom.window.close();
console.log(
  JSON.stringify(
    {
      base,
      runtime: process.version,
      node_env: process.env.NODE_ENV,
      bun: Bun.version,
      fixture,
      environment,
      corpus: { restaurants: restaurants.length, form_fields: fields.length },
      correctness:
        "native markup/classes, label association, SSR, pre-paint preferences, real provider lifecycle and cleanup passed",
      warmup_rounds: 5,
      cases,
    },
    null,
    2,
  ),
);
