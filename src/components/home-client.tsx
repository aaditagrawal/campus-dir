"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useFavoritesCount, useFavoritesLoaded } from "@/hooks/useFavorites";

export function SearchLauncher() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  return (
    <button
      className="w-full flex items-center gap-3 rounded-full border border-border/60 bg-card/50 px-5 py-3 text-left text-sm transition-[background-color,border-color,transform] duration-150 hover:bg-muted/40 hover:border-border active:scale-[0.99]"
      onClick={() => {
        window.dispatchEvent(new Event("open-global-search"));
      }}
      aria-label="Open search"
    >
      <Search className="size-4 text-muted-foreground" />
      <span className="flex-1 text-muted-foreground">Search anything…</span>
      <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {isMac ? "⌘K" : "Ctrl+K"}
      </kbd>
    </button>
  );
}

export function FavoritesTileLabel() {
  const count = useFavoritesCount();
  const isLoaded = useFavoritesLoaded();
  return <>{!isLoaded || count === 0 ? "Save your contacts" : "Your saved items"}</>;
}
