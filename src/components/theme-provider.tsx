"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getTheme,
  getInitialTheme,
  setTheme,
  subscribeTheme,
  themeBootstrap,
  type ThemeState,
} from "@/lib/theme";

type ThemeContextValue = Partial<ThemeState> & { setTheme: typeof setTheme };
const ThemeContext = createContext<ThemeContextValue>({ setTheme });
const themeScript = (
  <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState | undefined>(getInitialTheme);
  useEffect(() => {
    const update = () => {
      const next = getTheme();
      setState((previous) =>
        previous?.theme === next?.theme && previous?.resolvedTheme === next?.resolvedTheme
          ? previous
          : next,
      );
    };
    const unsubscribe = subscribeTheme(update);
    update();
    return unsubscribe;
  }, []);
  const value = useMemo(() => ({ ...state, setTheme }), [state]);
  return (
    <ThemeContext.Provider value={value}>
      {themeScript}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
