export type Theme = "light" | "dark" | "system";
type ThemeState = { theme: Theme; resolvedTheme: "light" | "dark" };

// Self-contained so the exact same code can run before hydration and on changes.
export function applyTheme(preference?: Theme, fallback: Theme = "system"): ThemeState {
  let theme = preference ?? "system";
  if (preference === undefined) {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") theme = saved;
    } catch {
      // Private browsing can block storage while themes remain usable.
      theme = fallback;
    }
  }
  let systemDark = false;
  if (theme === "system") {
    try {
      systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      // Use light when the browser cannot report a color preference.
    }
  }
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  const root = document.documentElement;
  // Change the theme in one mutation while preserving unrelated classes.
  if (!root.classList.replace(resolvedTheme === "dark" ? "light" : "dark", resolvedTheme)) {
    root.classList.add(resolvedTheme);
  }
  root.style.colorScheme = resolvedTheme;
  return { theme, resolvedTheme };
}

export const themeBootstrap = `(${applyTheme.toString()})()`;

const listeners = new Set<() => void>();
let current: ThemeState | undefined;
let stopListening: (() => void) | undefined;

function update(preference?: Theme) {
  const next = applyTheme(preference, current?.theme);
  if (next.theme === current?.theme && next.resolvedTheme === current?.resolvedTheme) return;
  current = next;
  // React can unsubscribe and resubscribe synchronously while notified.
  for (const listener of [...listeners]) listener();
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Keep the in-memory selection even when persistence is unavailable.
  }
  update(theme);
}

export function getTheme() {
  return current;
}

export function getServerTheme() {
  return undefined;
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) startListening();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopListening?.();
  };
}

function startListening() {
  update();
  const onStorage = (event: StorageEvent) => {
    if (event.key !== "theme" && event.key !== null) return;
    const value = event.newValue;
    update(value === "light" || value === "dark" ? value : "system");
  };
  const onSystemChange = () => {
    if (current?.theme === "system") update("system");
  };
  window.addEventListener("storage", onStorage);
  let media: MediaQueryList | undefined;
  try {
    media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", onSystemChange);
  } catch {
    // The explicit light/dark toggle also works without matchMedia.
  }
  stopListening = () => {
    window.removeEventListener("storage", onStorage);
    media?.removeEventListener("change", onSystemChange);
  };
}
