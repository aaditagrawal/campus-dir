"use client";

import * as React from "react";
import {
  applyTheme,
  parseTheme,
  readTheme,
  themeInitializationScript,
  type Theme,
} from "@/lib/theme";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeState | undefined>(undefined);
const themeBootstrap = <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />;

export function useTheme() {
  const value = React.useContext(ThemeContext);
  if (!value) throw new Error("useTheme requires ThemeProvider");
  return value;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setPreference] = React.useState(() => readTheme(globalThis.window));
  const preference = React.useRef(theme);
  const media = React.useRef<MediaQueryList | null>(null);

  const setTheme = React.useCallback((value: Theme) => {
    try {
      window.localStorage.setItem("theme", value);
    } catch {
      // A blocked/full store must still allow changes in this tab.
    }
    setPreference(value);
  }, []);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    media.current = query;
    const onSystemChange = () => {
      if (preference.current === "system") applyTheme(window, "system", query.matches);
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "theme" && event.key !== null) return;
      if (event.storageArea !== null) {
        try {
          if (event.storageArea !== window.localStorage) return;
        } catch {
          return;
        }
      }
      setPreference(parseTheme(event.newValue));
    };
    query.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      query.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
      media.current = null;
    };
  }, []);

  React.useEffect(() => {
    preference.current = theme;
    applyTheme(window, theme, theme === "system" && (media.current?.matches ?? false));
  }, [theme]);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return (
    <ThemeContext.Provider value={value}>
      {themeBootstrap}
      {children}
    </ThemeContext.Provider>
  );
}
