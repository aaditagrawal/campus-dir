"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, Utensils, Building2, Bus, ShieldAlert, Wrench, GraduationCap, Search, X, Settings, Star, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  isFuzzyEngineReady,
  loadFuzzyEngine,
  prefetchFuzzyEngineWhenCached,
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
  rowRef: React.Ref<HTMLLIElement> | null;
  onSelect: (item: SearchItem) => void;
  onHover: (index: number) => void;
}) {
  return (
    <li
      ref={rowRef}
      className={`px-4 py-3 cursor-pointer transition-colors ${
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
    </li>
  );
});

export function SiteHeader() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fuzzyReady, setFuzzyReady] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const isMac = useMemo(() => navigator.platform.toUpperCase().includes("MAC"), []);

  const performSearch = useCallback((searchQuery: string) => {
    try {
      // The index is built on this first call, when the dialog opens, rather
      // than on every page load.
      setResults(searchQuery ? searchDirectory(searchQuery) : sampleSuggestions(SUGGESTION_COUNT));
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

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
  }, [query, searchOpen, performSearch]);

  // Fuse only covers what the index cannot — typos and transpositions — so it
  // is fetched alongside the first keystrokes rather than shipped with every page.
  useEffect(() => {
    if (!searchOpen || fuzzyReady) return;

    let active = true;
    loadFuzzyEngine().then(() => {
      // Stays false if the chunk failed to load, so reopening the dialog retries.
      if (active) setFuzzyReady(isFuzzyEngineReady());
    });
    return () => {
      active = false;
    };
  }, [searchOpen, fuzzyReady]);

  // Rerunning the search when Fuse lands would rebuild the results array and
  // reset the highlight under a user who is already reading the list. Only an
  // empty list can actually gain anything from the fallback, so only that reruns.
  useEffect(() => {
    if (!fuzzyReady || !searchOpen || !query || results.length > 0) return;
    performSearch(query);
  }, [fuzzyReady, searchOpen, query, results.length, performSearch]);

  useEffect(prefetchFuzzyEngineWhenCached, []);

  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener("open-global-search", handler as EventListener);
    return () => window.removeEventListener("open-global-search", handler as EventListener);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        e.stopPropagation();
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isMac, searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

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

  const navigateToResult = useCallback((r: SearchItem) => {
    setSearchOpen(false);
    try {
      if (!r || !r.href) {
        console.error('Invalid search result:', r);
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
          behavior: 'smooth',
        });
        window.history.pushState(null, '', r.href);
        return;
      }

      // Every other result used to go through window.location.assign, which
      // tears down the app and re-parses the whole bundle just to reach another
      // static page. The router keeps it a client transition; the target cards
      // carry `scroll-mt-24`, so the sticky header does not cover the anchor.
      router.push(r.href);
    } catch (error) {
      console.error('Navigation error:', error, r);
      if (r && r.href) {
        window.location.href = r.href;
      }
    }
  }, [router]);

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
    <header className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight whitespace-nowrap">
          MIT Manipal Directory
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/academics" className="px-3 py-2 rounded-md hover:bg-muted transition-colors duration-150">Academics</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/restaurants" className="px-3 py-2 rounded-md hover:bg-muted transition-colors duration-150">Restaurants</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/hostels" className="px-3 py-2 rounded-md hover:bg-muted transition-colors duration-150">Hostels</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/travel" className="px-3 py-2 rounded-md hover:bg-muted transition-colors duration-150">Travel</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/emergency" className="px-3 py-2 rounded-md hover:bg-muted transition-colors duration-150">Emergency</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">
                  More
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-44 gap-0.5 p-1.5">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/services" className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors duration-150">
                          <Wrench className="size-4 text-muted-foreground" />
                          Services
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/tools" className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors duration-150">
                          <Settings className="size-4 text-muted-foreground" />
                          Tools
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/grievance" className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors duration-150">
                          <MessageSquareWarning className="size-4 text-muted-foreground" />
                          Grievance Redressal
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link href="/favorites" className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted text-sm transition-colors duration-150">
                          <Star className="size-4 text-muted-foreground" />
                          Favorites
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Button variant="ghost" size="icon" aria-label="Open search" onClick={() => setSearchOpen(true)}>
            <Search className="size-5" />
          </Button>

          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {mounted && theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Open search" onClick={() => setSearchOpen(true)}>
            <Search className="size-5" />
          </Button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation menu" aria-expanded={menuOpen}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-1 p-0">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetHeader className="p-4 pb-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Navigate</span>
                  <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {mounted && theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                  </Button>
                </div>
              </SheetHeader>
              <nav className="px-2 py-2">
                <SheetClose asChild>
                  <Link href="/academics" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <GraduationCap className="size-4 text-muted-foreground" />
                    <span className="text-base">Academics</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/restaurants" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <Utensils className="size-4 text-muted-foreground" />
                    <span className="text-base">Restaurants</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/hostels" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-base">Hostels</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/travel" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <Bus className="size-4 text-muted-foreground" />
                    <span className="text-base">Travel</span>
                  </Link>
                </SheetClose>
                <div className="my-1 mx-3 border-t border-border/50" />
                <SheetClose asChild>
                  <Link href="/emergency" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <ShieldAlert className="size-4 text-rose-400" />
                    <span className="text-base">Emergency</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/services" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <Wrench className="size-4 text-muted-foreground" />
                    <span className="text-base">Services</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/tools" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <Settings className="size-4 text-muted-foreground" />
                    <span className="text-base">Tools</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/grievance" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <MessageSquareWarning className="size-4 text-muted-foreground" />
                    <span className="text-base">Grievance Redressal</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/favorites" className="flex items-center gap-3 px-3 py-3.5 rounded-md hover:bg-muted focus:bg-muted transition-colors">
                    <Star className="size-4 text-muted-foreground" />
                    <span className="text-base">Favorites</span>
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {searchOpen && (
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
                  onClick={() => setSearchOpen(false)}
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
      )}
    </header>
  );
}
