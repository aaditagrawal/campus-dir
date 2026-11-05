import { describe, test, expect } from "bun:test";
import { createThemeStore, themeInitializationScript } from "../src/lib/theme.ts";
import { runInNewContext } from "node:vm";

class Browser extends EventTarget {
  preference = null;
  storageDenied = false;
  media = Object.assign(new EventTarget(), { matches: false });
  classes = new Set(["font-token"]);
  document = {
    documentElement: {
      classList: {
        remove: (...tokens) => tokens.forEach((token) => this.classes.delete(token)),
        add: (token) => this.classes.add(token),
      },
      style: { colorScheme: "" },
    },
  };
  storage = {
    getItem: () => this.preference,
    setItem: (key, value) => {
      this.preference = value;
    },
  };
  get localStorage() {
    if (this.storageDenied) throw new Error("Storage denied");
    return this.storage;
  }
  matchMedia() {
    return this.media;
  }
  changeSystem(dark) {
    this.media.matches = dark;
    this.media.dispatchEvent(new Event("change"));
  }
  changeStorage(value, key = "theme", storageArea = this.storage) {
    if (storageArea === this.storage) this.preference = value;
    this.dispatchEvent(Object.assign(new Event("storage"), { key, newValue: value, storageArea }));
  }
  expectTheme(theme) {
    expect(this.classes.has(theme)).toBe(true);
    expect(this.classes.has(theme === "dark" ? "light" : "dark")).toBe(false);
    expect(this.classes.has("font-token")).toBe(true);
    expect(this.document.documentElement.style.colorScheme).toBe(theme);
  }
}

describe("owned theme state", () => {
  test("pre-paint initializer matches valid saved preferences and system colors", () => {
    for (const preference of [null, "system", "light", "dark", "invalid"]) {
      for (const dark of [false, true]) {
        const browser = new Browser();
        browser.preference = preference;
        browser.media.matches = dark;
        runInNewContext(themeInitializationScript, {
          localStorage: browser.localStorage,
          matchMedia: () => browser.media,
          document: browser.document,
        });
        browser.expectTheme(
          preference === "light" || preference === "dark" ? preference : dark ? "dark" : "light",
        );
      }
    }
  });

  test("blocked storage still initializes and permits theme changes", () => {
    const browser = new Browser();
    browser.storageDenied = true;
    browser.media.matches = true;
    const context = { matchMedia: () => browser.media, document: browser.document };
    Object.defineProperty(context, "localStorage", {
      get() {
        throw new Error("Storage denied");
      },
    });
    runInNewContext(themeInitializationScript, context);
    browser.expectTheme("dark");
    const store = createThemeStore(browser);
    const unsubscribe = store.subscribe(() => {});
    store.setTheme("light");
    browser.expectTheme("light");
    unsubscribe();
    const resubscribe = store.subscribe(() => {});
    expect(store.getSnapshot()).toBe("light");
    resubscribe();
  });

  test("system changes affect only system preference, persisted choices survive", () => {
    const browser = new Browser();
    const store = createThemeStore(browser);
    let notifications = 0;
    const unsubscribe = store.subscribe(() => notifications++);
    browser.expectTheme("light");
    browser.changeSystem(true);
    browser.expectTheme("dark");
    expect(store.getSnapshot()).toBe("system");
    store.setTheme("light");
    expect(browser.preference).toBe("light");
    browser.changeSystem(true);
    browser.expectTheme("light");
    store.setTheme("light");
    expect(notifications).toBe(1);
    store.setTheme("system");
    browser.expectTheme("dark");
    unsubscribe();
  });

  test("cross-tab changes, removals, clear and unrelated storage events", () => {
    const browser = new Browser();
    const store = createThemeStore(browser);
    const unsubscribe = store.subscribe(() => {});
    browser.changeStorage("dark");
    browser.expectTheme("dark");
    browser.changeStorage("light", "other-key");
    browser.expectTheme("dark");
    browser.changeStorage("light", "theme", {});
    browser.expectTheme("dark");
    browser.changeStorage(null);
    expect(store.getSnapshot()).toBe("system");
    browser.expectTheme("light");
    browser.changeStorage("dark");
    browser.changeStorage(null, null);
    expect(store.getSnapshot()).toBe("system");
    browser.changeStorage("corrupt");
    expect(store.getSnapshot()).toBe("system");
    unsubscribe();
  });

  test("last unsubscribe cleans up, and re-subscribe reads changes made while idle", () => {
    const browser = new Browser();
    const store = createThemeStore(browser);
    const first = store.subscribe(() => {});
    const second = store.subscribe(() => {});
    first();
    browser.changeStorage("dark");
    expect(store.getSnapshot()).toBe("dark");
    second();
    browser.changeStorage("light");
    expect(store.getSnapshot()).toBe("dark");
    const third = store.subscribe(() => {});
    expect(store.getSnapshot()).toBe("light");
    browser.expectTheme("light");
    third();
    browser.changeSystem(true);
    browser.expectTheme("light");
  });
});
