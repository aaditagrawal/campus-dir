/**
 * Checks the precomputed hours index against the per-render implementation it
 * replaced, at every minute of the week, then measures both.
 *
 * Also asserts the property the refresh scheduler depends on: no restaurant's
 * status ever changes strictly between now and the boundary the scheduler
 * sleeps until.
 *
 * bun run scripts/perf/restaurant-hours.ts
 */
import restaurantsData from "../../src/data/restaurants.json"
import {
  BY_NAME_ASC,
  byOpenFirst,
  msUntilNextBoundary,
  RESTAURANTS,
  resolveAll,
  resolveStatus,
  type OpenStatus,
} from "../../src/lib/restaurant-hours"
import { bench, speedup } from "./harness"

type RawHours = Array<{ day: number; open: string; close: string }> | undefined

/* -------------------------------------------------------------------------- */
/* The implementation that shipped before this change                          */
/* -------------------------------------------------------------------------- */

function legacyIsOpenNow(hours: RawHours, day: number, minutesNow: number) {
  if (!hours || hours.length === 0) return undefined

  const today = hours.filter((h) => h.day === day)
  const yesterday = hours.filter((h) => h.day === (day + 6) % 7)

  const toMinutes = (t: string) => {
    const [H, M] = t.split(":").map(Number)
    return H * 60 + M
  }

  const within = (open: number, close: number) => {
    if (close < open) return minutesNow >= open || minutesNow < close
    return minutesNow >= open && minutesNow < close
  }

  for (const h of today) {
    if (within(toMinutes(h.open), toMinutes(h.close))) return true
  }
  for (const h of yesterday) {
    const open = toMinutes(h.open)
    const close = toMinutes(h.close)
    if (close < open) {
      if (within(open, close)) return true
    }
  }
  return false
}

function legacyFormatTime12h(hhmm: string) {
  const [hStr, mStr] = hhmm.split(":")
  let hours = Number(hStr)
  const minutes = Number(mStr)
  const suffix = hours >= 12 ? "PM" : "AM"
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${hours}:${String(minutes).padStart(2, "0")} ${suffix}`
}

function legacyDisplayRange(hours: RawHours, day: number, minutesNow: number) {
  if (!hours || hours.length === 0) return undefined

  const toMinutes = (t: string) => {
    const [H, M] = t.split(":").map(Number)
    return H * 60 + M
  }
  const within = (open: number, close: number) => {
    if (close < open) return minutesNow >= open || minutesNow < close
    return minutesNow >= open && minutesNow < close
  }

  const today = hours.filter((h) => h.day === day)
  const yesterday = hours.filter((h) => h.day === (day + 6) % 7)

  for (const h of today) {
    if (within(toMinutes(h.open), toMinutes(h.close))) {
      return `${legacyFormatTime12h(h.open)}–${legacyFormatTime12h(h.close)}`
    }
  }
  for (const h of yesterday) {
    const open = toMinutes(h.open)
    const close = toMinutes(h.close)
    if (close < open && within(open, close)) {
      return `${legacyFormatTime12h(h.open)}–${legacyFormatTime12h(h.close)}`
    }
  }

  const h = today[0] ?? hours[0]
  if (!h) return undefined
  return `${legacyFormatTime12h(h.open)}–${legacyFormatTime12h(h.close)}`
}

const rawHours: RawHours[] = restaurantsData.map(
  (r) => (r as { hours?: RawHours }).hours as RawHours,
)

/* -------------------------------------------------------------------------- */
/* Equivalence at every minute of the week                                     */
/* -------------------------------------------------------------------------- */

console.log("restaurant hours equivalence — 10,080 minutes x 15 restaurants")

let compared = 0
let mismatches = 0
for (let day = 0; day < 7; day++) {
  for (let minutes = 0; minutes < 1440; minutes++) {
    for (let i = 0; i < RESTAURANTS.length; i++) {
      const expectedOpen = legacyIsOpenNow(rawHours[i], day, minutes)
      const expectedRange = legacyDisplayRange(rawHours[i], day, minutes)
      const actual = resolveStatus(RESTAURANTS[i], day, minutes)

      const actualOpen = actual === null ? undefined : actual.open
      const actualRange = actual === null ? undefined : actual.range

      compared++
      if (actualOpen !== expectedOpen || actualRange !== expectedRange) {
        if (mismatches < 5) {
          console.error(
            `  mismatch ${RESTAURANTS[i].name} day ${day} min ${minutes}: ` +
              `expected ${expectedOpen}/${expectedRange}, got ${actualOpen}/${actualRange}`,
          )
        }
        mismatches++
      }
    }
  }
}
if (mismatches > 0) {
  console.error(`FAIL: ${mismatches}/${compared} minute-restaurant pairs disagree`)
  process.exitCode = 1
} else {
  console.log(`  ok  ${compared.toLocaleString()} minute-restaurant pairs agree`)
}

/* -------------------------------------------------------------------------- */
/* Scheduler safety — nothing changes before the next scheduled wake           */
/* -------------------------------------------------------------------------- */

console.log("\nrefresh scheduling")

function snapshotAt(day: number, minutes: number): string {
  let out = ""
  for (const restaurant of RESTAURANTS) {
    const status = resolveStatus(restaurant, day, minutes)
    out += status === null ? "-" : status.open ? "O" : "C"
  }
  return out
}

// Jan 7 2024 is a Sunday, so day-of-week lines up with the offset.
function dateFor(day: number, minutes: number): Date {
  const date = new Date(2024, 0, 7 + day, Math.floor(minutes / 60), minutes % 60, 0, 0)
  if (date.getDay() !== day) {
    throw new Error(`local calendar shifted day ${day} (DST?); adjust the base date`)
  }
  return date
}

let missedTransitions = 0
let totalWakeups = 0
for (let day = 0; day < 7; day++) {
  for (let minutes = 0; minutes < 1440; minutes++) {
    const current = snapshotAt(day, minutes)
    const sleepMinutes = Math.floor(msUntilNextBoundary(dateFor(day, minutes)) / 60_000)

    // Every minute the scheduler intends to sleep through must look identical.
    for (let ahead = 1; ahead < sleepMinutes; ahead++) {
      const at = (day * 1440 + minutes + ahead) % 10080
      if (snapshotAt(Math.floor(at / 1440), at % 1440) !== current) {
        if (missedTransitions < 5) {
          console.error(
            `  scheduler would sleep through a change at day ${day} minute ${minutes} (+${ahead}m)`,
          )
        }
        missedTransitions++
        break
      }
    }
  }
  // How many times the page actually wakes in a day.
  let cursor = day * 1440
  const end = cursor + 1440
  while (cursor < end) {
    const step = Math.max(1, Math.floor(msUntilNextBoundary(dateFor(Math.floor(cursor / 1440) % 7, cursor % 1440)) / 60_000))
    cursor += step
    totalWakeups++
  }
}
if (missedTransitions > 0) {
  console.error(`FAIL: ${missedTransitions} minutes would sleep through a status change`)
  process.exitCode = 1
} else {
  console.log("  ok  no status change is ever slept through")
}
console.log(`  ${(totalWakeups / 7).toFixed(1)} wakeups per day (vs a 60s poll: 1440)`)

/* -------------------------------------------------------------------------- */
/* Throughput                                                                  */
/* -------------------------------------------------------------------------- */

console.log("\nresolving open state + display range for all 15 restaurants")

const legacyResolve = bench("filter + reparse, per render", 100_000, () => {
  const now = new Date()
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  for (let i = 0; i < rawHours.length; i++) {
    legacyIsOpenNow(rawHours[i], day, minutes)
    legacyDisplayRange(rawHours[i], day, minutes)
  }
})

const indexedResolve = bench("indexed, one fused pass", 100_000, () => {
  resolveAll(new Date())
})
speedup("full-page resolve", legacyResolve, indexedResolve)

console.log("\nsorting 15 restaurants")

const statuses: ReadonlyArray<OpenStatus> = resolveAll(new Date())
const names = RESTAURANTS.map((r) => ({ name: r.name, open: statuses[r.index]?.open === true }))

const legacySort = bench("localeCompare comparator sort", 200_000, () => {
  names.slice().sort((a, b) => {
    if (a.open && !b.open) return -1
    if (!a.open && b.open) return 1
    return a.name.localeCompare(b.name)
  })
})
const partitionSort = bench("stable partition of precomputed order", 200_000, () => {
  byOpenFirst(statuses)
})
speedup("open-first ordering", legacySort, partitionSort)

const legacyAlpha = bench("localeCompare A-Z sort", 200_000, () => {
  names.slice().sort((a, b) => a.name.localeCompare(b.name))
})
const precomputedAlpha = bench("precomputed A-Z order", 200_000, () => {
  void BY_NAME_ASC
})
speedup("A-Z ordering", legacyAlpha, precomputedAlpha)
