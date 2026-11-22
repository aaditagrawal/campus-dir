export type Theme = "system" | "light" | "dark";

export function parseTheme(value: string | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

export function readTheme(target: Window | undefined): Theme {
  try {
    return parseTheme(target?.localStorage.getItem("theme") ?? null);
  } catch {
    return "system";
  }
}

export function applyTheme(target: Window, theme: Theme, systemDark: boolean) {
  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  const root = target.document.documentElement;
  // Replacing the existing token changes the class attribute once per selection.
  let changed = root.classList.replace(resolved === "dark" ? "light" : "dark", resolved);
  if (!changed && !root.classList.contains(resolved)) {
    root.classList.add(resolved);
    changed = true;
  }
  if (changed || root.style.colorScheme !== resolved) root.style.colorScheme = resolved;
}

// Run before page content, including when localStorage access is denied.
export const themeInitializationScript = `(()=>{let theme;try{theme=localStorage.getItem("theme")}catch{}const resolved=theme==="light"||theme==="dark"?theme:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";const root=document.documentElement;let changed=root.classList.replace(resolved==="dark"?"light":"dark",resolved);if(!changed&&!root.classList.contains(resolved)){root.classList.add(resolved);changed=true}if(changed||root.style.colorScheme!==resolved)root.style.colorScheme=resolved})()`;
