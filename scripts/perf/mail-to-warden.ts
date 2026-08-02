/**
 * The leave-request form re-renders on every keystroke across fourteen fields.
 * This measures the work one of those renders used to redo, against what it
 * costs now.
 *
 * bun run scripts/perf/mail-to-warden.ts
 */
import hostelsData from "../../src/data/hostels.json"
import { assertEquivalent, bench, speedup } from "./harness"

type Hostel = (typeof hostelsData)[number]

const PURPOSE_TEMPLATES = [
  { label: "Health issues - Medical appointment/treatment", text: "Need to visit the hospital." },
  { label: "Festival - Religious/cultural celebration", text: "Going home for the festival." },
  { label: "Visiting home - Family time/personal work", text: "Visiting home." },
  { label: "Family event - Wedding/function/occasion", text: "Attending a family wedding." },
  { label: "Emergency - Urgent family matter", text: "Urgent family emergency." },
  { label: "Academic purpose - Conference/competition/exam", text: "Academic conference." },
]

/** The block with the most wardens — the worst case for the quadratic check. */
const busiestBlock = hostelsData.reduce((worst, hostel) =>
  hostel.wardens.length > worst.wardens.length ? hostel : worst,
)
const selectedWardens = busiestBlock.wardens.map((warden) => warden.name)
const purposeLabel = PURPOSE_TEMPLATES[4].label

console.log(
  `${hostelsData.length} blocks, ${busiestBlock.wardens.length} wardens in "${busiestBlock.block}"`,
)

/* -------------------------------------------------------------------------- */
/* What one render derived, before and after                                   */
/* -------------------------------------------------------------------------- */

function legacyRender(block: string) {
  const selectedHostel = hostelsData.find((hostel) => hostel.block === block)
  const blocks = hostelsData.map((hostel) => hostel.block)

  // One `includes` scan per warden checkbox.
  const checked = selectedHostel?.wardens.map((warden) =>
    selectedWardens.includes(warden.name),
  )

  const to = selectedHostel?.wardens
    .filter((warden) => selectedWardens.includes(warden.name))
    .map((warden) => `${warden.name} <${warden.email}>`)

  const purposeText = PURPOSE_TEMPLATES.find((p) => p.label === purposeLabel)?.text

  const start = new Date("2026-08-01")
  const end = new Date("2026-08-09")
  const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86_400_000) + 1
  const format = (date: Date) =>
    date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  const duration = `${days} day(s) from ${format(start)} to ${format(end)}`

  return { blocks, checked, to, purposeText, duration }
}

const HOSTELS_BY_BLOCK = new Map<string, Hostel>(
  hostelsData.map((hostel) => [hostel.block, hostel]),
)
const BLOCKS = hostelsData.map((hostel) => hostel.block)
const PURPOSE_TEXT_BY_LABEL = new Map(PURPOSE_TEMPLATES.map((p) => [p.label, p.text]))
const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

// Memoized in the component on `formData.selectedWardens`; rebuilt here only
// when the selection changes, which is what the component does.
const selectedWardenSet = new Set(selectedWardens)

function indexedRender(block: string) {
  const selectedHostel = HOSTELS_BY_BLOCK.get(block)

  const checked = selectedHostel?.wardens.map((warden) =>
    selectedWardenSet.has(warden.name),
  )

  const to = selectedHostel?.wardens
    .filter((warden) => selectedWardenSet.has(warden.name))
    .map((warden) => `${warden.name} <${warden.email}>`)

  const purposeText = PURPOSE_TEXT_BY_LABEL.get(purposeLabel)

  const start = new Date("2026-08-01")
  const end = new Date("2026-08-09")
  const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / 86_400_000) + 1
  const duration = `${days} day(s) from ${DATE_FORMAT.format(start)} to ${DATE_FORMAT.format(end)}`

  return { blocks: BLOCKS, checked, to, purposeText, duration }
}

console.log("\nequivalence")
assertEquivalent("every block produces identical derived state", BLOCKS, legacyRender, indexedRender)

console.log("\nderived state per render")
let cursor = 0
const legacy = bench("linear finds + includes", 20_000, () => {
  legacyRender(BLOCKS[cursor++ % BLOCKS.length])
})
cursor = 0
const indexed = bench("map + set lookups", 20_000, () => {
  indexedRender(BLOCKS[cursor++ % BLOCKS.length])
})
speedup("per render", legacy, indexed)

/* -------------------------------------------------------------------------- */
/* Where the win actually comes from                                           */
/* -------------------------------------------------------------------------- */

console.log("\nbreakdown — each piece of the render, in isolation")

const start = new Date("2026-08-01")
const end = new Date("2026-08-09")

const localeDate = bench("toLocaleDateString x2", 20_000, () => {
  start.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  end.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
})
const sharedFormat = bench("shared Intl.DateTimeFormat x2", 20_000, () => {
  DATE_FORMAT.format(start)
  DATE_FORMAT.format(end)
})
speedup("date formatting", localeDate, sharedFormat)

const blockScan = bench("hostels.find by block", 500_000, () => {
  hostelsData.find((hostel) => hostel.block === "Block 13")
})
const blockLookup = bench("Map.get by block", 500_000, () => {
  HOSTELS_BY_BLOCK.get("Block 13")
})
speedup("block lookup", blockScan, blockLookup)

const wardenNames = busiestBlock.wardens.map((w) => w.name)
const arrayMembership = bench("array .includes per checkbox", 500_000, () => {
  for (const name of wardenNames) selectedWardens.includes(name)
})
const setMembership = bench("set .has per checkbox", 500_000, () => {
  for (const name of wardenNames) selectedWardenSet.has(name)
})
speedup("membership", arrayMembership, setMembership)
