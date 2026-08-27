"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@/components/ui/button";
import {
  isFuzzyEngineReady,
  loadFuzzyEngine,
  sampleSuggestions,
  searchDirectory,
} from "@/lib/search-index";
import { type SearchItem } from "@/lib/search";
import { breakpoints, colors, motion, radii } from "@/styles/constants.stylex";

const SUGGESTION_COUNT = 8;

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 60,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingInline: "1rem",
    paddingBottom: "1rem",
    paddingTop: "4.5rem",
    backgroundColor: `color-mix(in oklab, ${colors.background} 80%, transparent)`,
    backdropFilter: "blur(4px)",
  },
  dialog: {
    width: "100%",
    maxWidth: "36rem",
    borderRadius: radii.lg,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: colors.background,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: colors.border,
  },
  searchIcon: { width: "1rem", height: "1rem", color: colors.mutedForeground },
  input: {
    width: "100%",
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingBlock: "0.5rem",
    color: colors.foreground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    outline: "none",
    "::placeholder": { color: colors.mutedForeground },
  },
  controls: { display: "flex", alignItems: "center", gap: "0.5rem" },
  escape: {
    display: { default: "none", [breakpoints.sm]: "inline" },
    borderRadius: radii.sm,
    backgroundColor: colors.muted,
    paddingInline: "0.375rem",
    paddingBlock: "0.125rem",
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  closeButton: { width: "1.5rem", height: "1.5rem" },
  closeIcon: { width: "1rem", height: "1rem" },
  results: { maxHeight: "60vh", overflow: "auto", listStyle: "none", margin: 0, padding: 0 },
  result: {
    width: "100%",
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: "2px",
    borderLeftStyle: "solid",
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
    color: colors.foreground,
    textAlign: "left",
    cursor: "pointer",
    transitionProperty: "background-color, border-color",
    transitionDuration: motion.fast,
  },
  resultIdle: {
    borderLeftColor: "transparent",
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 60%, transparent)`,
    },
  },
  resultSelected: {
    borderLeftColor: colors.primary,
    backgroundColor: `color-mix(in oklab, ${colors.primary} 10%, transparent)`,
  },
  resultTitle: { fontSize: "0.875rem", lineHeight: "1.25rem" },
  medium: { fontWeight: 500 },
  muted: { color: colors.mutedForeground },
  resultSection: {
    marginTop: "0.125rem",
    color: colors.mutedForeground,
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  empty: {
    paddingInline: "1rem",
    paddingBlock: "0.75rem",
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
});

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
        {...stylex.props(styles.result, selected ? styles.resultSelected : styles.resultIdle)}
        onClick={() => onSelect(item)}
        onMouseEnter={() => onHover(index)}
      >
        <div {...stylex.props(styles.resultTitle)}>
          <span {...stylex.props(styles.medium)}>{item.title}</span>
          {item.subtitle && <span {...stylex.props(styles.muted)}> • {item.subtitle}</span>}
        </div>
        <div {...stylex.props(styles.resultSection)}>{item.section}</div>
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
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 75);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, performSearch]);

  useEffect(() => {
    if (fuzzyReady) return;
    let active = true;
    loadFuzzyEngine().then(() => {
      if (active) setFuzzyReady(isFuzzyEngineReady());
    });
    return () => {
      active = false;
    };
  }, [fuzzyReady]);

  useEffect(() => {
    if (!fuzzyReady || !query || results.length > 0) return;
    performSearch(query);
  }, [fuzzyReady, query, results.length, performSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
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
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const navigateToResult = useCallback(
    (result: SearchItem) => {
      onClose();
      try {
        if (!result || !result.href) {
          console.error("Invalid search result:", result);
          return;
        }
        if (result.href.startsWith("http")) {
          window.location.href = result.href;
          return;
        }
        const url = new URL(result.href, window.location.origin);
        const elementId = url.hash ? url.hash.substring(1) : "";
        const element = elementId ? document.getElementById(elementId) : null;
        if (element) {
          const headerHeight = 56;
          const extraOffset = window.innerHeight * 0.1;
          const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: Math.max(0, absoluteTop - headerHeight - extraOffset),
            behavior: "smooth",
          });
          window.history.pushState(null, "", result.href);
          return;
        }
        router.push(result.href);
      } catch (error) {
        console.error("Navigation error:", error, result);
        if (result?.href) window.location.href = result.href;
      }
    },
    [router, onClose],
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      navigateToResult(results[selectedIndex]);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((previous) => (previous + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((previous) => (previous - 1 + results.length) % results.length);
    }
  };

  return (
    <div
      {...stylex.props(styles.overlay)}
      role="dialog"
      aria-label="Search directory"
      aria-modal="true"
    >
      <div {...stylex.props(styles.dialog)}>
        <div {...stylex.props(styles.searchBar)}>
          <Search {...stylex.props(styles.searchIcon)} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search anything…"
            {...stylex.props(styles.input)}
            aria-label="Search"
          />
          <div {...stylex.props(styles.controls)}>
            <kbd {...stylex.props(styles.escape)}>Esc</kbd>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              xstyle={styles.closeButton}
              aria-label="Close search"
            >
              <X {...stylex.props(styles.closeIcon)} />
            </Button>
          </div>
        </div>
        <ul {...stylex.props(styles.results)}>
          {results.length === 0 && <li {...stylex.props(styles.empty)}>No results</li>}
          {results.map((result, index) => (
            <SearchResultRow
              key={`${result.href}-${index}`}
              item={result}
              index={index}
              selected={index === selectedIndex}
              rowRef={index === selectedIndex ? selectedItemRef : null}
              onSelect={navigateToResult}
              onHover={setSelectedIndex}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
