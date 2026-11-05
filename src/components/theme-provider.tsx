"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getTheme,
  getInitialTheme,
  setTheme,
  subscribeTheme,
  themeBootstrap,
  type ThemeState,
} from "@/lib/theme";

const ThemeContext = createContext<ThemeState | undefined>(undefined);

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
  return (
    <ThemeContext.Provider value={state}>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const state = useContext(ThemeContext);
  return { ...state, setTheme };
}
