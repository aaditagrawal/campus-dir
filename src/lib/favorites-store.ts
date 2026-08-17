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
  | "grievance";

export type FavoriteItem = {
  id: string;
  type: FavoriteType;
  name: string;
  href: string;
  phones?: string[];
  subtitle?: string;
};

const STORAGE_KEY = "mit-directory-favorites";

/** Insertion-ordered, so the favourites page keeps the order items were saved. */
const entries = new Map<string, FavoriteItem>();

type Listener = () => void;

/** Listeners scoped to one favourite id - the `FavoriteButton` subscription. */
const listenersById = new Map<string, Set<Listener>>();
/** Listeners that care about the collection as a whole - list and count. */
const collectionListeners = new Set<Listener>();

const EMPTY: readonly FavoriteItem[] = Object.freeze([]);

let hydrated = false;
let listCache: readonly FavoriteItem[] = EMPTY;
let listCacheStale = true;

/* -------------------------------------------------------------------------- */
/* Snapshots                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Rebuilt lazily: most toggles happen on pages that render buttons but never
 * read the list, so the O(n) materialization is skipped entirely there.
 */
export function getFavorites(): readonly FavoriteItem[] {
  if (listCacheStale) {
    listCache = entries.size === 0 ? EMPTY : Array.from(entries.values());
    listCacheStale = false;
  }
  return listCache;
}

export function getServerFavorites(): readonly FavoriteItem[] {
  return EMPTY;
}

/**
 * `"pending"` until `localStorage` has been read. Collapsing "is it saved" and
 * "do we know yet" into one primitive lets a button hold a single subscription
 * and lets React bail out of the re-render whenever the value is unchanged -
 * which is every toggle except the button's own.
 */
export type FavoriteStatus = "pending" | "saved" | "unsaved";

export function getFavoriteStatus(id: string): FavoriteStatus {
  if (!hydrated) return "pending";
  return entries.has(id) ? "saved" : "unsaved";
}

export function getServerFavoriteStatus(): FavoriteStatus {
  return "pending";
}

export function getCount(): number {
  return entries.size;
}

export function getServerCount(): number {
  return 0;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function isNotHydrated(): boolean {
  return false;
}

/* -------------------------------------------------------------------------- */
/* Subscriptions                                                              */
/* -------------------------------------------------------------------------- */

function notify(id: string): void {
  const scoped = listenersById.get(id);
  if (scoped) for (const listener of scoped) listener();
  for (const listener of collectionListeners) listener();
}

function notifyAll(): void {
  for (const scoped of listenersById.values()) {
    for (const listener of scoped) listener();
  }
  for (const listener of collectionListeners) listener();
}

export function subscribeToId(id: string, listener: Listener): () => void {
  hydrate();
  let scoped = listenersById.get(id);
  if (!scoped) {
    scoped = new Set();
    listenersById.set(id, scoped);
  }
  scoped.add(listener);
  return () => {
    scoped.delete(listener);
    if (scoped.size === 0) listenersById.delete(id);
  };
}

export function subscribeToCollection(listener: Listener): () => void {
  hydrate();
  collectionListeners.add(listener);
  return () => {
    collectionListeners.delete(listener);
  };
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function toggleFavorite(item: FavoriteItem): void {
  const removed = entries.delete(item.id);
  if (!removed) entries.set(item.id, item);

  pendingWrites.set(item.id, removed ? null : item);
  listCacheStale = true;
  schedulePersist();
  notify(item.id);
}

export function removeFavorite(id: string): void {
  if (!entries.delete(id)) return;

  pendingWrites.set(id, null);
  listCacheStale = true;
  schedulePersist();
  notify(id);
}

export function clearAll(): void {
  if (entries.size === 0) return;
  entries.clear();

  pendingWrites.clear();
  pendingClear = true;
  listCacheStale = true;
  schedulePersist();
  notifyAll();
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
]);

function isFavoriteType(value: string): value is FavoriteType {
  return VALID_TYPES.has(value);
}

/** Everything `JSON.parse` can hand back, which is all the reader may assume. */
type JsonValue = string | number | boolean | null | JsonValue[] | JsonRecord;
type JsonRecord = { readonly [key: string]: JsonValue };

function isJsonRecord(value: JsonValue): value is JsonRecord {
  return value !== null && !Array.isArray(value) && value instanceof Object;
}

/**
 * Reads a decoded JSON field that has to be text already.
 *
 * `String` hands a primitive string straight back, so a value that survives the
 * round trip unchanged was text to begin with, while a number, boolean, `null`
 * or object all produce something different and are rejected. Coercing instead
 * of rejecting would let `{}` through as the id `"[object Object]"`.
 */
function readText(value: JsonValue): string | null {
  const text = String(value);
  return text === value ? text : null;
}

/**
 * Decodes one stored entry, or `null` when it no longer matches what this
 * module writes. Anything that would make a consumer throw later - a missing
 * id, an href the favourites page would try to route on, a type with no
 * section - is dropped here instead. Stored data outlives the schema that
 * wrote it.
 */
function decodeFavorite(raw: JsonValue): FavoriteItem | null {
  if (!isJsonRecord(raw)) return null;

  const id = readText(raw.id);
  const name = readText(raw.name);
  const href = readText(raw.href);
  const type = readText(raw.type);
  if (id === null || name === null || href === null || type === null) return null;
  if (id.length === 0 || !isFavoriteType(type)) return null;

  const item: FavoriteItem = { id, type, name, href };

  const subtitle = readText(raw.subtitle);
  if (subtitle !== null) item.subtitle = subtitle;

  const rawPhones = raw.phones;
  if (Array.isArray(rawPhones)) {
    const phones = rawPhones.map(readText).filter((phone) => phone !== null);
    if (phones.length > 0) item.phones = phones;
  }

  return item;
}

function readStorage(): FavoriteItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: JsonValue = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const items: FavoriteItem[] = [];
    for (const candidate of parsed) {
      const item = decodeFavorite(candidate);
      if (item !== null) items.push(item);
    }
    return items;
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }
}

/**
 * Deferred until the first subscription, which React runs after mount. The
 * first client render therefore matches the server render, and hydration
 * cannot mismatch.
 */
function hydrate(): void {
  if (hydrated || !("window" in globalThis)) return;
  hydrated = true;

  for (const item of readStorage()) entries.set(item.id, item);
  listCacheStale = true;

  // A second tab writing favourites should be reflected here without a reload.
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    mergeRemote();
  });

  // Never lose a pending write to a tab close or a bfcache freeze.
  window.addEventListener("pagehide", flushPersist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersist();
  });

  notifyAll();
}

let persistHandle: number | null = null;

/**
 * Local changes made since the last successful write, as id -> item, or
 * `null` for a removal.
 *
 * Deferring the write opens a window in which another tab can flush first and
 * fire a `storage` event here. Without this log, adopting that snapshot would
 * discard whatever this tab had toggled but not yet written, and the pending
 * flush would then persist the loss. Replaying the log over the incoming
 * snapshot resolves it per id: each tab keeps its own edits and picks up the
 * other's.
 */
const pendingWrites = new Map<string, FavoriteItem | null>();
/** A pending `clearAll` removes everything the other tab knows about too. */
let pendingClear = false;

/** Ids in order, cheap enough to compare directly at these sizes. */
function signature(): string {
  return Array.from(entries.keys()).join(" ");
}

/** Rebuilds `entries` from storage with the unwritten local log replayed on top. */
function rebuildFromStorage(): void {
  entries.clear();

  if (!pendingClear) {
    for (const item of readStorage()) entries.set(item.id, item);
  }
  for (const [id, item] of pendingWrites) {
    if (item === null) entries.delete(id);
    else entries.set(id, item);
  }

  listCacheStale = true;
}

/** Adopts another tab's snapshot without dropping edits this tab has not written yet. */
function mergeRemote(): void {
  rebuildFromStorage();
  // The merged result is not on disk yet if we still hold unwritten edits.
  if (pendingWrites.size > 0 || pendingClear) schedulePersist();
  notifyAll();
}

/**
 * Serializing and writing on every toggle put a synchronous `JSON.stringify`
 * plus a `localStorage` write on the click path. Coalescing to one idle write
 * keeps a burst of toggles at a single serialization.
 */
function schedulePersist(): void {
  if (!("window" in globalThis) || persistHandle !== null) return;

  if ("requestIdleCallback" in globalThis) {
    persistHandle = requestIdleCallback(flushPersist, { timeout: 500 });
  } else {
    persistHandle = window.setTimeout(flushPersist, 150);
  }
}

function flushPersist(): void {
  if (persistHandle === null) return;
  persistHandle = null;
  if (pendingWrites.size === 0 && !pendingClear) return;

  // Read-modify-write, not a blind overwrite. Another tab may have flushed
  // since our last read and had its `storage` event queued behind this
  // callback - writing our own snapshot would drop whatever it saved. Reading
  // and writing in one synchronous turn is atomic enough: browsers serialize
  // localStorage access per origin.
  const before = signature();
  rebuildFromStorage();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getFavorites()));
    // On disk now, so there is nothing left for a remote merge to replay.
    pendingWrites.clear();
    pendingClear = false;
  } catch (error) {
    // Keep the log; the next mutation reschedules and tries again.
    console.error("Failed to save favorites:", error);
  }

  if (signature() !== before) notifyAll();
}
