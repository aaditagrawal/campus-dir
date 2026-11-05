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
{"private":true,"packageManager":"bun@1.4.4","dependencies":{"@radix-ui/react-label":"2.1.17","@radix-ui/react-slot":"1.5.0","zod":"4.6.7","react":"19.3.1","react-dom":"19.3.1"}}
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

Recorded on 2026-11-05 at application commit
`3b28092451bc2ee22845df6d8adaf3668074b11b`, with 11 alternating samples per
workload on Node 24.22.1, production React 19.3.1, Linux 6.8.0-147-generic x64,
and an AMD Ryzen 5 5600G. The exclusive fleet gate accepted host pressure before
and after the run. All values below are microseconds per operation. Ordinary
button and badge differences are treated as parity within batch spread.

| Workload                | Baseline median | Replacement median | Baseline p95 | Replacement p95 | Result |
| ----------------------- | --------------- | ------------------ | ------------ | --------------- | ------ |
| mail/small              | 0.829           | 0.688              | 1.322        | 0.742           | faster |
| mail/typical            | 0.923           | 0.793              | 0.936        | 0.799           | faster |
| mail/large              | 37.335          | 34.850             | 54.483       | 39.534          | faster |
| mail/adversarial        | 2.025           | 0.897              | 2.227        | 1.246           | faster |
| label/small             | 4.829           | 4.047              | 6.575        | 4.644           | faster |
| button/small            | 3.893           | 3.843              | 4.954        | 4.644           | parity |
| badge/small             | 3.571           | 3.506              | 3.764        | 4.850           | parity |
| button-link/small       | 5.818           | 3.739              | 8.969        | 3.997           | faster |
| label/typical           | 36.442          | 27.009             | 38.820       | 28.384          | faster |
| button/typical          | 25.229          | 24.415             | 26.209       | 25.814          | parity |
| badge/typical           | 21.347          | 21.411             | 22.091       | 26.155          | parity |
| button-link/typical     | 44.371          | 20.715             | 49.027       | 21.862          | faster |
| label/large             | 224.828         | 161.586            | 226.501      | 162.822         | faster |
| button/large            | 149.782         | 145.505            | 150.658      | 147.503         | parity |
| badge/large             | 126.859         | 126.396            | 131.213      | 128.698         | parity |
| button-link/large       | 277.763         | 124.025            | 284.378      | 126.315         | faster |
| label/adversarial       | 127.082         | 104.381            | 133.589      | 107.027         | faster |
| button/adversarial      | 105.068         | 101.479            | 110.413      | 103.795         | parity |
| badge/adversarial       | 97.346          | 97.624             | 100.563      | 102.232         | parity |
| button-link/adversarial | 142.265         | 94.842             | 144.977      | 100.300         | faster |

Independent reproduction with `--quick --samples=7` confirmed all 20 workloads:
decoding, labels, and styled links were faster; ordinary buttons and badges were
at parity within overlapping sample ranges. Separate independent checks passed
7 behavior tests, 195 baseline JSON comparisons, native UI activation/ref/event
checks, and 2 SSR-to-hydration cases with no recoverable errors.
