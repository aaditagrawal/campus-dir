"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSearchItems, type SearchItem } from "@/lib/search";

const fuseOptions = {
  keys: [
    { name: "title", weight: 0.5 },
    { name: "subtitle", weight: 0.15 },
    { name: "section", weight: 0.1 },
    { name: "phones", weight: 0.15 },
    { name: "notes", weight: 0.1 },
  ],
  includeScore: true,
  threshold: 0.35,
  ignoreLocation: true,
};

export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const items = useMemo(() => getAllSearchItems(), []);
  const fuse = useMemo(() => new Fuse(items, fuseOptions), [items]);

  const defaultSuggestions = useMemo(() => {
    const pool = items.filter((i) => i.section !== "Pages");
    const shuffled = pool.length > 8 ? pool.slice().sort(() => Math.random() - 0.5).slice(0, 8) : pool;
    return shuffled;
  }, [items]);

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery) {
      setResults(defaultSuggestions);
      return;
    }
    try {
      const searchResults = fuse.search(searchQuery);
      const r = searchResults.slice(0, 10).map((result) => result.item || result);
      setResults(r);
    } catch {
      setResults([]);
    }
  }, [fuse, defaultSuggestions]);

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
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  const navigateToResult = (r: SearchItem) => {
    onClose();
    try {
      if (!r || !r.href) {
        console.error('Invalid search result:', r);
        return;
      }

      if (r.href.startsWith("http")) {
        window.location.href = r.href;
      } else {
        const url = new URL(r.href, window.location.origin);
        if (url.hash) {
          const elementId = url.hash.substring(1);
          if (!elementId) {
            console.error('Invalid hash in URL:', r.href);
            return;
          }

          const element = document.getElementById(elementId);

          if (element) {
            const headerHeight = 56;
            const viewportHeight = window.innerHeight;
            const extraOffset = viewportHeight * 0.1;
            const rect = element.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            window.scrollTo({
              top: Math.max(0, absoluteTop - headerHeight - extraOffset),
              behavior: 'smooth'
            });
            window.history.pushState(null, '', r.href);
          } else {
            window.location.assign(r.href);
          }
        } else {
          window.location.assign(r.href);
        }
      }
    } catch (error) {
      console.error('Navigation error:', error, r);
      if (r && r.href) {
        window.location.href = r.href;
      }
    }
  };

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
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true" style={{ paddingTop: 'calc(3.5rem + 1rem)' }}>
      <div className="w-full max-w-xl rounded-lg border bg-background shadow-lg" style={{ marginTop: 0 }}>
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
            <li
              key={`${r.href}-${idx}`}
              ref={idx === selectedIndex ? selectedItemRef : null}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                idx === selectedIndex
                  ? "bg-primary/10 border-l-2 border-primary"
                  : "hover:bg-muted/60 border-l-2 border-transparent"
              }`}
              onClick={() => navigateToResult(r)}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <div className="text-sm">
                <span className="font-medium">{r.title}</span>
                {r.subtitle && <span className="text-muted-foreground"> • {r.subtitle}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.section}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
