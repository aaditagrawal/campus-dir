"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getCount,
  getFavorites,
  getFavoriteStatus,
  getServerCount,
  getServerFavorites,
  getServerFavoriteStatus,
  isHydrated,
  isNotHydrated,
  subscribeToCollection,
  subscribeToId,
  type FavoriteStatus,
  type FavoriteItem,
} from "@/lib/favorites-store";

export { clearAll, removeFavorite, toggleFavorite } from "@/lib/favorites-store";
export type { FavoriteItem, FavoriteStatus, FavoriteType } from "@/lib/favorites-store";

/**
 * Status of one favourite.
 *
 * Subscribes to that id alone, so toggling a different card does not wake this
 * component — the pages render dozens of these.
 */
export function useFavoriteStatus(id: string): FavoriteStatus {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToId(id, onChange),
    [id],
  );
  const snapshot = useCallback(() => getFavoriteStatus(id), [id]);
  return useSyncExternalStore(subscribe, snapshot, getServerFavoriteStatus);
}

/** The saved items, in the order they were saved. Stable identity between changes. */
export function useFavorites(): readonly FavoriteItem[] {
  return useSyncExternalStore(subscribeToCollection, getFavorites, getServerFavorites);
}

export function useFavoritesCount(): number {
  return useSyncExternalStore(subscribeToCollection, getCount, getServerCount);
}

/** False until `localStorage` has been read, so the first paint can't flash stale state. */
export function useFavoritesLoaded(): boolean {
  return useSyncExternalStore(subscribeToCollection, isHydrated, isNotHydrated);
}
