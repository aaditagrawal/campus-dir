"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getTheme,
  getServerTheme,
  setTheme,
  subscribeTheme,
  themeBootstrap,
  type ThemeState,
} from "@/lib/theme";

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ThemeState | undefined>(getServerTheme);
  useEffect(() => {
    const update = () => setState(getTheme());
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
