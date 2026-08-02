import restaurantsData from "@/data/restaurants.json"
import { slugify } from "@/lib/utils"

/**
 * Opening hours are static, so everything derivable from them — parsed
 * minutes, day buckets, display labels, the alphabetical order, the instants
 * at which any restaurant's status changes — is built once when this module
 * loads. What is left at render time is a bucket lookup and a walk of the two
 * windows that can possibly be active.
 */

const MINUTES_PER_DAY = 1440
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7
const MS_PER_MINUTE = 60_000

type RawWindow = { day: number; open: string; close: string }

export type OpeningWindow = {
  /** Minutes past midnight. */
  open: number
  /** Minutes past midnight; less than `open` when the window rolls past midnight. */
  close: number
  /** Pre-rendered "9:00 AM–11:00 PM". */
  label: string
}

export type Restaurant = {
  /** Position in `RESTAURANTS`, which is also the index into a status array. */
  index: number
  name: string
  slug: string
  phones: string[]
  address?: string
  deliveryFee?: string
  packagingFee?: string
  menuUrl?: string
  /** Seven buckets indexed by `Date#getDay`, so no filtering at render time. */
  byDay: ReadonlyArray<readonly OpeningWindow[]>
  /** First window in source order — the display fallback when today has none. */
  firstWindow: OpeningWindow | null
}

/** `null` when a restaurant publishes no hours, which renders no badge. */
export type OpenStatus = { open: boolean; range: string } | null

/* -------------------------------------------------------------------------- */
/* Index construction — runs once, at module load                             */
/* -------------------------------------------------------------------------- */

const NO_WINDOWS: readonly OpeningWindow[] = Object.freeze([])

function parseClockMinutes(value: string): number {
  // "HH:MM", zero padded. Reading the digits directly avoids the split/map
  // allocation the render path used to pay for on every window, every render.
  if (value.length === 5 && value.charCodeAt(2) === 58 /* : */) {
    const h = (value.charCodeAt(0) - 48) * 10 + (value.charCodeAt(1) - 48)
    const m = (value.charCodeAt(3) - 48) * 10 + (value.charCodeAt(4) - 48)
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m
  }
  const [hours, minutes] = value.split(":")
  return Number(hours) * 60 + Number(minutes)
}

function formatTime12h(totalMinutes: number): string {
  const minutes = totalMinutes % 60
  const rawHours = Math.floor(totalMinutes / 60)
  const suffix = rawHours >= 12 ? "PM" : "AM"
  const hours = rawHours % 12 === 0 ? 12 : rawHours % 12
  return `${hours}:${minutes < 10 ? `0${minutes}` : minutes} ${suffix}`
}

function buildRestaurant(raw: (typeof restaurantsData)[number], index: number): Restaurant {
  const rawHours = (raw as { hours?: RawWindow[] }).hours ?? []

  const byDay: OpeningWindow[][] = [[], [], [], [], [], [], []]
  let firstWindow: OpeningWindow | null = null

  for (const entry of rawHours) {
    if (entry.day < 0 || entry.day > 6) continue
    const open = parseClockMinutes(entry.open)
    const close = parseClockMinutes(entry.close)
    const window: OpeningWindow = {
      open,
      close,
      label: `${formatTime12h(open)}–${formatTime12h(close)}`,
    }
    byDay[entry.day].push(window)
    if (firstWindow === null) firstWindow = window
  }

  return {
    index,
    name: raw.name,
    slug: slugify(raw.name),
    phones: raw.phones,
    address: (raw as { address?: string }).address,
    deliveryFee: (raw as { deliveryFee?: string }).deliveryFee,
    packagingFee: (raw as { packagingFee?: string }).packagingFee,
    menuUrl: (raw as { menuUrl?: string }).menuUrl,
    byDay: byDay.map((windows) => (windows.length === 0 ? NO_WINDOWS : windows)),
    firstWindow,
  }
}

export const RESTAURANTS: readonly Restaurant[] = restaurantsData.map(buildRestaurant)

/* -------------------------------------------------------------------------- */
/* Status resolution                                                          */
/* -------------------------------------------------------------------------- */

function isWithin(window: OpeningWindow, minutes: number): boolean {
  return window.close < window.open
    ? minutes >= window.open || minutes < window.close
    : minutes >= window.open && minutes < window.close
}

/**
 * Open state and the range to display, in one traversal.
 *
 * Only two buckets can matter: today's windows, and yesterday's windows that
 * roll past midnight and have not closed yet.
 */
export function resolveStatus(
  restaurant: Restaurant,
  day: number,
  minutes: number,
): OpenStatus {
  const today = restaurant.byDay[day]
  for (const window of today) {
    if (isWithin(window, minutes)) return { open: true, range: window.label }
  }

  for (const window of restaurant.byDay[(day + 6) % 7]) {
    if (window.close < window.open && minutes < window.close) {
      return { open: true, range: window.label }
    }
  }

  const fallback = today.length > 0 ? today[0] : restaurant.firstWindow
  return fallback === null ? null : { open: false, range: fallback.label }
}

/* -------------------------------------------------------------------------- */
/* Orderings — precomputed, because the data never changes                    */
/* -------------------------------------------------------------------------- */

// One shared collator. `String#localeCompare` builds one per call, which is
// most of the cost of sorting a list this size.
const collator = new Intl.Collator(undefined, { sensitivity: "variant" })

export const BY_NAME_ASC: readonly Restaurant[] = RESTAURANTS.slice().sort((a, b) =>
  collator.compare(a.name, b.name),
)
export const BY_NAME_DESC: readonly Restaurant[] = BY_NAME_ASC.slice().reverse()

/**
 * Open restaurants first, each group alphabetical.
 *
 * A stable partition of the precomputed alphabetical order, so this is O(n)
 * with no comparisons rather than an O(n log n) sort whose comparator called
 * `localeCompare` on every step.
 */
export function byOpenFirst(statuses: ReadonlyArray<OpenStatus>): readonly Restaurant[] {
  const open: Restaurant[] = []
  const closed: Restaurant[] = []
  for (const restaurant of BY_NAME_ASC) {
    const status = statuses[restaurant.index]
    if (status !== null && status.open) open.push(restaurant)
    else closed.push(restaurant)
  }
  return open.concat(closed)
}

/* -------------------------------------------------------------------------- */
/* Boundaries — the only instants at which any status can change              */
/* -------------------------------------------------------------------------- */

/**
 * Every open/close instant across every restaurant, as a minute of the week,
 * deduplicated and sorted. Finding the next one is a binary search rather than
 * a scan, and knowing it exactly means the page can sleep until then instead
 * of polling.
 */
const BOUNDARIES: readonly number[] = (() => {
  const instants = new Set<number>()
  for (const restaurant of RESTAURANTS) {
    for (let day = 0; day < 7; day++) {
      for (const window of restaurant.byDay[day]) {
        const base = day * MINUTES_PER_DAY
        instants.add((base + window.open) % MINUTES_PER_WEEK)
        const closeOffset = window.close < window.open ? MINUTES_PER_DAY : 0
        instants.add((base + window.close + closeOffset) % MINUTES_PER_WEEK)
      }
    }
  }
  return Array.from(instants).sort((a, b) => a - b)
})()

/** Milliseconds until the next instant at which some status changes. */
export function msUntilNextBoundary(now: Date): number {
  if (BOUNDARIES.length === 0) return MINUTES_PER_WEEK * MS_PER_MINUTE

  const msIntoWeek =
    now.getDay() * MINUTES_PER_DAY * MS_PER_MINUTE +
    now.getHours() * 60 * MS_PER_MINUTE +
    now.getMinutes() * MS_PER_MINUTE +
    now.getSeconds() * 1000 +
    now.getMilliseconds()
  const minuteIntoWeek = Math.floor(msIntoWeek / MS_PER_MINUTE)

  // First boundary strictly after the current minute; wraps to next week.
  let low = 0
  let high = BOUNDARIES.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (BOUNDARIES[mid] <= minuteIntoWeek) low = mid + 1
    else high = mid
  }
  const next =
    low < BOUNDARIES.length ? BOUNDARIES[low] : BOUNDARIES[0] + MINUTES_PER_WEEK

  return next * MS_PER_MINUTE - msIntoWeek
}

/** Status for every restaurant, positionally aligned with `RESTAURANTS`. */
export function resolveAll(now: Date): ReadonlyArray<OpenStatus> {
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return RESTAURANTS.map((restaurant) => resolveStatus(restaurant, day, minutes))
}

/** What the server renders: no badge, so hydration cannot disagree with it. */
export const UNKNOWN_STATUSES: ReadonlyArray<OpenStatus> = Object.freeze(
  RESTAURANTS.map(() => null),
)
