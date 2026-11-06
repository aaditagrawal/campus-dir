import { describe, test, expect } from "bun:test";
import { runInNewContext } from "node:vm";
import { applyTheme, parseTheme, readTheme, themeInitializationScript } from "../src/lib/theme.ts";

function browser(preference = null, dark = false) {
  const tokens = new Set(["font-serif", "font-sans"]);
  const writes = [];
  const target = {
    localStorage: { getItem: () => preference },
    matchMedia: () => ({ matches: dark }),
    document: {
      documentElement: {
        classList: {
          replace(previous, next) {
            if (!tokens.has(previous)) return false;
            tokens.delete(previous);
            tokens.add(next);
            writes.push(next);
            return true;
          },
          add(token) {
            writes.push(token);
            tokens.add(token);
          },
          contains: (token) => tokens.has(token),
        },
        style: { colorScheme: "" },
      },
    },
  };
  return { target, tokens, writes };
}

describe("theme selection", () => {
  test("only the supported stored preferences are accepted", () => {
    for (const value of [null, "system", "broken", "__proto__", "Dark", ""])
      expect(parseTheme(value)).toBe("system");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(readTheme(undefined)).toBe("system");
    expect(readTheme(browser("dark").target)).toBe("dark");
  });

  test("denied storage uses system preference", () => {
    const { target } = browser();
    Object.defineProperty(target, "localStorage", {
      get() {
        throw new Error("Storage denied");
      },
    });
    expect(readTheme(target)).toBe("system");
  });

  test("colors change once and retain unrelated root classes", () => {
    const { target, tokens, writes } = browser();
    applyTheme(target, "system", true);
    expect(tokens.has("dark")).toBe(true);
    applyTheme(target, "dark", false);
    expect(writes).toEqual(["dark"]);
    target.document.documentElement.style.colorScheme = "light";
    applyTheme(target, "dark", false);
    expect(target.document.documentElement.style.colorScheme).toBe("dark");
    expect(writes).toEqual(["dark"]);
    applyTheme(target, "light", true);
    expect(writes).toEqual(["dark", "light"]);
    expect(tokens.has("dark")).toBe(false);
    expect(tokens.has("font-serif")).toBe(true);
    expect(tokens.has("font-sans")).toBe(true);
    expect(target.document.documentElement.style.colorScheme).toBe("light");
  });

  test("pre-paint script matches mounted application for every preference and system color", () => {
    for (const preference of [null, "system", "light", "dark", "corrupt"]) {
      for (const dark of [false, true]) {
        const actual = browser(preference, dark);
        const mounted = browser(preference, dark);
        runInNewContext(themeInitializationScript, actual.target);
        applyTheme(mounted.target, parseTheme(preference), dark);
        expect([...actual.tokens]).toEqual([...mounted.tokens]);
        expect(actual.target.document.documentElement.style.colorScheme).toBe(
          mounted.target.document.documentElement.style.colorScheme,
        );
      }
    }
  });

  test("pre-paint still works when localStorage is blocked", () => {
    const { target, tokens } = browser(null, true);
    Object.defineProperty(target, "localStorage", {
      get() {
        throw new Error("Storage denied");
      },
    });
    runInNewContext(themeInitializationScript, target);
    expect(tokens.has("dark")).toBe(true);
    expect(target.document.documentElement.style.colorScheme).toBe("dark");
  });
});
