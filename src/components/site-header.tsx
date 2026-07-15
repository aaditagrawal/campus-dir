"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, Utensils, Building2, Bus, ShieldAlert, Wrench, GraduationCap, Search, X, Settings, Star, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Fuse from "fuse.js";
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

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedItemRef = useRef<HTMLLIElement | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const isMac = useMemo(() => navigator.platform.toUpperCase().includes("MAC"), []);

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

  const navigateToResult = (r: SearchItem) => {
    setSearchOpen(false);
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
      )}
    </header>
  );
}
