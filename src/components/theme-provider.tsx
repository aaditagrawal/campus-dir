"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { getTheme, getServerTheme, setTheme, subscribeTheme, themeBootstrap } from "@/lib/theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      {children}
    </>
  );
}

export function useTheme() {
  const state = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  return { ...state, setTheme };
}
