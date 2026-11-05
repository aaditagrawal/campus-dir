/**
 * Compare the exact starting implementations with the current owned controls.
 * NODE_ENV=production node scripts/perf/owned-controls.mjs > /tmp/owned-controls.json
 * Requires the baseline versions in Bun's local cache; installs nothing.
 * Temporary baseline modules are removed even when a comparison fails.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { homedir, tmpdir, cpus } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire, Module } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);
const { transformSync } = require("@babel/core");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = resolve(import.meta.dirname, "../..");
const base = process.env.OWNED_BASE ?? "60db7f964668422891acd43732a6be473e419e3b";
const scratch = mkdtempSync(join(tmpdir(), "campus-owned-perf-"));
const cache = process.env.BUN_INSTALL_CACHE_DIR ?? join(homedir(), ".bun/install/cache");
const results = [];
const compiledSources = [];

function startingSource(file) {
  return execFileSync("git", ["show", `${base}:${file}`], { cwd: root, encoding: "utf8" });
}

function compile(file, source) {
  compiledSources.push({ file, sha256: createHash("sha256").update(source).digest("hex") });
  const filename = join(root, file);
  const code = transformSync(source, { filename }).code;
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = [join(scratch, "node_modules"), ...Module._nodeModulePaths(root)];
  const originalRequire = compiled.require.bind(compiled);
  compiled.require = (name) => {
    // StyleX has already compiled these token imports into CSS variable names.
    if (name === "@/styles/constants.stylex") return {};
    // Match Next's production alias for its bundled Babel helpers.
    if (name.startsWith("@babel/runtime/")) {
      return require(join(dirname(require.resolve("next/package.json")), "dist/compiled", name));
    }
    return originalRequire(name);
  };
  compiled._compile(code, filename);
  return compiled.exports;
}

function summarize(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    median_ms: sorted[Math.floor(sorted.length / 2)],
    p95_ms: sorted[Math.floor(sorted.length * 0.95)],
    min_ms: sorted[0],
    max_ms: sorted.at(-1),
  };
}

let sink;
function compare(name, iterations, before, after) {
  for (let warm = 0; warm < 3; warm++) {
    for (let i = 0; i < Math.min(iterations, 1000); i++) {
      sink = before();
      sink = after();
    }
  }
  const samples = [[], []];
  const operations = [before, after];
  for (let round = 0; round < 31; round++) {
    for (const index of round % 2 ? [1, 0] : [0, 1]) {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) sink = operations[index]();
      samples[index].push(performance.now() - start);
    }
  }
  const beforeStats = summarize(samples[0]);
  const afterStats = summarize(samples[1]);
  results.push({
    name,
    iterations,
    rounds: 31,
    before: beforeStats,
    after: afterStats,
    speedup: beforeStats.median_ms / afterStats.median_ms,
  });
}

try {
  for (const [name, version] of [
    ["zod", "4.6.7"],
    ["@radix-ui/react-label", "2.1.17"],
    ["@radix-ui/react-primitive", "2.2.0"],
    ["@radix-ui/react-slot", "1.5.0"],
    ["@radix-ui/react-compose-refs", "1.1.5"],
  ]) {
    const destination = join(scratch, "node_modules", name);
    mkdirSync(dirname(destination), { recursive: true });
    const cached = join(cache, `${name}@${version}@@@1`);
    assert.ok(existsSync(cached), `Missing cached baseline ${cached}`);
    cpSync(cached, destination, { recursive: true });
  }
  for (const name of ["react", "react-dom"])
    symlinkSync(join(root, "node_modules", name), join(scratch, "node_modules", name));

  const page = startingSource("src/app/tools/mail-to-warden/page.tsx");
  const schema = page.slice(
    page.indexOf("const FormDataSchema ="),
    page.indexOf("function isFormData"),
  );
  const baselineForm = compile(
    "src/lib/mail-form.ts",
    `const { z } = require("zod");\n${schema}\nexports.parseMailForm = (serialized) => { const value = JSON.parse(serialized); return FormDataSchema.safeParse(value).success ? value : null; };`,
  );
  const ownedForm = compile(
    "src/lib/mail-form.ts",
    readFileSync(join(root, "src/lib/mail-form.ts"), "utf8"),
  );
  const typical = {
    studentName: "A Student",
    registrationNumber: "240900123",
    semester: "3",
    branch: "Computer Science",
    block: "Block 14",
    roomNumber: "201",
    contactNumber: "9876543210",
    startDate: "2026-11-06",
    endDate: "2026-11-08",
    placeOfVisit: "Home",
    address: "A street, Manipal",
    purpose: "Visit home",
    customPurpose: "",
    parentName: "A Parent",
    parentContact: "9876543211",
    selectedWardens: ["Warden One"],
  };
  const small = Object.fromEntries(
    Object.keys(typical).map((key) => [key, key === "selectedWardens" ? [] : ""]),
  );
  const large = {
    ...typical,
    address: "a".repeat(100_000),
    selectedWardens: Array(1000).fill("Warden One"),
  };
  for (const [name, value, iterations] of [
    ["small", small, 5000],
    ["typical", typical, 5000],
    ["large", large, 250],
    ["null", null, 1000],
    ["wrong-field", { ...typical, studentName: 42 }, 1000],
    ["late-invalid", { ...large, selectedWardens: [...large.selectedWardens, 1] }, 100],
  ]) {
    const serialized = JSON.stringify(value);
    assert.deepEqual(
      ownedForm.parseMailForm(serialized),
      baselineForm.parseMailForm(serialized),
      name,
    );
    compare(
      `mail/${name}`,
      iterations,
      () => baselineForm.parseMailForm(serialized),
      () => ownedForm.parseMailForm(serialized),
    );
  }

  const beforeLabel = compile(
    "src/components/ui/label.tsx",
    startingSource("src/components/ui/label.tsx"),
  ).Label;
  const afterLabel = compile(
    "src/components/ui/label.tsx",
    readFileSync(join(root, "src/components/ui/label.tsx"), "utf8"),
  ).Label;
  const beforeButton = compile(
    "src/components/ui/button.tsx",
    startingSource("src/components/ui/button.tsx"),
  ).Button;
  const { ButtonLink: afterLink, Button: afterButton } = compile(
    "src/components/ui/button.tsx",
    readFileSync(join(root, "src/components/ui/button.tsx"), "utf8"),
  );
  const h = React.createElement;
  for (const [count, iterations] of [
    [1, 1000],
    [24, 50],
    [240, 5],
  ]) {
    const renderLabels = (Component) =>
      renderToStaticMarkup(
        h(
          "div",
          null,
          Array.from({ length: count }, (_, i) =>
            h(Component, { htmlFor: `student-${i}`, key: i }, "Student name"),
          ),
        ),
      );
    const renderButtons = (Component) =>
      renderToStaticMarkup(
        h(
          "div",
          null,
          Array.from({ length: count }, (_, i) =>
            h(
              Component,
              { variant: "outline", size: "sm", key: i, onClick() {} },
              "Download contact",
            ),
          ),
        ),
      );
    const beforeLinks = () =>
      renderToStaticMarkup(
        h(
          "div",
          null,
          Array.from({ length: count }, (_, i) =>
            h(
              beforeButton,
              { asChild: true, variant: "secondary", size: "sm", key: i },
              h("a", { href: `tel:987654321${i % 10}` }, "Call Now"),
            ),
          ),
        ),
      );
    const afterLinks = () =>
      renderToStaticMarkup(
        h(
          "div",
          null,
          Array.from({ length: count }, (_, i) =>
            h(
              afterLink,
              { variant: "secondary", size: "sm", href: `tel:987654321${i % 10}`, key: i },
              "Call Now",
            ),
          ),
        ),
      );
    assert.equal(renderLabels(beforeLabel), renderLabels(afterLabel));
    assert.equal(renderButtons(beforeButton), renderButtons(afterButton));
    assert.equal(beforeLinks(), afterLinks());
    compare(
      `label/render-${count}`,
      iterations,
      () => renderLabels(beforeLabel),
      () => renderLabels(afterLabel),
    );
    compare(
      `button/render-${count}`,
      iterations,
      () => renderButtons(beforeButton),
      () => renderButtons(afterButton),
    );
    compare(`button-link/render-${count}`, iterations, beforeLinks, afterLinks);
  }
  process.stdout.write(
    JSON.stringify(
      {
        node: process.version,
        cpu: cpus()[0].model,
        platform: process.platform,
        base,
        production: process.env.NODE_ENV,
        warmup_rounds: 3,
        order: "alternating paired",
        compiledSources,
        results,
      },
      null,
      2,
    ) + "\n",
  );
  if (sink === undefined) throw new Error("Benchmark work was not consumed");
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
