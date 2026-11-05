# Dependency replacement measurements

The fixture compares source at `5fda47add7ba179d67e6831706cd76048d8feeb9`
with the current files. It compiles both with the same installed Next/Babel/StyleX
configuration, verifies baseline package versions against the starting lockfile,
and runs both with Node from `.node-version`. It never reads the original source
checkout or creates a second checkout.

Install the baseline packages in a temporary directory outside the project. These
packages and jsdom are benchmark fixtures, not product dependencies.

```sh
mkdir -p /tmp/campus-dining-baseline-dependencies-5fda47a
cat > /tmp/campus-dining-baseline-dependencies-5fda47a/package.json <<'JSON'
{"private":true,"dependencies":{"@radix-ui/react-label":"2.1.17","@radix-ui/react-slot":"1.5.0","next-themes":"0.4.6","zod":"4.6.7","react":"19.3.1","react-dom":"19.3.1","jsdom":"30.1.3"}}
JSON
bun install --cwd /tmp/campus-dining-baseline-dependencies-5fda47a
NODE_ENV=production node scripts/perf/dependency-replacements.mjs --quick
NODE_ENV=production node scripts/perf/dependency-replacements.mjs --samples=11 > /tmp/campus-dining-dependency-perf.txt
```

Use `CAMPUS_PERF_BASELINE_DIR` for another baseline cache location. Install time,
module loading, compilation, DOM creation, and VM script compilation are excluded
from operation measurements. Both implementations use React's production runtime.
The measured loops warm both implementations, then alternate execution order
across samples. Output contains wall-time median,
minimum, maximum, p95 batch average, CPU-time median, and exact environment details.
The p95 is a tail of batch averages, not a per-event browser latency percentile.

The workloads cover empty, typical, large, and invalid shared-form JSON; native
labels and complete styled anchors at 1, 15, and 100 elements plus escaping-heavy
content; server-rendered theme providers; persisted/system/denied-storage bootstrap;
subscription mount/cleanup; and real React DOM updates from theme, media, and storage
events. Event measurements yield between batches outside the timed interval,
matching separate browser event turns without excluding synchronous rendering/effects.
The fixture checks equivalent serialized UI styles, link attributes, and valid
theme output. Denied storage is measured through complete startup to resolved
UI, since the baseline bootstrap alone skips theme application on a storage error.
jsdom measures integration CPU work and does not establish real
browser paint or interaction latency. No performance claim should use runs made
during shared-host contention.
