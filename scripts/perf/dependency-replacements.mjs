/**
 * Node 24 benchmark of exact starting-commit modules against the working tree.
 * Setup outside the repository, excluded from measured work:
 *   bun install --cwd /tmp/campus-dining-baseline-dependencies-5fda47a
 * That directory's package.json must pin the four removed packages to bun.lock
 * at BASE, plus react/react-dom 19.3.1 and jsdom 30.1.3. See results document.
 * Run: NODE_ENV=production node scripts/perf/dependency-replacements.mjs [--quick] [--samples=11]
 * No server, checkout, browser download, or original-source files are used.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { Script, createContext } from "node:vm";
import { setImmediate as nextTurn } from "node:timers/promises";

const BASE = "5fda47add7ba179d67e6831706cd76048d8feeb9";
const root = process.cwd();
assert.equal(process.version, `v${readFileSync(path.join(root, ".node-version"), "utf8").trim()}`);
assert.equal(process.env.NODE_ENV, "production", "Run with NODE_ENV=production");
const require = createRequire(import.meta.url);
const baselineDir =
  process.env.CAMPUS_PERF_BASELINE_DIR || "/tmp/campus-dining-baseline-dependencies-5fda47a";
const baselineRequire = createRequire(path.join(baselineDir, "package.json"));
const baseLock = execFileSync("git", ["show", `${BASE}:bun.lock`], { encoding: "utf8" });
const versions = {};
for (const name of [
  "zod",
  "@radix-ui/react-label",
  "@radix-ui/react-slot",
  "next-themes",
  "react",
  "react-dom",
]) {
  const filename = path.join(baselineDir, "node_modules", name, "package.json");
  const version = JSON.parse(readFileSync(filename, "utf8")).version;
  assert.ok(
    baseLock.includes(`"${name}@${version}"`),
    `${name}@${version} differs from starting lock`,
  );
  versions[name] = version;
}
const React = require("react");
assert.equal(React.version, versions.react);
// One identical React instance for compiled modules and both sets of packages.
require.cache[baselineRequire.resolve("react")] = require.cache[require.resolve("react")];
const { renderToStaticMarkup } = require("react-dom/server");
const { transformSync } = require("@babel/core");
const { transformSync: optimizeSync } = require("next/dist/build/swc");
const cache = new Map();
function compile(file, baseline = false, supplied) {
  const key = `${baseline}:${file}`;
  if (cache.has(key)) return cache.get(key).exports;
  const source =
    supplied ??
    (baseline
      ? execFileSync("git", ["show", `${BASE}:${file}`], { encoding: "utf8" })
      : readFileSync(path.join(root, file), "utf8"));
  const transformed = transformSync(source, {
    filename: path.join(root, file),
    caller: { name: "next-babel-turbo-loader", isServer: true, isDev: false },
    babelrc: false,
    configFile: false,
    presets: [["next/babel", { "preset-env": { modules: "commonjs" } }]],
    plugins: [
      [
        "@stylexjs/babel-plugin",
        {
          dev: false,
          runtimeInjection: false,
          enableInlinedConditionalMerge: true,
          treeshakeCompensation: true,
          aliases: { "@/*": ["/ROOT/src/*"] },
          unstable_moduleResolution: { type: "commonJS", rootDir: root },
        },
      ],
    ],
  }).code;
  const compiled = optimizeSync(transformed, {
    filename: path.join(root, file),
    minify: true,
    jsc: {
      parser: { syntax: "ecmascript" },
      target: "es2022",
      minify: { compress: true, mangle: true },
    },
    module: { type: "commonjs" },
  }).code;
  const compiledModule = { exports: {} };
  cache.set(key, compiledModule);
  const load = (name) => {
    if (name.startsWith("@babel/runtime/")) return require(`next/dist/compiled/${name}`);
    if (name.startsWith("@/")) return compile(`src/${name.slice(2)}.ts`, baseline);
    if (["zod", "@radix-ui/react-label", "@radix-ui/react-slot", "next-themes"].includes(name))
      return baselineRequire(name);
    return require(name);
  };
  new Function("require", "module", "exports", compiled)(
    load,
    compiledModule,
    compiledModule.exports,
  );
  return compiledModule.exports;
}

const sourcePage = execFileSync("git", ["show", `${BASE}:src/app/tools/mail-to-warden/page.tsx`], {
  encoding: "utf8",
});
const schema = sourcePage.slice(
  sourcePage.indexOf("const FormDataSchema ="),
  sourcePage.indexOf("function isFormData"),
);
const parseBefore = compile(
  "src/lib/baseline-mail.ts",
  true,
  `const { z } = require("zod"); ${schema}\nmodule.exports.parse = (json) => {try {const value = JSON.parse(json);return FormDataSchema.safeParse(value).success ? value : null;} catch {return null;}};`,
).parse;
const parseAfter = compile("src/lib/mail-form.ts").parseMailForm;
const beforeLabel = compile("src/components/ui/label.tsx", true).Label;
const afterLabel = compile("src/components/ui/label.tsx").Label;
const beforeButton = compile("src/components/ui/button.tsx", true).Button;
const { Button: afterButton, buttonProps } = compile("src/components/ui/button.tsx");
const beforeBadge = compile("src/components/ui/badge.tsx", true).Badge;
const afterBadge = compile("src/components/ui/badge.tsx").Badge;
const { ThemeProvider: beforeProvider } = compile("src/components/theme-provider.tsx", true);
const { ThemeProvider: afterProvider } = compile("src/components/theme-provider.tsx");
const theme = compile("src/lib/theme.ts");
const h = React.createElement;
const quick = process.argv.includes("--quick");
const samples = Number(
  process.argv.find((arg) => arg.startsWith("--samples="))?.split("=")[1] || (quick ? 5 : 11),
);
assert.ok(Number.isInteger(samples) && samples >= 3 && samples <= 101);
let sink;
const results = [];
function measure(name, baseline, candidate, iterations) {
  const count = quick ? Math.max(10, Math.floor(iterations / 5)) : iterations;
  // Warm both, then alternate ordering to limit thermal/order/cache bias.
  for (let i = 0; i < Math.min(count, 1000); i++) {
    sink = baseline();
    sink = candidate();
  }
  const timings = [[], []];
  const cpuTimings = [[], []];
  const fns = [baseline, candidate];
  for (let sample = 0; sample < samples; sample++) {
    for (const index of sample % 2 ? [1, 0] : [0, 1]) {
      const cpuStart = process.cpuUsage();
      const start = performance.now();
      for (let i = 0; i < count; i++) sink = fns[index]();
      timings[index].push(((performance.now() - start) * 1000) / count);
      const cpu = process.cpuUsage(cpuStart);
      cpuTimings[index].push((cpu.user + cpu.system) / count);
    }
  }
  const stats = timings.map((values, index) => {
    const sorted = values.toSorted((a, b) => a - b);
    return {
      median_us: sorted[Math.floor(sorted.length / 2)],
      cpu_median_us: cpuTimings[index].toSorted((a, b) => a - b)[Math.floor(sorted.length / 2)],
      min_us: sorted[0],
      max_us: sorted.at(-1),
      p95_us: sorted[Math.ceil(sorted.length * 0.95) - 1],
    };
  });
  results.push({
    name,
    iterations: count,
    baseline: stats[0],
    candidate: stats[1],
    ratio: stats[1].median_us / stats[0].median_us,
  });
  process.stdout.write(
    `${name}: ${stats[0].median_us.toFixed(3)} -> ${stats[1].median_us.toFixed(3)} us/op, ratio ${(stats[1].median_us / stats[0].median_us).toFixed(3)}\n`,
  );
}

const blank = Object.fromEntries(
  [
    "studentName",
    "registrationNumber",
    "semester",
    "branch",
    "block",
    "roomNumber",
    "contactNumber",
    "startDate",
    "endDate",
    "placeOfVisit",
    "address",
    "purpose",
    "customPurpose",
    "parentName",
    "parentContact",
  ].map((key) => [key, ""]),
);
blank.selectedWardens = [];
const typical = {
  ...blank,
  studentName: "Student Name",
  purpose: "Visiting home",
  selectedWardens: ["warden@manipal.edu"],
};
for (const [name, value] of Object.entries({
  small: blank,
  typical,
  large: {
    ...typical,
    address: "a".repeat(32000),
    selectedWardens: Array(1000).fill("warden@manipal.edu"),
  },
  adversarial: { ...blank, selectedWardens: ["ok", { toString: "spoof" }] },
})) {
  const json = JSON.stringify(value);
  assert.deepEqual(parseAfter(json), parseBefore(json));
  measure(
    `mail/${name}`,
    () => parseBefore(json),
    () => parseAfter(json),
    name === "large" ? 1500 : 12000,
  );
}
for (const [name, count] of [
  ["small", 1],
  ["typical", 15],
  ["large", 100],
  ["adversarial", 30],
]) {
  const labelProps = {
    children: name === "adversarial" ? "<&>".repeat(100) : "Student name",
  };
  const labels = (Label) =>
    h(
      "form",
      null,
      Array.from({ length: count }, (_, i) =>
        h(
          "div",
          { key: i },
          h(Label, { ...labelProps, htmlFor: `field${i}` }),
          h("input", { id: `field${i}` }),
        ),
      ),
    );
  assert.equal(renderToStaticMarkup(labels(beforeLabel)), renderToStaticMarkup(labels(afterLabel)));
  measure(
    `label/${name}`,
    () => renderToStaticMarkup(labels(beforeLabel)),
    () => renderToStaticMarkup(labels(afterLabel)),
    1000,
  );
  for (const [kind, Before, After] of [
    ["button", beforeButton, afterButton],
    ["badge", beforeBadge, afterBadge],
  ]) {
    const controls = (Component) =>
      h(
        "div",
        null,
        Array.from({ length: count }, (_, key) =>
          h(Component, { key, variant: "outline" }, labelProps.children),
        ),
      );
    assert.equal(renderToStaticMarkup(controls(Before)), renderToStaticMarkup(controls(After)));
    measure(
      `${kind}/${name}`,
      () => renderToStaticMarkup(controls(Before)),
      () => renderToStaticMarkup(controls(After)),
      1000,
    );
  }
  const href =
    name === "adversarial" ? `https://example.test/?q=${"<&>".repeat(100)}` : "tel:+919876543210";
  const before = () =>
    h(
      "nav",
      null,
      Array.from({ length: count }, (_, i) =>
        h(
          beforeButton,
          { key: i, asChild: true, variant: "outline", size: "sm" },
          h("a", { href }, "Call now"),
        ),
      ),
    );
  const after = () =>
    h(
      "nav",
      null,
      Array.from({ length: count }, (_, i) =>
        h("a", { key: i, href, ...buttonProps("outline", "sm") }, "Call now"),
      ),
    );
  const normalize = (html) =>
    html
      .replace(/class="([^"]+)"/g, (_, classes) => `class="${classes.split(" ").sort().join(" ")}"`)
      .replace(
        /<a ([^>]+)>/g,
        (_, attributes) =>
          `<a ${attributes
            .match(/[^\s=]+="[^"]*"/g)
            .sort()
            .join(" ")}>`,
      );
  assert.equal(normalize(renderToStaticMarkup(before())), normalize(renderToStaticMarkup(after())));
  measure(
    `button-link/${name}`,
    () => renderToStaticMarkup(before()),
    () => renderToStaticMarkup(after()),
    1000,
  );
}
const children = h("main", null, "Directory");
const providerBefore = () =>
  renderToStaticMarkup(
    h(beforeProvider, { attribute: "class", defaultTheme: "system", enableSystem: true }, children),
  );
const providerAfter = () => renderToStaticMarkup(h(afterProvider, null, children));
const scriptBefore = providerBefore().match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
const scriptAfter = providerAfter().match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
const builtScripts = [
  ...readFileSync(path.join(root, "out/index.html"), "utf8").matchAll(
    /<script\b[^>]*>([\s\S]*?)<\/script>/g,
  ),
]
  .map((match) => match[1])
  .filter(
    (script) =>
      script.includes("localStorage") &&
      script.includes("prefers-color-scheme") &&
      script.includes("classList"),
  );
assert.equal(builtScripts.length, 1, "Build the current project before benchmarking");
const builtScript = builtScripts[0];
measure("theme/provider-SSR", providerBefore, providerAfter, 5000);
const { JSDOM } = baselineRequire("jsdom");
function environment(saved, dark = false) {
  const dom = new JSDOM(
    '<!doctype html><html class="font-class"><body><div id="app"></div></body></html>',
    { url: "https://campus.test" },
  );
  const media = new dom.window.EventTarget();
  media.matches = dark;
  media.addListener = (listener) => media.addEventListener("change", listener);
  media.removeListener = (listener) => media.removeEventListener("change", listener);
  dom.window.matchMedia = () => media;
  if (saved) dom.window.localStorage.setItem("theme", saved);
  return { dom, media };
}
for (const [name, saved, dark] of [
  ["small", "light", false],
  ["typical", "system", true],
  ["large", "dark", false],
]) {
  const a = environment(saved, dark),
    b = environment(saved, dark),
    built = environment(saved, dark);
  if (name === "large")
    for (const env of [a, b, built])
      env.dom.window.document.documentElement.classList.add(
        ...Array.from({ length: 100 }, (_, i) => `existing-${i}`),
      );
  const context = (env) =>
    createContext({
      window: env.dom.window,
      document: env.dom.window.document,
      localStorage: env.dom.window.localStorage,
    });
  const ca = context(a),
    cb = context(b);
  const sa = new Script(scriptBefore),
    sb = new Script(scriptAfter);
  new Script(builtScript).runInContext(context(built));
  measure(
    `theme/bootstrap-${name}`,
    () => sa.runInContext(ca),
    () => sb.runInContext(cb),
    2000,
  );
  // Explicit valid preferences must produce the same classes/color scheme.
  assert.equal(
    a.dom.window.document.documentElement.outerHTML,
    b.dom.window.document.documentElement.outerHTML,
  );
  assert.ok(b.dom.window.document.documentElement.classList.contains("font-class"));
  assert.equal(
    b.dom.window.document.documentElement.outerHTML,
    built.dom.window.document.documentElement.outerHTML,
  );
  a.dom.window.close();
  b.dom.window.close();
  built.dom.window.close();
}

// Real React DOM lifecycle and events. DOM construction and module loading are
// excluded. flushSync includes rendering triggered by each setTheme/event.
const env = environment("system", true);
Object.assign(globalThis, {
  window: env.dom.window,
  document: env.dom.window.document,
  localStorage: env.dom.window.localStorage,
});
const { createRoot } = require("react-dom/client");
const { flushSync } = require("react-dom");
delete require.cache[baselineRequire.resolve("next-themes")];
const clientBefore = baselineRequire("next-themes");
let current;
function Consumer({ useTheme }) {
  const value = useTheme();
  React.useLayoutEffect(() => {
    current = value;
  });
  return h("span", null, value.resolvedTheme);
}
function HeaderConsumer({ useTheme }) {
  const value = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useLayoutEffect(() => {
    current = value;
  });
  return h(
    "button",
    { type: "button", onClick: () => value.setTheme(value.theme === "dark" ? "light" : "dark") },
    mounted && value.theme === "dark" ? "sun" : "moon",
  );
}
function mount(before, consumers = 1, guarded = false) {
  const content = (useTheme) =>
    Array.from({ length: consumers }, (_, key) =>
      h(guarded ? HeaderConsumer : Consumer, { key, useTheme }),
    );
  const renderer = createRoot(document.getElementById("app"));
  flushSync(() =>
    renderer.render(
      before
        ? h(
            clientBefore.ThemeProvider,
            { attribute: "class", defaultTheme: "system", enableSystem: true },
            content(clientBefore.useTheme),
          )
        : h(afterProvider, null, content(compile("src/components/theme-provider.tsx").useTheme)),
    ),
  );
  return renderer;
}
const runLifecycle = (before, consumers, guarded = false) => {
  const renderer = mount(before, consumers, guarded);
  flushSync(() => renderer.unmount());
};
for (const [size, consumers] of [
  ["small", 1],
  ["typical", 15],
  ["large", 100],
]) {
  measure(
    `theme/mount-cleanup-${size}`,
    () => runLifecycle(true, consumers),
    () => runLifecycle(false, consumers),
    100,
  );
}
measure(
  "theme/header-startup",
  () => runLifecycle(true, 1, true),
  () => runLifecycle(false, 1, true),
  100,
);
for (const name of ["setTheme", "system", "storage"]) {
  // Samples alternate mounted baseline/candidate trees; mounting is untimed.
  const values = [[], []];
  const eventCpu = [[], []];
  const count = quick ? 50 : 250;
  for (let sample = 0; sample < samples; sample++)
    for (const index of sample % 2 ? [1, 0] : [0, 1]) {
      localStorage.setItem("theme", name === "system" ? "system" : "light");
      const renderer = mount(index === 0);
      const event = (i) => {
        flushSync(() => {
          if (name === "setTheme") current.setTheme(i % 2 ? "light" : "dark");
          if (name === "system") {
            env.media.matches = i % 2 === 0;
            env.media.dispatchEvent(
              Object.assign(new window.Event("change"), {
                matches: env.media.matches,
                media: "(prefers-color-scheme: dark)",
              }),
            );
          }
          if (name === "storage")
            window.dispatchEvent(
              new window.StorageEvent("storage", {
                key: "theme",
                newValue: i % 2 ? "light" : "dark",
                storageArea: localStorage,
              }),
            );
        });
        const expected =
          name === "system" ? (env.media.matches ? "dark" : "light") : i % 2 ? "light" : "dark";
        assert.equal(current.resolvedTheme, expected);
        assert.ok(document.documentElement.classList.contains(expected));
      };
      for (let i = 0; i < 10; i++) event(i);
      let elapsed = 0;
      let cpuElapsed = 0;
      // Browser events arrive on separate turns. Yield outside timing so a
      // synthetic flushSync loop does not trip React's nested-update limit.
      for (let offset = 0; offset < count; offset += 20) {
        await nextTurn();
        const cpuStart = process.cpuUsage();
        const start = performance.now();
        for (let i = offset; i < Math.min(offset + 20, count); i++) event(i);
        elapsed += performance.now() - start;
        const cpu = process.cpuUsage(cpuStart);
        cpuElapsed += cpu.user + cpu.system;
      }
      values[index].push((elapsed * 1000) / count);
      eventCpu[index].push(cpuElapsed / count);
      flushSync(() => renderer.unmount());
    }
  const stats = values.map((v, index) => {
    const sorted = v.toSorted((a, b) => a - b);
    return {
      median_us: sorted[Math.floor(sorted.length / 2)],
      cpu_median_us: eventCpu[index].toSorted((a, b) => a - b)[Math.floor(sorted.length / 2)],
      min_us: sorted[0],
      max_us: sorted.at(-1),
      p95_us: sorted[Math.ceil(sorted.length * 0.95) - 1],
    };
  });
  results.push({
    name: `theme/events-${name}`,
    iterations: count,
    baseline: stats[0],
    candidate: stats[1],
    ratio: stats[1].median_us / stats[0].median_us,
  });
}
env.dom.window.close();

// The old bootstrap skips theme application when storage throws. Compare the
// complete startup through resolved UI instead of timing its no-op against work.
const denied = environment(null, true);
const deniedStorage = {
  getItem() {
    throw new Error("denied");
  },
  setItem() {
    throw new Error("denied");
  },
};
Object.defineProperty(denied.dom.window, "localStorage", { value: deniedStorage });
Object.assign(globalThis, {
  window: denied.dom.window,
  document: denied.dom.window.document,
  localStorage: deniedStorage,
});
const deniedContext = createContext({ window, document, localStorage });
const deniedScripts = [new Script(scriptBefore), new Script(scriptAfter)];
function deniedStartup(before) {
  document.documentElement.className = "font-class";
  deniedScripts[before ? 0 : 1].runInContext(deniedContext);
  const renderer = mount(before);
  assert.equal(current.resolvedTheme, "dark");
  assert.ok(document.documentElement.classList.contains("dark"));
  assert.ok(document.documentElement.classList.contains("font-class"));
  flushSync(() => renderer.unmount());
}
measure(
  "theme/denied-storage-startup",
  () => deniedStartup(true),
  () => deniedStartup(false),
  100,
);
denied.dom.window.close();
process.stdout.write(
  JSON.stringify(
    {
      base: BASE,
      node: process.version,
      nodeEnv: process.env.NODE_ENV ?? "development",
      compiler: "Next/Babel/StyleX production server caller + pinned Next SWC ES2022 minification",
      bootstrapBytes: {
        baseline: Buffer.byteLength(scriptBefore),
        candidate: Buffer.byteLength(scriptAfter),
        builtCandidate: Buffer.byteLength(builtScript),
      },
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0].model,
      versions,
      samples,
      results,
      sink: Boolean(sink),
      candidateButtons: Boolean(afterButton),
      candidateTheme: Boolean(theme),
    },
    null,
    2,
  ) + "\n",
);
