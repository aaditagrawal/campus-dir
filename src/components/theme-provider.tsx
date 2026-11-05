"use client";

import * as React from "react";
import { createThemeStore, themeInitializationScript, type Theme } from "@/lib/theme";

let store: ReturnType<typeof createThemeStore> | undefined;

function getStore() {
  return (store ??= createThemeStore(window));
}

const subscribe = (listener: () => void) => getStore().subscribe(listener);
const getSnapshot = () => getStore().getSnapshot();
const getServerSnapshot = (): Theme => "system";
const setTheme = (value: Theme) => getStore().setTheme(value);

export function useTheme() {
  const theme = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { theme, setTheme };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      {children}
    </>
  );
}
