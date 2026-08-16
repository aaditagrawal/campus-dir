"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isFuzzyEngineReady,
  loadFuzzyEngine,
  sampleSuggestions,
  searchDirectory,
} from "@/lib/search-index";
import { type SearchItem } from "@/lib/search";

const SUGGESTION_COUNT = 8;

/**
 * Memoized so moving the highlight — which every mouse move over the list
 * does — re-renders the two rows whose selection changed, not all ten.
 */
const SearchResultRow = memo(function SearchResultRow({
  item,
  index,
  selected,
  rowRef,
  onSelect,
  onHover,
}: {
  item: SearchItem;
  index: number;
  selected: boolean;
  rowRef: React.Ref<HTMLButtonElement> | null;
  onSelect: (item: SearchItem) => void;
  onHover: (index: number) => void;
}) {
  return (
    <li>
      <button
        type="button"
        ref={rowRef}
        className={`w-full px-4 py-3 cursor-pointer transition-colors text-left ${
          selected
            ? "bg-primary/10 border-l-2 border-primary"
            : "hover:bg-muted/60 border-l-2 border-transparent"
        }`}
        onClick={() => onSelect(item)}
        onMouseEnter={() => onHover(index)}
      >
        <div className="text-sm">
          <span className="font-medium">{item.title}</span>
          {item.subtitle && <span className="text-muted-foreground"> • {item.subtitle}</span>}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{item.section}</div>
      </button>
    </li>
  );
});

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fuzzyReady, setFuzzyReady] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback((searchQuery: string) => {
    try {
      setResults(searchQuery ? searchDirectory(searchQuery) : sampleSuggestions(SUGGESTION_COUNT));
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 75);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Fuzzy only covers what the index cannot — typos and transpositions — so it
  // is fetched alongside the first keystrokes rather than shipped with every page.
  useEffect(() => {
    if (fuzzyReady) return;

    let active = true;
    loadFuzzyEngine().then(() => {
      // Stays false if the chunk failed to load, so reopening the dialog retries.
      if (active) setFuzzyReady(isFuzzyEngineReady());
    });
    return () => {
      active = false;
    };
  }, [fuzzyReady]);

  // Rerunning the search when the fuzzy engine lands would rebuild the results
  // array and reset the highlight under a user who is already reading the list.
  // Only an empty list can actually gain anything from the fallback, so only
  // that reruns.
  useEffect(() => {
    if (!fuzzyReady || !query || results.length > 0) return;
    performSearch(query);
  }, [fuzzyReady, query, results.length, performSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  const navigateToResult = useCallback(
    (r: SearchItem) => {
      onClose();
      try {
        if (!r || !r.href) {
          console.error("Invalid search result:", r);
          return;
        }

        if (r.href.startsWith("http")) {
          window.location.href = r.href;
          return;
        }

        const url = new URL(r.href, window.location.origin);
        const elementId = url.hash ? url.hash.substring(1) : "";
        const element = elementId ? document.getElementById(elementId) : null;

        // Already on this page: scroll, do not route.
        if (element) {
          const headerHeight = 56;
          const extraOffset = window.innerHeight * 0.1;
          const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, absoluteTop - headerHeight - extraOffset),
            behavior: "smooth",
          });
          window.history.pushState(null, "", r.href);
          return;
        }

        // The router keeps this a client transition instead of tearing down the
        // app; the target cards carry `scroll-mt-24`, so the sticky header does
        // not cover the anchor.
        router.push(r.href);
      } catch (error) {
        console.error("Navigation error:", error, r);
        if (r && r.href) {
          window.location.href = r.href;
        }
      }
    },
    [router, onClose],
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      style={{ paddingTop: "calc(3.5rem + 1rem)" }}
    >
      <div
        className="w-full max-w-xl rounded-lg border bg-background shadow-lg"
        style={{ marginTop: 0 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search anything…"
            className="w-full bg-transparent outline-none py-2 text-sm"
            aria-label="Search"
          />
          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline rounded bg-muted px-1.5 py-0.5 text-xs">Esc</kbd>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
              aria-label="Close search"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <ul className="max-h-[60vh] overflow-auto">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">No results</li>
          )}
          {results.map((r, idx) => (
            <SearchResultRow
              key={`${r.href}-${idx}`}
              item={r}
              index={idx}
              selected={idx === selectedIndex}
              rowRef={idx === selectedIndex ? selectedItemRef : null}
              onSelect={navigateToResult}
              onHover={setSelectedIndex}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
