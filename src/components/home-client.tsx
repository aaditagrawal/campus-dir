"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { useFavoritesCount, useFavoritesLoaded } from "@/hooks/useFavorites";
import { colors, motion, radii } from "@/styles/constants.stylex";

const styles = stylex.create({
  launcher: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.75rem",
    borderRadius: "9999px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
      ":hover": colors.border,
    },
    backgroundColor: {
      default: `color-mix(in oklab, ${colors.card} 50%, transparent)`,
      ":hover": `color-mix(in oklab, ${colors.muted} 40%, transparent)`,
    },
    paddingInline: "1.25rem",
    paddingBlock: "0.75rem",
    color: colors.foreground,
    textAlign: "left",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    cursor: "pointer",
    transform: { default: "scale(1)", ":active": "scale(0.99)" },
    transitionProperty: "background-color, border-color, transform",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.standard,
  },
  icon: { width: "1rem", height: "1rem", color: colors.mutedForeground },
  label: { flex: 1, color: colors.mutedForeground },
  shortcut: {
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
});

export function SearchLauncher() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  return (
    <button
      {...stylex.props(styles.launcher)}
      onClick={() => {
        window.dispatchEvent(new Event("open-global-search"));
      }}
      aria-label="Open search"
    >
      <Search {...stylex.props(styles.icon)} />
      <span {...stylex.props(styles.label)}>Search anything…</span>
      <kbd {...stylex.props(styles.shortcut)}>{isMac ? "⌘K" : "Ctrl+K"}</kbd>
    </button>
  );
}

export function FavoritesTileLabel() {
  const count = useFavoritesCount();
  const isLoaded = useFavoritesLoaded();
  return <>{!isLoaded || count === 0 ? "Save your contacts" : "Your saved items"}</>;
}
