export type ThemePreference = "light" | "dark" | "system";
export type ThemeState = { theme: ThemePreference; resolvedTheme: "light" | "dark" };

/** Self-contained so the same initialization can run before the first paint. */
export function initializeTheme(apply = true): ThemeState {
  let theme: ThemePreference = "system";
  try {
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark" || saved === "system") theme = saved;
  } catch {
    // Private browsing and storage policies can deny access; system still works.
  }
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  if (apply) {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }
  return { theme, resolvedTheme };
}

export const themeBootstrap = `(${initializeTheme.toString()})();`;

let state: ThemeState | undefined;
let stop: (() => void) | undefined;
const listeners = new Set<() => void>();

function applyTheme(theme: ThemePreference): void {
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
  root.style.colorScheme = resolvedTheme;
  if (state?.theme === theme && state.resolvedTheme === resolvedTheme) return;
  state = { theme, resolvedTheme };
  for (const listener of listeners) listener();
}

export function setTheme(theme: ThemePreference): void {
  applyTheme(theme);
  try {
    window.localStorage.setItem("theme", theme);
  } catch {
    // A denied write must not prevent changing the current page's theme.
  }
}

export function getTheme(): ThemeState | undefined {
  return state;
}

export function getInitialTheme(): ThemeState | undefined {
  return "window" in globalThis ? initializeTheme(false) : undefined;
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  if (!stop) {
    state = initializeTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (state?.theme === "system") applyTheme("system");
    };
    const onStorage = (event: StorageEvent) => {
      // Ignore sessionStorage and unrelated keys; clear() resets the preference.
      if (event.key !== "theme" && event.key !== null) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      const saved = event.newValue;
      applyTheme(saved === "light" || saved === "dark" ? saved : "system");
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    stop = () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop?.();
      stop = undefined;
    }
  };
}
