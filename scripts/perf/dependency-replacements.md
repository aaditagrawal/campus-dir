# Dependency replacement measurements

The fixture compares source at `5fda47add7ba179d67e6831706cd76048d8feeb9`
with the current files. Both use the pinned Next/Babel/StyleX production server
configuration, Next SWC minification, production React, and Node from
`.node-version`. Baseline package versions must match the starting lockfile.
The fixture never reads the original checkout or creates a second checkout.

After installing the project with its frozen lock, install baseline packages in a
temporary directory outside the project. They are measurement fixtures, not
product dependencies.

```sh
mkdir -p /tmp/campus-dining-baseline-dependencies-5fda47a
cat > /tmp/campus-dining-baseline-dependencies-5fda47a/package.json <<'JSON'
{"private":true,"packageManager":"bun@1.4.2","dependencies":{"@radix-ui/react-label":"2.1.17","@radix-ui/react-slot":"1.5.0","zod":"4.6.7","react":"19.3.1","react-dom":"19.3.1"}}
JSON
bun install --cwd /tmp/campus-dining-baseline-dependencies-5fda47a
NODE_ENV=production node scripts/perf/dependency-replacements.mjs --quick
NODE_ENV=production node scripts/perf/dependency-replacements.mjs --samples=11 > /tmp/campus-dining-dependency-perf.txt
```

Use `CAMPUS_PERF_BASELINE_DIR` for another baseline cache location. Installation,
module loading, and compilation are excluded from operation measurements. Both
implementations warm up before repeated samples alternate execution order.
Output includes wall-time median, minimum, maximum, p95 batch average, CPU-time
median, compiler settings, versions, and host details. The p95 describes batch
averages, not individual browser interactions.

Workloads cover empty, typical, large, and invalid shared-form JSON; native labels,
ordinary buttons, badges, and complete styled anchors at 1, 15, and 100 elements;
and escaping-heavy content. Both versions must return equivalent decoded data
and serialized UI styles/attributes before timing. These measurements cover
validation and rendering CPU work, not browser paint or installation speed.
Runs during shared-host contention cannot establish performance parity.
