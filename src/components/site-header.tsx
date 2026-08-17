"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Menu,
  X,
  Utensils,
  Building2,
  Bus,
  ShieldAlert,
  Wrench,
  GraduationCap,
  Search,
  Settings,
  Star,
  MessageSquareWarning,
  ChevronDown,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SearchDialog = dynamic(() => import("@/components/search-dialog"), { ssr: false });

// Warm the search chunk (fuse.js + index) before the user actually opens it.
const preloadSearch = () => {
  import("@/components/search-dialog");
};

const primaryLinks = [
  { href: "/academics", label: "Academics" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/hostels", label: "Hostels" },
  { href: "/travel", label: "Travel" },
  { href: "/emergency", label: "Emergency" },
];

const moreLinks = [
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/tools", label: "Tools", icon: Settings },
  { href: "/grievance", label: "Grievance Redressal", icon: MessageSquareWarning },
  { href: "/favorites", label: "Favorites", icon: Star },
];

const mobileLinks = [
  { href: "/academics", label: "Academics", icon: GraduationCap },
  { href: "/restaurants", label: "Restaurants", icon: Utensils },
  { href: "/hostels", label: "Hostels", icon: Building2 },
  { href: "/travel", label: "Travel", icon: Bus },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/tools", label: "Tools", icon: Settings },
  { href: "/grievance", label: "Grievance", icon: MessageSquareWarning },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/emergency", label: "Emergency", icon: ShieldAlert, accent: true },
];

/** Close on Escape or on pointerdown outside `ref` while `open`. */
function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (ref.current && target instanceof Node && !ref.current.contains(target)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, ref]);
}

function IconButton(props: React.ComponentProps<"button">) {
  const { className, ...rest } = props;
  return (
    <button
      type="button"
      className={cn(
        "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-muted/70 hover:text-foreground active:scale-95",
        className,
      )}
      {...rest}
    />
  );
}

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useDismiss(moreOpen, closeMore, moreRef);
  useDismiss(menuOpen, closeMenu, panelRef);

  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener("open-global-search", handler);
    return () => window.removeEventListener("open-global-search", handler);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const themeIcon =
    mounted && theme === "dark" ? (
      <Sun className="size-[18px]" />
    ) : (
      <Moon className="size-[18px]" />
    );

  return (
    <header className="sticky top-3 z-50 mt-3 px-3 sm:top-4 sm:mt-4">
      <div
        ref={panelRef}
        className="relative mx-auto max-w-3xl rounded-[1.4rem] border border-border/70 bg-background/70 shadow-lg shadow-black/[0.04] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex h-12 items-center justify-between pl-4 pr-1.5">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight whitespace-nowrap"
            onClick={closeMenu}
          >
            MIT Manipal
            <span className="hidden font-normal text-muted-foreground sm:inline"> Directory</span>
          </Link>

          <nav className="hidden items-center md:flex" aria-label="Main">
            {primaryLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-2.5 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div ref={moreRef} className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/70 hover:text-foreground",
                  moreOpen && "bg-muted/70 text-foreground",
                )}
              >
                More
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-150",
                    moreOpen && "rotate-180",
                  )}
                />
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-52 origin-top-right rounded-xl border border-border/70 bg-popover/95 p-1.5 shadow-lg backdrop-blur-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 ease-out"
                >
                  {moreLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      onClick={closeMore}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted/70"
                    >
                      <l.icon className="size-4 text-muted-foreground" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-0.5">
            <IconButton
              aria-label="Open search"
              onMouseEnter={preloadSearch}
              onFocus={preloadSearch}
              onTouchStart={preloadSearch}
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-[18px]" />
            </IconButton>
            <IconButton aria-label="Toggle theme" className="hidden md:flex" onClick={toggleTheme}>
              {themeIcon}
            </IconButton>
            <IconButton
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              className="md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            </IconButton>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Main"
            className="grid origin-top grid-cols-2 gap-0.5 border-t border-border/60 p-2 animate-in fade-in-0 slide-in-from-top-1 duration-150 ease-out md:hidden"
          >
            {mobileLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/70 active:bg-muted",
                  l.accent && "text-rose-600 dark:text-rose-400",
                )}
              >
                <l.icon
                  className={cn("size-4", l.accent ? "text-rose-500" : "text-muted-foreground")}
                />
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted/70 active:bg-muted"
            >
              {themeIcon}
              Theme
            </button>
          </nav>
        )}
      </div>

      {searchOpen && <SearchDialog onClose={closeSearch} />}
    </header>
  );
}
