import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { runInNewContext } from "node:vm";
import {
  applyTheme,
  getServerTheme,
  getTheme,
  setTheme,
  subscribeTheme,
  themeBootstrap,
} from "../../src/lib/theme";

type StorageChange = { key: string | null; newValue: string | null };
const storageListeners = new Set<(event: StorageChange) => void>();
const mediaListeners = new Set<() => void>();
const storage = new Map<string, string>();
const classes = new Set<string>();
let dark = false;
let blockedStorage = false;
let blockedMedia = false;
const localStorage = {
  getItem(key: string) {
    if (blockedStorage) throw new Error("Storage blocked");
    return storage.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    if (blockedStorage) throw new Error("Storage blocked");
    storage.set(key, value);
  },
};
const document = {
  documentElement: {
    classList: {
      add: (...values: string[]) => values.forEach((value) => classes.add(value)),
      remove: (...values: string[]) => values.forEach((value) => classes.delete(value)),
    },
    style: { colorScheme: "" },
  },
};
const window = {
  matchMedia() {
    if (blockedMedia) throw new Error("Media unavailable");
    return {
      get matches() {
        return dark;
      },
      addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) =>
        mediaListeners.delete(listener),
    };
  },
  addEventListener: (_event: string, listener: (event: StorageChange) => void) =>
    storageListeners.add(listener),
  removeEventListener: (_event: string, listener: (event: StorageChange) => void) =>
    storageListeners.delete(listener),
};

beforeEach(() => {
  assert.equal(storageListeners.size, 0, "previous subscription cleaned up");
  assert.equal(mediaListeners.size, 0, "previous media subscription cleaned up");
  storage.clear();
  classes.clear();
  classes.add("font-sans");
  dark = blockedStorage = blockedMedia = false;
  Object.assign(globalThis, { localStorage, document, window });
});

test("prepaint script matches live application and preserves font classes", () => {
  for (const saved of [null, "system", "light", "dark", "invalid"]) {
    for (dark of [false, true]) {
      storage.clear();
      if (saved !== null) storage.set("theme", saved);
      runInNewContext(themeBootstrap, { localStorage, document, window });
      const bootstrapClasses = [...classes].sort();
      const bootstrapScheme = document.documentElement.style.colorScheme;
      applyTheme();
      assert.deepEqual([...classes].sort(), bootstrapClasses);
      assert.equal(document.documentElement.style.colorScheme, bootstrapScheme);
      assert.ok(classes.has("font-sans"));
      assert.equal(classes.has("dark"), saved === "dark" || (saved !== "light" && dark));
    }
  }
});

test("system preference changes, explicit selection, cross-tab removal, and cleanup", () => {
  let calls = 0;
  const stop = subscribeTheme(() => calls++);
  assert.equal(getServerTheme(), undefined);
  assert.equal(getTheme()?.theme, "system");
  dark = true;
  for (const listener of mediaListeners) listener();
  assert.equal(getTheme()?.resolvedTheme, "dark");
  setTheme("light");
  assert.equal(storage.get("theme"), "light");
  dark = false;
  for (const listener of mediaListeners) listener();
  assert.equal(getTheme()?.theme, "light");
  for (const listener of storageListeners) listener({ key: "other", newValue: "dark" });
  assert.equal(getTheme()?.theme, "light");
  for (const listener of storageListeners) listener({ key: "theme", newValue: "dark" });
  assert.equal(getTheme()?.resolvedTheme, "dark");
  for (const listener of storageListeners) listener({ key: "theme", newValue: null });
  assert.equal(getTheme()?.theme, "system");
  assert.equal(getTheme()?.resolvedTheme, "light");
  assert.ok(calls >= 4);
  stop();
});

test("multiple consumers retain shared listeners until the last unsubscribe", () => {
  const stopOne = subscribeTheme(() => {});
  let calls = 0;
  const stopTwo = subscribeTheme(() => calls++);
  stopOne();
  assert.equal(mediaListeners.size, 1);
  setTheme("dark");
  assert.equal(calls, 1);
  stopTwo();
});

test("blocked storage and unavailable matchMedia keep explicit themes usable", () => {
  blockedStorage = blockedMedia = true;
  runInNewContext(themeBootstrap, { localStorage, document, window });
  assert.ok(classes.has("light"));
  const stop = subscribeTheme(() => {});
  setTheme("dark");
  assert.equal(getTheme()?.resolvedTheme, "dark");
  assert.equal(document.documentElement.style.colorScheme, "dark");
  stop();
});
