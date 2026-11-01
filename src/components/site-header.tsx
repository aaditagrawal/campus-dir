import * as stylex from "@stylexjs/stylex";
import { Icon, type IconName } from "@/components/icons";
import { breakpoints, colors, motion, preferences, radii } from "@/styles/constants.stylex";

const primaryLinks = [
  { href: "/academics/", label: "Academics" },
  { href: "/restaurants/", label: "Restaurants" },
  { href: "/hostels/", label: "Hostels" },
  { href: "/travel/", label: "Travel" },
  { href: "/emergency/", label: "Emergency" },
];

const moreLinks: ReadonlyArray<{ href: string; label: string; icon: IconName }> = [
  { href: "/campus-life/", label: "Campus Life", icon: "users" },
  { href: "/services/", label: "Services", icon: "wrench" },
  { href: "/tools/", label: "Tools", icon: "settings" },
  { href: "/grievance/", label: "Grievance Redressal", icon: "messageSquareWarning" },
  { href: "/favorites/", label: "Favorites", icon: "star" },
];

const mobileLinks: ReadonlyArray<{
  href: string;
  label: string;
  icon: IconName;
  accent?: boolean;
}> = [
  { href: "/academics/", label: "Academics", icon: "graduationCap" },
  { href: "/campus-life/", label: "Campus Life", icon: "users" },
  { href: "/restaurants/", label: "Restaurants", icon: "utensils" },
  { href: "/hostels/", label: "Hostels", icon: "building2" },
  { href: "/travel/", label: "Travel", icon: "bus" },
  { href: "/services/", label: "Services", icon: "wrench" },
  { href: "/tools/", label: "Tools", icon: "settings" },
  { href: "/grievance/", label: "Grievance", icon: "messageSquareWarning" },
  { href: "/favorites/", label: "Favorites", icon: "star" },
  { href: "/emergency/", label: "Emergency", icon: "shieldAlert", accent: true },
];

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
    fontFamily: "inherit",
    listStyle: "none",
    cursor: "pointer",
    transitionProperty: "color, background-color",
    transitionDuration: motion.fast,
  },
  chevron: {
    width: "0.875rem",
    height: "0.875rem",
    transform: "rotate(0deg)",
    transitionProperty: "transform",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.out,
  },
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
    listStyle: "none",
    cursor: "pointer",
    textDecorationLine: "none",
    fontFamily: "inherit",
    transform: { default: "scale(1)", ":active": "scale(0.95)" },
    transitionProperty: "background-color, color, transform",
    transitionDuration: motion.fast,
  },
  desktopOnly: { display: { default: "none", [breakpoints.md]: "flex" } },
  mobileOnly: { display: { default: "flex", [breakpoints.md]: "none" } },
  mobileMenu: {
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
    fontFamily: "inherit",
    fontSize: "inherit",
    cursor: "pointer",
  },
  emergency: { color: colors.rose },
});

function ThemeIcons() {
  return (
    <>
      <Icon name="sun" data-icon="sun" {...stylex.props(styles.icon18)} />
      <Icon name="moon" data-icon="moon" {...stylex.props(styles.icon18)} />
    </>
  );
}

export function SiteHeader() {
  return (
    <header {...stylex.props(styles.header)}>
      <div data-mobile-panel {...stylex.props(styles.panel)}>
        <div {...stylex.props(styles.bar)}>
          <a href="/" {...stylex.props(styles.brand)}>
            MIT Manipal
            <span {...stylex.props(styles.brandSuffix)}> Directory</span>
          </a>

          <nav {...stylex.props(styles.desktopNav)} aria-label="Main">
            {primaryLinks.map((link) => (
              <a key={link.href} href={link.href} {...stylex.props(styles.navLink)}>
                {link.label}
              </a>
            ))}
            <details data-more {...stylex.props(styles.relative)}>
              <summary aria-haspopup="menu" {...stylex.props(styles.moreButton)}>
                More
                <Icon name="chevronDown" data-chevron="" {...stylex.props(styles.chevron)} />
              </summary>
              <div role="menu" {...stylex.props(styles.dropdown)}>
                {moreLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    {...stylex.props(styles.dropdownLink)}
                  >
                    <Icon name={link.icon} {...stylex.props(styles.icon16, styles.mutedIcon)} />
                    {link.label}
                  </a>
                ))}
              </div>
            </details>
          </nav>

          <div {...stylex.props(styles.actionGroup)}>
            <a href="/search/" aria-label="Open search" {...stylex.props(styles.iconButton)}>
              <Icon name="search" {...stylex.props(styles.icon18)} />
            </a>
            <button
              type="button"
              data-theme-toggle
              aria-label="Toggle theme"
              {...stylex.props(styles.iconButton, styles.desktopOnly)}
            >
              <ThemeIcons />
            </button>
            <details data-mobile-nav {...stylex.props(styles.mobileOnly)}>
              <summary
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
                {...stylex.props(styles.iconButton)}
              >
                <Icon name="menu" data-icon="menu" {...stylex.props(styles.icon18)} />
                <Icon name="x" data-icon="close" {...stylex.props(styles.icon18)} />
              </summary>
            </details>
          </div>
        </div>

        <nav
          id="mobile-menu"
          data-mobile-menu
          aria-label="Main"
          {...stylex.props(styles.mobileMenu)}
        >
          {mobileLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...stylex.props(styles.mobileLink, link.accent && styles.emergency)}
            >
              <Icon
                name={link.icon}
                {...stylex.props(styles.icon16, link.accent ? styles.emergency : styles.mutedIcon)}
              />
              {link.label}
            </a>
          ))}
          <button
            type="button"
            data-theme-toggle
            {...stylex.props(styles.mobileLink, styles.mobileThemeButton)}
          >
            <ThemeIcons />
            Theme
          </button>
        </nav>
      </div>
    </header>
  );
}
