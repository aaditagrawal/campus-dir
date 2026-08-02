/**
 * Measures the inverted index against Fuse on the two things that matter:
 * whether it finds what people are looking for, and what a keystroke costs.
 *
 * bun run scripts/perf/search.ts
 */
import Fuse from "fuse.js"
import { getAllSearchItems, type SearchItem } from "../../src/lib/search"
import { loadFuzzyEngine, sampleSuggestions, searchDirectory } from "../../src/lib/search-index"
import { bench, makeRandom, speedup } from "./harness"

const items = getAllSearchItems()

const fuse = new Fuse(items, {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "subtitle", weight: 0.15 },
    { name: "section", weight: 0.1 },
    { name: "phones", weight: 0.15 },
    { name: "notes", weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
})

const fuseSearch = (query: string): SearchItem[] =>
  fuse.search(query).slice(0, 10).map((result) => result.item)

console.log(`corpus: ${items.length} entries`)

/* -------------------------------------------------------------------------- */
/* Recall — does typing a thing's name find that thing?                        */
/* -------------------------------------------------------------------------- */

type Probe = { query: string; target: SearchItem }

const probes: Probe[] = []
for (const item of items) {
  const title = item.title.trim()
  if (title.length < 3) continue

  probes.push({ query: title, target: item })
  // Every prefix a user passes through while typing the name.
  for (let length = 3; length < title.length; length++) {
    probes.push({ query: title.slice(0, length), target: item })
  }
  // Lowercased, since people rarely capitalize in a search box.
  probes.push({ query: title.toLowerCase(), target: item })
}

const phoneProbes: Probe[] = []
for (const item of items) {
  for (const phone of item.phones ?? []) {
    const digits = phone.replace(/\D/g, "")
    if (digits.length < 10) continue
    const subscriber = digits.slice(-10)
    for (const length of [4, 6, 10]) {
      phoneProbes.push({ query: subscriber.slice(0, length), target: item })
    }
  }
}

function measureRecall(
  label: string,
  set: Probe[],
  search: (query: string) => SearchItem[],
): void {
  let found = 0
  let first = 0
  let empty = 0
  for (const probe of set) {
    const results = search(probe.query)
    if (results.length === 0) empty++
    const at = results.findIndex(
      (result) => result.href === probe.target.href && result.title === probe.target.title,
    )
    if (at >= 0) found++
    if (at === 0) first++
  }
  const pct = (n: number) => `${((n / set.length) * 100).toFixed(1)}%`
  console.log(
    `  ${label.padEnd(28)} in top 10: ${pct(found).padStart(6)}   ranked 1st: ${pct(first).padStart(6)}   no results: ${pct(empty).padStart(6)}`,
  )
}

console.log(`\nrecall — typing an entry's name (${probes.length} queries)`)
measureRecall("fuse", probes, fuseSearch)
measureRecall("inverted index", probes, searchDirectory)

console.log(`\nrecall — typing a phone number (${phoneProbes.length} queries)`)
measureRecall("fuse", phoneProbes, fuseSearch)
measureRecall("inverted index", phoneProbes, searchDirectory)

/* -------------------------------------------------------------------------- */
/* Typos — what the fuzzy fallback is actually for                             */
/* -------------------------------------------------------------------------- */

const typoRandom = makeRandom(0x7900)
const typoProbes: Probe[] = []
for (const item of items) {
  const title = item.title.trim()
  if (title.length < 6) continue

  // One dropped character, and one transposed pair.
  const drop = Math.floor(typoRandom() * (title.length - 2)) + 1
  typoProbes.push({
    query: title.slice(0, drop) + title.slice(drop + 1),
    target: item,
  })

  const at = Math.floor(typoRandom() * (title.length - 2)) + 1
  typoProbes.push({
    query: title.slice(0, at) + title[at + 1] + title[at] + title.slice(at + 2),
    target: item,
  })
}

console.log(`\nrecall — misspelled names (${typoProbes.length} queries)`)
measureRecall("fuse", typoProbes, fuseSearch)
measureRecall("inverted index alone", typoProbes, searchDirectory)

/* -------------------------------------------------------------------------- */
/* Formatting the reviewers found in the data                                  */
/* -------------------------------------------------------------------------- */

// Phone numbers are displayed grouped, so a copied number arrives as separate
// numeric terms that are not prefixes of the indexed digit run.
const groupedPhoneProbes: Probe[] = []
for (const item of items) {
  for (const phone of item.phones ?? []) {
    if (!/\d\s+\d/.test(phone)) continue
    groupedPhoneProbes.push({ query: phone, target: item })
    groupedPhoneProbes.push({ query: phone.replace(/^\+\d+\s*/, ""), target: item })
  }
}

// Ranges in warden subtitles use en dashes: "B01–B20", "1101–1241".
const dashRangeProbes: Probe[] = []
for (const item of items) {
  for (const match of (item.subtitle ?? "").matchAll(/([A-Za-z0-9]+)[–—]([A-Za-z0-9]+)/g)) {
    dashRangeProbes.push({ query: match[1], target: item })
    dashRangeProbes.push({ query: match[2], target: item })
  }
}

console.log(`\nrecall — phone numbers copied as displayed (${groupedPhoneProbes.length} queries)`)
measureRecall("fuse", groupedPhoneProbes, fuseSearch)
measureRecall("inverted index", groupedPhoneProbes, searchDirectory)

console.log(`\nrecall — either end of an en-dash range (${dashRangeProbes.length} queries)`)
measureRecall("fuse", dashRangeProbes, fuseSearch)
measureRecall("inverted index", dashRangeProbes, searchDirectory)

/* -------------------------------------------------------------------------- */
/* Throughput — one keystroke                                                  */
/* -------------------------------------------------------------------------- */

const keystrokes = probes.map((probe) => probe.query)

console.log("\nper-keystroke query cost")
let cursor = 0
const fuseOps = bench("fuse.search", 3_000, () => {
  fuseSearch(keystrokes[cursor++ % keystrokes.length])
})
cursor = 0
const indexOps = bench("inverted index", 3_000, () => {
  searchDirectory(keystrokes[cursor++ % keystrokes.length])
})
speedup("query", fuseOps, indexOps)

const shortQueries = ["t", "bl", "ma", "ho", "ca", "s", "re", "wa"]
console.log("\nshort queries (the widest candidate sets)")
cursor = 0
const fuseShort = bench("fuse.search", 3_000, () => {
  fuseSearch(shortQueries[cursor++ & 7])
})
cursor = 0
const indexShort = bench("inverted index", 3_000, () => {
  searchDirectory(shortQueries[cursor++ & 7])
})
speedup("short query", fuseShort, indexShort)

/* -------------------------------------------------------------------------- */
/* With the fuzzy fallback armed — the steady state once Fuse has loaded       */
/* -------------------------------------------------------------------------- */

await loadFuzzyEngine()

console.log("\nonce Fuse has loaded, sparse queries also consult it")
measureRecall("index + fuzzy fallback", typoProbes, searchDirectory)
cursor = 0
const withFallback = bench("inverted index + fallback", 3_000, () => {
  searchDirectory(keystrokes[cursor++ % keystrokes.length])
})
speedup("query vs fuse", fuseOps, withFallback)

/* -------------------------------------------------------------------------- */
/* Suggestion shuffle — bias, not just speed                                   */
/* -------------------------------------------------------------------------- */

console.log("\ndefault suggestions — is the shuffle actually uniform?")

const pool = Array.from({ length: 32 }, (_, i) => i)
const TRIALS = 200_000
const PICK = 8

function comparatorShuffleFirstPositions(random: () => number): Float64Array {
  const counts = new Float64Array(pool.length)
  for (let trial = 0; trial < TRIALS; trial++) {
    const shuffled = pool.slice().sort(() => random() - 0.5).slice(0, PICK)
    for (const value of shuffled) counts[value]++
  }
  return counts
}

function partialFisherYatesCounts(random: () => number): Float64Array {
  const counts = new Float64Array(pool.length)
  const scratch = pool.slice()
  for (let trial = 0; trial < TRIALS; trial++) {
    for (let i = 0; i < scratch.length; i++) scratch[i] = pool[i]
    for (let i = 0; i < PICK; i++) {
      const j = i + Math.floor(random() * (scratch.length - i))
      const swap = scratch[i]
      scratch[i] = scratch[j]
      scratch[j] = swap
    }
    for (let i = 0; i < PICK; i++) counts[scratch[i]]++
  }
  return counts
}

/** Worst-case deviation from the uniform selection rate, as a percentage. */
function maxDeviation(counts: Float64Array): number {
  const expected = (TRIALS * PICK) / pool.length
  let worst = 0
  for (const count of counts) {
    worst = Math.max(worst, Math.abs(count - expected) / expected)
  }
  return worst * 100
}

const comparatorCounts = comparatorShuffleFirstPositions(makeRandom(1))
const fisherYatesCounts = partialFisherYatesCounts(makeRandom(1))

console.log(
  `  sort(() => Math.random() - 0.5)   worst item is ${maxDeviation(comparatorCounts).toFixed(1)}% off uniform`,
)
console.log(
  `  partial Fisher-Yates              worst item is ${maxDeviation(fisherYatesCounts).toFixed(1)}% off uniform`,
)

/**
 * The shipped `sampleSuggestions` filters the corpus and copies the pool before
 * sampling. Benchmarking bare swaps against a comparator sort that pays for two
 * array copies would compare the wrong things, so this is the real function
 * against a faithful reconstruction of the code it replaced.
 */
function sampleSuggestionsLegacy(count: number): SearchItem[] {
  const candidates = items.filter((item) => item.section !== "Pages")
  return candidates.length > count
    ? candidates.slice().sort(() => Math.random() - 0.5).slice(0, count)
    : candidates
}

console.log("\n  full call, including the filter and pool copy both versions do")
const comparatorOps = bench("legacy: filter + sort + slice", 200_000, () => {
  sampleSuggestionsLegacy(PICK)
})
const fisherOps = bench("now: filter + partial Fisher-Yates", 200_000, () => {
  sampleSuggestions(PICK)
})
speedup("suggestion sampling", comparatorOps, fisherOps)
