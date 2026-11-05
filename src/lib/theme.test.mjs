import { test } from "node:test";
import assert from "node:assert/strict";
import { runInNewContext } from "node:vm";
import { themeBootstrap, subscribeTheme, getTheme, getInitialTheme, setTheme } from "./theme.ts";

function browser(saved, dark = false, denied = false) {
  const classes = new Set(["font-class", "light"]);
  const style = {};
  const systemListeners = new Set();
  const storageListeners = new Set();
  const media = {
    matches: dark,
    addEventListener: (_, listener) => systemListeners.add(listener),
    removeEventListener: (_, listener) => systemListeners.delete(listener),
  };
  const localStorage = {
    getItem() {
      if (denied) throw new Error("denied");
      return saved;
    },
    setItem(_, value) {
      if (denied) throw new Error("denied");
      saved = value;
    },
  };
  const window = {
    document: {
      documentElement: {
        classList: {
          remove: (...values) => values.forEach((value) => classes.delete(value)),
          add: (value) => classes.add(value),
        },
        style,
      },
    },
    localStorage,
    matchMedia: () => media,
    addEventListener: (_, listener) => storageListeners.add(listener),
    removeEventListener: (_, listener) => storageListeners.delete(listener),
  };
  return { window, classes, style, media, systemListeners, storageListeners, saved: () => saved };
}

test("the actual pre-paint script resolves persisted and system themes", () => {
  for (const [saved, dark, expected] of [
    ["dark", false, "dark"],
    ["light", true, "light"],
    ["system", true, "dark"],
    [null, false, "light"],
    ["invalid", true, "dark"],
  ]) {
    const env = browser(saved, dark);
    runInNewContext(themeBootstrap, { window: env.window });
    assert.deepEqual([...env.classes].sort(), ["font-class", expected].sort());
    assert.equal(env.style.colorScheme, expected);
  }
  const denied = browser(null, true, true);
  runInNewContext(themeBootstrap, { window: denied.window });
  assert.equal(denied.style.colorScheme, "dark");
});

test("initial theme is server-safe and does not mutate the DOM during rendering", () => {
  assert.equal(getInitialTheme(), undefined);
  const env = browser("system", true);
  globalThis.window = env.window;
  try {
    assert.deepEqual(getInitialTheme(), { theme: "system", resolvedTheme: "dark" });
    assert.deepEqual([...env.classes], ["font-class", "light"]);
    assert.equal(env.style.colorScheme, undefined);
  } finally {
    delete globalThis.window;
  }
});

test("theme store handles system changes, persistence, cross-tab changes and cleanup", () => {
  const env = browser("system", true);
  globalThis.window = env.window;
  try {
    let changes = 0;
    const stop = subscribeTheme(() => changes++);
    const second = subscribeTheme(() => changes++);
    assert.deepEqual(getInitialTheme(), { theme: "system", resolvedTheme: "dark" });
    assert.deepEqual(getTheme(), { theme: "system", resolvedTheme: "dark" });
    assert.equal(env.systemListeners.size, 1);
    env.media.matches = false;
    for (const listener of env.systemListeners) listener();
    assert.equal(getTheme().resolvedTheme, "light");
    setTheme("dark");
    assert.equal(env.saved(), "dark");
    for (const listener of env.systemListeners) listener();
    assert.equal(getTheme().resolvedTheme, "dark");
    const before = changes;
    for (const listener of env.storageListeners)
      listener({ key: "other", newValue: "light", storageArea: env.window.localStorage });
    for (const listener of env.storageListeners)
      listener({ key: "theme", newValue: "light", storageArea: {} });
    assert.equal(changes, before);
    for (const listener of env.storageListeners)
      listener({ key: "theme", newValue: "light", storageArea: env.window.localStorage });
    assert.deepEqual(getTheme(), { theme: "light", resolvedTheme: "light" });
    env.media.matches = true;
    for (const listener of env.storageListeners)
      listener({ key: null, newValue: null, storageArea: env.window.localStorage });
    assert.deepEqual(getTheme(), { theme: "system", resolvedTheme: "dark" });
    stop();
    assert.equal(env.systemListeners.size, 1);
    second();
    assert.equal(env.systemListeners.size, 0);
    assert.equal(env.storageListeners.size, 0);
  } finally {
    delete globalThis.window;
  }
});

test("denied storage writes still update the live page", () => {
  const env = browser(null, false, true);
  globalThis.window = env.window;
  const stop = subscribeTheme(() => {});
  try {
    setTheme("dark");
    assert.deepEqual(getTheme(), { theme: "dark", resolvedTheme: "dark" });
    assert.equal(env.style.colorScheme, "dark");
  } finally {
    stop();
    delete globalThis.window;
  }
});
