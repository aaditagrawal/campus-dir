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
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { breakpoints, colors, motion, preferences, radii } from "@/styles/constants.stylex";

const SearchDialog = dynamic(() => import("@/components/search-dialog"), { ssr: false });
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

function useDismiss(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (ref.current && target instanceof Node && !ref.current.contains(target)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, ref]);
}

const dropdownIn = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(-4px) scale(0.97)" },
  to: { opacity: 1, transform: "translateY(0) scale(1)" },
});
const mobileMenuIn = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(-4px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});
const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const styles = stylex.create({
  header: {
    position: "sticky",
    top: { default: "0.75rem", [breakpoints.sm]: "1rem" },
    zIndex: 50,
    marginTop: { default: "0.75rem", [breakpoints.sm]: "1rem" },
    paddingInline: "0.75rem",
  },
  panel: {
    position: "relative",
    maxWidth: "48rem",
    marginInline: "auto",
    borderRadius: "1.4rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `color-mix(in oklab, ${colors.border} 70%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${colors.background} 70%, transparent)`,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.04)",
    backdropFilter: "blur(24px)",
  },
  bar: {
    display: "flex",
    height: "3rem",
    alignItems: "center",
    justifyContent: "space-between",
    paddingInlineStart: "1rem",
    paddingInlineEnd: "0.375rem",
  },
  brand: {
    whiteSpace: "nowrap",
    color: colors.foreground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    textDecorationLine: "none",
  },
  brandSuffix: {
    display: { default: "none", [breakpoints.sm]: "inline" },
    color: colors.mutedForeground,
    fontWeight: 400,
  },
  desktopNav: {
    display: { default: "none", [breakpoints.md]: "flex" },
    alignItems: "center",
  },
  navLink: {
    borderRadius: "9999px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
    },
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    textDecorationLine: "none",
    transitionProperty: "color, background-color",
    transitionDuration: motion.fast,
  },
  relative: { position: "relative" },
  moreButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    borderWidth: 0,
    borderRadius: "9999px",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
    },
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    cursor: "pointer",
    transitionProperty: "color, background-color",
    transitionDuration: motion.fast,
  },
  moreButtonOpen: {
    color: colors.foreground,
    backgroundColor: `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
  },
  chevron: {
    width: "0.875rem",
    height: "0.875rem",
    transform: "rotate(0deg)",
    transitionProperty: "transform",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.out,
  },
  chevronOpen: { transform: "rotate(180deg)" },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    zIndex: 50,
    width: "13rem",
    marginTop: "0.5rem",
    padding: "0.375rem",
    transformOrigin: "top right",
    borderRadius: radii.xl,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `color-mix(in oklab, ${colors.border} 70%, transparent)`,
    backgroundColor: `color-mix(in oklab, ${colors.popover} 95%, transparent)`,
    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    backdropFilter: "blur(24px)",
    animationName: { default: dropdownIn, [preferences.reducedMotion]: fadeIn },
    animationDuration: motion.fast,
    animationTimingFunction: motion.out,
  },
  dropdownLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    borderRadius: radii.lg,
    paddingInline: "0.75rem",
    paddingBlock: "0.5rem",
    color: colors.foreground,
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
    },
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    textDecorationLine: "none",
    transitionProperty: "background-color",
    transitionDuration: motion.fast,
  },
  icon16: { width: "1rem", height: "1rem" },
  icon18: { width: "1.125rem", height: "1.125rem" },
  mutedIcon: { color: colors.mutedForeground },
  actionGroup: { display: "flex", alignItems: "center", gap: "0.125rem" },
  iconButton: {
    display: "flex",
    width: "2.25rem",
    height: "2.25rem",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderRadius: "9999px",
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
    },
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    cursor: "pointer",
    transform: { default: "scale(1)", ":active": "scale(0.95)" },
    transitionProperty: "background-color, color, transform",
    transitionDuration: motion.fast,
  },
  desktopOnly: { display: { default: "none", [breakpoints.md]: "flex" } },
  mobileOnly: { display: { default: "flex", [breakpoints.md]: "none" } },
  mobileMenu: {
    display: { default: "grid", [breakpoints.md]: "none" },
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0.125rem",
    padding: "0.5rem",
    transformOrigin: "top",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
    animationName: { default: mobileMenuIn, [preferences.reducedMotion]: fadeIn },
    animationDuration: motion.fast,
    animationTimingFunction: motion.out,
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    borderRadius: radii.lg,
    paddingInline: "0.75rem",
    paddingBlock: "0.625rem",
    color: colors.foreground,
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${colors.muted} 70%, transparent)`,
      ":active": colors.muted,
    },
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    textDecorationLine: "none",
    transitionProperty: "background-color, color",
    transitionDuration: motion.fast,
  },
  mobileThemeButton: {
    width: "100%",
    borderWidth: 0,
    textAlign: "left",
    color: colors.mutedForeground,
    cursor: "pointer",
  },
  emergency: { color: colors.rose },
});

function IconButton({
  xstyle,
  ...props
}: Omit<React.ComponentProps<"button">, "className" | "style"> & { xstyle?: StyleXStyles }) {
  return <button type="button" {...stylex.props(styles.iconButton, xstyle)} {...props} />;
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
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const themeIcon =
    mounted && theme === "dark" ? (
      <Sun {...stylex.props(styles.icon18)} />
    ) : (
      <Moon {...stylex.props(styles.icon18)} />
    );

  return (
    <header {...stylex.props(styles.header)}>
      <div ref={panelRef} {...stylex.props(styles.panel)}>
        <div {...stylex.props(styles.bar)}>
          <Link href="/" {...stylex.props(styles.brand)} onClick={closeMenu}>
            MIT Manipal
            <span {...stylex.props(styles.brandSuffix)}> Directory</span>
          </Link>

          <nav {...stylex.props(styles.desktopNav)} aria-label="Main">
            {primaryLinks.map((link) => (
              <Link key={link.href} href={link.href} {...stylex.props(styles.navLink)}>
                {link.label}
              </Link>
            ))}
            <div ref={moreRef} {...stylex.props(styles.relative)}>
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                onClick={() => setMoreOpen((value) => !value)}
                {...stylex.props(styles.moreButton, moreOpen && styles.moreButtonOpen)}
              >
                More
                <ChevronDown {...stylex.props(styles.chevron, moreOpen && styles.chevronOpen)} />
              </button>
              {moreOpen && (
                <div role="menu" {...stylex.props(styles.dropdown)}>
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={closeMore}
                      {...stylex.props(styles.dropdownLink)}
                    >
                      <link.icon {...stylex.props(styles.icon16, styles.mutedIcon)} />
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div {...stylex.props(styles.actionGroup)}>
            <IconButton
              aria-label="Open search"
              onMouseEnter={preloadSearch}
              onFocus={preloadSearch}
              onTouchStart={preloadSearch}
              onClick={() => setSearchOpen(true)}
            >
              <Search {...stylex.props(styles.icon18)} />
            </IconButton>
            <IconButton aria-label="Toggle theme" xstyle={styles.desktopOnly} onClick={toggleTheme}>
              {themeIcon}
            </IconButton>
            <IconButton
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              xstyle={styles.mobileOnly}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? (
                <X {...stylex.props(styles.icon18)} />
              ) : (
                <Menu {...stylex.props(styles.icon18)} />
              )}
            </IconButton>
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Main" {...stylex.props(styles.mobileMenu)}>
            {mobileLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                {...stylex.props(styles.mobileLink, link.accent && styles.emergency)}
              >
                <link.icon
                  {...stylex.props(
                    styles.icon16,
                    link.accent ? styles.emergency : styles.mutedIcon,
                  )}
                />
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              {...stylex.props(styles.mobileLink, styles.mobileThemeButton)}
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
