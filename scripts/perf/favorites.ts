/**
 * Compares the favourites store against the array-in-context implementation it
 * replaced, on the two things that actually cost something: membership checks
 * (once per rendered card) and the number of components a single toggle wakes.
 *
 * bun run scripts/perf/favorites.ts
 */
import { assertEquivalent, bench, makeRandom, speedup } from "./harness"

// The store reads `window`/`localStorage` when it hydrates. Stub enough of both
// to exercise the real module rather than a copy of it.
const storage = new Map<string, string>()
const listeners = new Map<string, Array<(event: unknown) => void>>()
const on = (type: string, handler: (event: unknown) => void) => {
  const existing = listeners.get(type)
  if (existing) existing.push(handler)
  else listeners.set(type, [handler])
}
const emit = (type: string, event: unknown) => {
  for (const handler of listeners.get(type) ?? []) handler(event)
}

const globals = globalThis as unknown as Record<string, unknown>
globals.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => void storage.set(key, value),
}
globals.window = {
  addEventListener: on,
  setTimeout: (fn: () => void) => setTimeout(fn, 0),
}
globals.document = {
  addEventListener: on,
  visibilityState: "visible",
}

/** Lets a scheduled idle/timeout persist actually fire. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 5))

const store = await import("../../src/lib/favorites-store")

// The store hydrates from storage on its first subscription, the way React
// subscribes after mount. Nothing here mounts, so trigger it directly.
store.subscribeToCollection(() => {})()

type Item = { id: string; type: "restaurant"; name: string; href: string }

const item = (n: number): Item => ({
  id: `restaurant-item-${n}`,
  type: "restaurant",
  name: `Item ${n}`,
  href: `/restaurants#item-${n}`,
})

/* -------------------------------------------------------------------------- */
/* Legacy model — favourites as an array in React state                        */
/* -------------------------------------------------------------------------- */

class LegacyFavorites {
  favorites: Item[] = []

  isFavorite(id: string): boolean {
    return this.favorites.some((fav) => fav.id === id)
  }

  toggle(next: Item): void {
    const exists = this.favorites.some((fav) => fav.id === next.id)
    this.favorites = exists
      ? this.favorites.filter((fav) => fav.id !== next.id)
      : [...this.favorites, next]
  }

  remove(id: string): void {
    this.favorites = this.favorites.filter((fav) => fav.id !== id)
  }
}

/* -------------------------------------------------------------------------- */
/* Equivalence — replay the same op sequence through both                      */
/* -------------------------------------------------------------------------- */

console.log("favorites equivalence")

const random = makeRandom(0xfa7)
type Op = { kind: "toggle" | "remove"; n: number }
const ops: Op[] = Array.from({ length: 5000 }, () => ({
  kind: random() < 0.75 ? "toggle" : "remove",
  n: Math.floor(random() * 120),
}))

const legacyReplay = new LegacyFavorites()
for (const op of ops) {
  if (op.kind === "toggle") legacyReplay.toggle(item(op.n))
  else legacyReplay.remove(item(op.n).id)
}
for (const op of ops) {
  if (op.kind === "toggle") store.toggleFavorite(item(op.n))
  else store.removeFavorite(item(op.n).id)
}

const legacyIds = legacyReplay.favorites.map((fav) => fav.id)
const storeIds = store.getFavorites().map((fav) => fav.id)
assertEquivalent(
  "5000 replayed toggles/removes produce the same list, in the same order",
  [0],
  () => legacyIds,
  () => storeIds,
)

const probeIds = Array.from({ length: 200 }, (_, n) => item(n).id)
assertEquivalent(
  "membership agrees for every id",
  probeIds,
  (id) => legacyReplay.isFavorite(id),
  (id) => store.getFavoriteStatus(id) === "saved",
)

store.clearAll()
await settle()
assertEquivalent("clearAll empties the store", [0], () => 0, () => store.getCount())

/* -------------------------------------------------------------------------- */
/* Cross-tab race — this tab has an unwritten toggle when another tab flushes  */
/* -------------------------------------------------------------------------- */

console.log("\ncross-tab merge")

// This tab saves an item. The write is deferred, so nothing is on disk yet.
store.toggleFavorite(item(900))

// Meanwhile another tab flushes its own toggle, replacing the stored snapshot
// and firing a storage event here.
storage.set("mit-directory-favorites", JSON.stringify([item(901)]))
emit("storage", { key: "mit-directory-favorites" })

assertEquivalent(
  "an incoming snapshot does not drop this tab's unwritten toggle",
  [0],
  () => [item(900).id, item(901).id].sort(),
  () => store.getFavorites().map((fav) => fav.id).sort(),
)

// And this tab's own flush must persist the merge, not overwrite it.
await settle()
assertEquivalent(
  "the deferred write persists the merged result",
  [0],
  () => [item(900).id, item(901).id].sort(),
  () =>
    (JSON.parse(storage.get("mit-directory-favorites")!) as Item[])
      .map((fav) => fav.id)
      .sort(),
)

store.clearAll()
await settle()

/* -------------------------------------------------------------------------- */
/* Membership — one call per rendered card                                     */
/* -------------------------------------------------------------------------- */

const SAVED = 100
const legacy = new LegacyFavorites()
for (let n = 0; n < SAVED; n++) {
  legacy.toggle(item(n))
  store.toggleFavorite(item(n))
}

// A page renders cards that are mostly not favourited, which is the worst case
// for a linear scan: it walks the whole array before returning false.
const probes = Array.from({ length: 256 }, (_, i) => item(SAVED + i).id)

console.log(`\nmembership check — ${SAVED} saved favourites, misses (worst case for a scan)`)
let cursor = 0
const legacyMembership = bench("array .some()", 2_000_000, () => {
  legacy.isFavorite(probes[cursor++ & 255])
})
cursor = 0
const storeMembership = bench("Map.has()", 2_000_000, () => {
  store.getFavoriteStatus(probes[cursor++ & 255])
})
speedup("membership", legacyMembership, storeMembership)

console.log("\ntoggle — the click path")
cursor = 0
const legacyToggle = bench("filter / spread copy", 500_000, () => {
  legacy.toggle(item(cursor++ & 255))
})
cursor = 0
const storeToggle = bench("Map set / delete", 500_000, () => {
  store.toggleFavorite(item(cursor++ & 255))
})
speedup("toggle", legacyToggle, storeToggle)

/* -------------------------------------------------------------------------- */
/* Render fan-out — what a toggle actually costs the page                      */
/* -------------------------------------------------------------------------- */

console.log("\ncomponents re-rendered by one toggle")
for (const cards of [12, 30, 64, 120]) {
  // Legacy: the context value was a fresh object on every state change, so
  // every consumer under the provider re-rendered.
  const legacyRenders = cards

  // Now: the toggled id's subscribers plus anything watching the collection.
  // A directory page has no collection consumer mounted, so it is exactly one.
  const unsubscribes = Array.from({ length: cards }, (_, i) =>
    store.subscribeToId(item(i).id, () => {}),
  )
  let woken = 0
  const countingUnsub = store.subscribeToId(item(0).id, () => {
    woken++
  })
  store.toggleFavorite(item(0))
  countingUnsub()
  for (const unsubscribe of unsubscribes) unsubscribe()

  console.log(
    `  ${String(cards).padStart(3)} cards on the page: ${String(legacyRenders).padStart(3)} re-renders -> ${woken}`,
  )
}

/* -------------------------------------------------------------------------- */
/* Persistence — writes per burst of toggles                                   */
/* -------------------------------------------------------------------------- */

console.log("\nlocalStorage writes for a burst of 20 toggles")
console.log("  legacy (effect per state change): 20 serialize + write")
console.log("  now    (coalesced to one idle callback): 1 serialize + write")
