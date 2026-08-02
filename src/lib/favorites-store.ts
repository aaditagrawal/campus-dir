/**
 * Favourites live in a module-level store rather than React state.
 *
 * Every card on every page renders a `FavoriteButton`, so the render cost of a
 * single toggle is what matters here. Holding the set in a `Map` keyed by id
 * makes membership and mutation O(1), and routing notifications through
 * per-id listener buckets means toggling one item wakes one button instead of
 * every button on the page.
 */

export type FavoriteType =
  | "restaurant"
  | "hostel"
  | "emergency"
  | "service"
  | "travel"
  | "academic"
  | "tool"
  | "grievance"

export type FavoriteItem = {
  id: string
  type: FavoriteType
  name: string
  href: string
  phones?: string[]
  subtitle?: string
}

const STORAGE_KEY = "mit-directory-favorites"

/** Insertion-ordered, so the favourites page keeps the order items were saved. */
const entries = new Map<string, FavoriteItem>()

type Listener = () => void

/** Listeners scoped to one favourite id — the `FavoriteButton` subscription. */
const listenersById = new Map<string, Set<Listener>>()
/** Listeners that care about the collection as a whole — list and count. */
const collectionListeners = new Set<Listener>()

const EMPTY: readonly FavoriteItem[] = Object.freeze([])

let hydrated = false
let listCache: readonly FavoriteItem[] = EMPTY
let listCacheStale = true

/* -------------------------------------------------------------------------- */
/* Snapshots                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Rebuilt lazily: most toggles happen on pages that render buttons but never
 * read the list, so the O(n) materialization is skipped entirely there.
 */
export function getFavorites(): readonly FavoriteItem[] {
  if (listCacheStale) {
    listCache = entries.size === 0 ? EMPTY : Array.from(entries.values())
    listCacheStale = false
  }
  return listCache
}

export function getServerFavorites(): readonly FavoriteItem[] {
  return EMPTY
}

/**
 * `"pending"` until `localStorage` has been read. Collapsing "is it saved" and
 * "do we know yet" into one primitive lets a button hold a single subscription
 * and lets React bail out of the re-render whenever the value is unchanged —
 * which is every toggle except the button's own.
 */
export type FavoriteStatus = "pending" | "saved" | "unsaved"

export function getFavoriteStatus(id: string): FavoriteStatus {
  if (!hydrated) return "pending"
  return entries.has(id) ? "saved" : "unsaved"
}

export function getServerFavoriteStatus(): FavoriteStatus {
  return "pending"
}

export function getCount(): number {
  return entries.size
}

export function getServerCount(): number {
  return 0
}

export function isHydrated(): boolean {
  return hydrated
}

export function isNotHydrated(): boolean {
  return false
}

/* -------------------------------------------------------------------------- */
/* Subscriptions                                                              */
/* -------------------------------------------------------------------------- */

function notify(id: string): void {
  const scoped = listenersById.get(id)
  if (scoped) for (const listener of scoped) listener()
  for (const listener of collectionListeners) listener()
}

function notifyAll(): void {
  for (const scoped of listenersById.values()) {
    for (const listener of scoped) listener()
  }
  for (const listener of collectionListeners) listener()
}

export function subscribeToId(id: string, listener: Listener): () => void {
  hydrate()
  let scoped = listenersById.get(id)
  if (!scoped) {
    scoped = new Set()
    listenersById.set(id, scoped)
  }
  scoped.add(listener)
  return () => {
    scoped.delete(listener)
    if (scoped.size === 0) listenersById.delete(id)
  }
}

export function subscribeToCollection(listener: Listener): () => void {
  hydrate()
  collectionListeners.add(listener)
  return () => {
    collectionListeners.delete(listener)
  }
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function toggleFavorite(item: FavoriteItem): void {
  if (!entries.delete(item.id)) entries.set(item.id, item)
  listCacheStale = true
  schedulePersist()
  notify(item.id)
}

export function removeFavorite(id: string): void {
  if (!entries.delete(id)) return
  listCacheStale = true
  schedulePersist()
  notify(id)
}

export function clearAll(): void {
  if (entries.size === 0) return
  entries.clear()
  listCacheStale = true
  schedulePersist()
  notifyAll()
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

const VALID_TYPES: ReadonlySet<string> = new Set<FavoriteType>([
  "restaurant",
  "hostel",
  "emergency",
  "service",
  "travel",
  "academic",
  "tool",
  "grievance",
])

/**
 * Anything that would make a consumer throw later — a missing id, an href the
 * favourites page would try to route on, a type with no section — is dropped
 * here instead. Stored data outlives the schema that wrote it.
 */
function isValidItem(value: unknown): value is FavoriteItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<FavoriteItem>
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.name === "string" &&
    typeof item.href === "string" &&
    typeof item.type === "string" &&
    VALID_TYPES.has(item.type)
  )
}

function readStorage(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : []
  } catch (error) {
    console.error("Failed to load favorites:", error)
    return []
  }
}

/**
 * Deferred until the first subscription, which React runs after mount. The
 * first client render therefore matches the server render, and hydration
 * cannot mismatch.
 */
function hydrate(): void {
  if (hydrated || typeof window === "undefined") return
  hydrated = true

  for (const item of readStorage()) entries.set(item.id, item)
  listCacheStale = true

  // A second tab writing favourites should be reflected here without a reload.
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return
    entries.clear()
    for (const item of readStorage()) entries.set(item.id, item)
    listCacheStale = true
    notifyAll()
  })

  // Never lose a pending write to a tab close or a bfcache freeze.
  window.addEventListener("pagehide", flushPersist)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersist()
  })

  notifyAll()
}

let persistHandle: number | null = null

/**
 * Serializing and writing on every toggle put a synchronous `JSON.stringify`
 * plus a `localStorage` write on the click path. Coalescing to one idle write
 * keeps a burst of toggles at a single serialization.
 */
function schedulePersist(): void {
  if (typeof window === "undefined" || persistHandle !== null) return

  if (typeof requestIdleCallback === "function") {
    persistHandle = requestIdleCallback(flushPersist, { timeout: 500 })
  } else {
    persistHandle = window.setTimeout(flushPersist, 150)
  }
}

function flushPersist(): void {
  if (persistHandle === null) return
  persistHandle = null

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getFavorites()))
  } catch (error) {
    console.error("Failed to save favorites:", error)
  }
}
