/**
 * Proves the single-pass `slugify` is byte-for-byte equivalent to the regex
 * chain it replaced, then measures the difference.
 *
 * bun run scripts/perf/slugify.ts
 */
import { slugify, slugifyUncached } from "../../src/lib/utils"
import { assertEquivalent, bench, makeRandom, speedup } from "./harness"

import restaurants from "../../src/data/restaurants.json"
import hostels from "../../src/data/hostels.json"
import emergency from "../../src/data/emergency.json"
import academics from "../../src/data/academics.json"
import travel from "../../src/data/travel.json"
import services from "../../src/data/services.json"
import grievance from "../../src/data/grievance.json"
import tools from "../../src/data/tools.json"

/** The implementation that shipped before this change, kept verbatim. */
function slugifyLegacy(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

/** Every string reachable in the directory data, so real inputs are covered. */
function collectStrings(node: unknown, into: string[]): string[] {
  if (typeof node === "string") into.push(node)
  else if (Array.isArray(node)) for (const child of node) collectStrings(child, into)
  else if (node && typeof node === "object") {
    for (const child of Object.values(node)) collectStrings(child, into)
  }
  return into
}

const realStrings = collectStrings(
  [restaurants, hostels, emergency, academics, travel, services, grievance, tools],
  [],
)

const edgeCases = [
  "",
  " ",
  "   ",
  "-",
  "---",
  "- -",
  " - ",
  "-abc",
  "abc-",
  "-abc-",
  " -abc- ",
  "  leading and trailing  ",
  "a - b",
  "a  --  b",
  "Cabs & Taxis",
  "Block 12 (New)",
  "!!!",
  "!!! ???",
  "Ünïcödé Çafé",
  "Straße",
  "İstanbul",
  "ﬁle ½ cup",
  "日本語のみ",
  "café bar",
  "tab\tsep",
  "new\nline",
  "zero​width",
  "﻿bom",
  "emoji 🍕 pizza",
  "ÅNGSTRÖM",
  "ǅungla",
  "a".repeat(500),
]

const ALPHABET = " -abcXYZ019é½ﬁ日 \t !&()#"
const random = makeRandom(0x5eed)
const fuzzed: string[] = []
for (let i = 0; i < 20000; i++) {
  const length = Math.floor(random() * 24)
  let value = ""
  for (let j = 0; j < length; j++) {
    value += ALPHABET[Math.floor(random() * ALPHABET.length)]
  }
  fuzzed.push(value)
}

console.log("slugify equivalence")
assertEquivalent("directory data", realStrings, slugifyLegacy, slugify)
assertEquivalent("edge cases", edgeCases, slugifyLegacy, slugify)
assertEquivalent("fuzz corpus", fuzzed, slugifyLegacy, slugify)

// The cold corpus must be larger than SLUG_CACHE_LIMIT (2048) *and* actually
// distinct, or some share of the run turns into cache hits and flatters the
// result. The raw fuzz corpus is not distinct — this seed produces 184 copies
// of the empty string alone — so pull unique entries until there are 4096.
const coldCorpus: string[] = []
{
  const seen = new Set<string>()
  for (const value of fuzzed) {
    if (value.length === 0 || seen.has(value)) continue
    seen.add(value)
    coldCorpus.push(value)
    if (coldCorpus.length === 4096) break
  }
  if (coldCorpus.length < 4096) {
    throw new Error(`cold corpus is only ${coldCorpus.length} distinct entries; widen the fuzzer`)
  }
}

console.log("\nslugify throughput — cold (4096 distinct inputs against a 2048-entry cache)")
let cursor = 0
const legacyCold = bench("legacy regex chain", 200_000, () => {
  slugifyLegacy(coldCorpus[cursor++ % coldCorpus.length])
})
cursor = 0
const publicCold = bench("slugify (misses + eviction)", 200_000, () => {
  slugify(coldCorpus[cursor++ % coldCorpus.length])
})
speedup("cold slugify", legacyCold, publicCold)

cursor = 0
const scanOnly = bench("slugifyUncached (scan only)", 200_000, () => {
  slugifyUncached(coldCorpus[cursor++ % coldCorpus.length])
})
speedup("cold slugify, cache overhead excluded", legacyCold, scanOnly)

console.log("\nslugify throughput — hot (render path: same names, every frame)")
const hotCorpus = Array.from(new Set(realStrings)).slice(0, 256)
console.log(`  corpus: ${hotCorpus.length} distinct strings`)
cursor = 0
const legacyHot = bench("legacy regex chain", 500_000, () => {
  slugifyLegacy(hotCorpus[cursor++ % hotCorpus.length])
})
cursor = 0
const nextHot = bench("single pass + memo", 500_000, () => {
  slugify(hotCorpus[cursor++ % hotCorpus.length])
})
speedup("hot slugify", legacyHot, nextHot)
