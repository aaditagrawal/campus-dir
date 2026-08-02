"use client";

import { useSyncExternalStore } from "react";
import {
  msUntilNextBoundary,
  resolveAll,
  UNKNOWN_STATUSES,
  type OpenStatus,
} from "@/lib/restaurant-hours";

/**
 * Live open/closed state for every restaurant.
 *
 * The previous implementation computed this once inside a `useMemo(..., [])`,
 * so a tab left open showed whatever was true when it mounted — a restaurant
 * that closed at 23:00 stayed "Open" indefinitely. It also ran during the
 * static export, baking the build machine's clock into the prerendered HTML.
 *
 * Statuses are now unknown on the server — no badge, so hydration cannot
 * disagree — and resolved after mount. Refreshes are scheduled for the exact
 * next instant at which some restaurant opens or closes, so the page sleeps
 * between transitions instead of polling.
 */

let snapshot: ReadonlyArray<OpenStatus> = UNKNOWN_STATUSES;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Keeps the previous object for any restaurant whose status did not change, so
 * a boundary that affects one restaurant does not invalidate the memoized
 * cards of the other fourteen.
 */
function reconcile(next: ReadonlyArray<OpenStatus>): ReadonlyArray<OpenStatus> {
  let changed = false;
  const merged = next.map((status, index) => {
    const previous = snapshot[index];
    if (
      previous !== null &&
      status !== null &&
      previous.open === status.open &&
      previous.range === status.range
    ) {
      return previous;
    }
    if (previous === null && status === null) return previous;
    changed = true;
    return status;
  });
  return changed ? merged : snapshot;
}

function refresh(): void {
  const now = new Date();
  const next = reconcile(resolveAll(now));

  if (next !== snapshot) {
    snapshot = next;
    for (const listener of listeners) listener();
  }

  schedule(now);
}

function schedule(now: Date): void {
  if (timer !== null) clearTimeout(timer);
  // A one second floor keeps a boundary landing on the current minute from
  // scheduling a zero-delay timer in a loop.
  timer = setTimeout(refresh, Math.max(1000, msUntilNextBoundary(now)));
}

function onVisibilityChange(): void {
  // Background tabs have their timers throttled, so a wake can arrive late.
  if (document.visibilityState === "visible") refresh();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    refresh();
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;

    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

function getSnapshot(): ReadonlyArray<OpenStatus> {
  return snapshot;
}

function getServerSnapshot(): ReadonlyArray<OpenStatus> {
  return UNKNOWN_STATUSES;
}

export function useRestaurantStatuses(): ReadonlyArray<OpenStatus> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
