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
    autoImportJSX: true,
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
        "Exact markup/classes, native label association, all variant/size/override controls and full restaurant/mail form SSR pass; unchanged next-themes retained.",
      warmup_rounds: 5,
      cases,
    },
    null,
    2,
  ),
);
