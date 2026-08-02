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
  [restaurants, hostels, emergency, academics, travel, services, grievance],
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

console.log("\nslugify throughput — cold (unique inputs, cache never hits)")
const coldCorpus = fuzzed.slice(0, 4096)
let cursor = 0
const legacyCold = bench("legacy regex chain", 200_000, () => {
  slugifyLegacy(coldCorpus[cursor++ & 4095])
})
cursor = 0
const nextCold = bench("single pass", 200_000, () => {
  slugifyUncached(coldCorpus[cursor++ & 4095])
})
speedup("cold slugify", legacyCold, nextCold)

console.log("\nslugify throughput — hot (render path: same names, every frame)")
const hotCorpus = Array.from(new Set(realStrings)).slice(0, 256)
cursor = 0
const legacyHot = bench("legacy regex chain", 500_000, () => {
  slugifyLegacy(hotCorpus[cursor++ & 255])
})
cursor = 0
const nextHot = bench("single pass + memo", 500_000, () => {
  slugify(hotCorpus[cursor++ & 255])
})
speedup("hot slugify", legacyHot, nextHot)
