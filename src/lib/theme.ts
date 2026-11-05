export type Theme = "system" | "light" | "dark";

function parseTheme(value: string | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

function readTheme(target: Window, fallback: Theme): Theme {
  try {
    return parseTheme(target.localStorage.getItem("theme"));
  } catch {
    return fallback;
  }
}

// Runs before page content is painted, even when storage access is denied.
export const themeInitializationScript = `(()=>{let theme;try{theme=localStorage.getItem("theme")}catch{}const resolved=theme==="light"||theme==="dark"?theme:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";const root=document.documentElement;root.classList.remove("light","dark");root.classList.add(resolved);root.style.colorScheme=resolved})()`;

export function createThemeStore(target: Window) {
  const media = target.matchMedia("(prefers-color-scheme: dark)");
  const listeners = new Set<() => void>();
  let theme = readTheme(target, "system");
  let applied: "light" | "dark" | undefined;

  function apply(force = false) {
    const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
    if (!force && applied === resolved) return;
    const root = target.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
    applied = resolved;
  }

  function update(value: Theme, force = false) {
    const changed = value !== theme;
    theme = value;
    apply(force);
    if (changed) for (const listener of listeners) listener();
  }

  function onSystemChange() {
    if (theme === "system") apply();
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== "theme" && event.key !== null) return;
    if (event.storageArea !== null) {
      try {
        if (event.storageArea !== target.localStorage) return;
      } catch {
        return;
      }
    }
    update(parseTheme(event.newValue));
  }

  return {
    getSnapshot: () => theme,
    setTheme(value: Theme) {
      try {
        target.localStorage.setItem("theme", value);
      } catch {
        // Keep this tab usable when storage is blocked or full.
      }
      update(value);
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        media.addEventListener("change", onSystemChange);
        target.addEventListener("storage", onStorage);
        update(readTheme(target, theme), true);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          media.removeEventListener("change", onSystemChange);
          target.removeEventListener("storage", onStorage);
        }
      };
    },
  };
}
