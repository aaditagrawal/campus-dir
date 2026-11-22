import * as stylex from "@stylexjs/stylex";
import { Icon } from "@/components/icons";
import type { StyleXStyles } from "@stylexjs/stylex";
import type { FavoriteItem } from "@/lib/favorites-store";
import { colors, motion, radii } from "@/styles/constants.stylex";

const starStyles = stylex.create({
  button: {
    position: "relative",
    zIndex: 20,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: { default: "transparent", ":hover": colors.accent },
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    cursor: "pointer",
    transitionProperty: "color, background-color, transform",
    transitionDuration: motion.fast,
  },
  sm: { width: "1.75rem", height: "1.75rem" },
  md: { width: "2rem", height: "2rem" },
  lg: { width: "2.25rem", height: "2.25rem" },
  icon: { transitionProperty: "fill, color", transitionDuration: motion.fast },
  iconSm: { width: "0.875rem", height: "0.875rem" },
  iconMd: { width: "1rem", height: "1rem" },
  iconLg: { width: "1.25rem", height: "1.25rem" },
});

const starSizes = { sm: starStyles.sm, md: starStyles.md, lg: starStyles.lg };
const starIcons = { sm: starStyles.iconSm, md: starStyles.iconMd, lg: starStyles.iconLg };

export const directoryButton = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    borderRadius: radii.md,
    borderWidth: 0,
    borderStyle: "solid",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
    textDecorationLine: "none",
    cursor: "pointer",
    transitionProperty: "color, background-color, border-color, transform",
    transitionDuration: motion.fast,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  primary: {
    backgroundColor: {
      default: colors.primary,
      ":hover": `color-mix(in oklab, ${colors.primary} 90%, transparent)`,
    },
    color: colors.primaryForeground,
  },
  secondary: {
    backgroundColor: {
      default: colors.secondary,
      ":hover": `color-mix(in oklab, ${colors.secondary} 80%, transparent)`,
    },
    color: colors.secondaryForeground,
  },
  sm: { height: "2rem", gap: "0.375rem", paddingInline: "0.75rem" },
  md: { height: "2.25rem", paddingInline: "1rem", paddingBlock: "0.5rem" },
});

type StarSize = "sm" | "md" | "lg";

export function SaveStar({
  item,
  size = "md",
  xstyle,
}: {
  item: FavoriteItem;
  size?: StarSize;
  xstyle?: StyleXStyles;
}) {
  return (
    <button
      type="button"
      data-favorite={JSON.stringify(item)}
      aria-pressed="false"
      aria-label="Add to favorites"
      title="Add to favorites"
      {...stylex.props(starStyles.button, starSizes[size], xstyle)}
    >
      <Icon name="star" aria-hidden {...stylex.props(starStyles.icon, starIcons[size])} />
    </button>
  );
}

export function VCardDownload({
  filename,
  vcard,
  children,
  variant = "primary",
  size = "md",
  xstyle,
}: {
  filename: string;
  vcard: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  xstyle?: StyleXStyles;
}) {
  const tone = variant === "secondary" ? directoryButton.secondary : directoryButton.primary;
  const scale = size === "sm" ? directoryButton.sm : directoryButton.md;
  return (
    <button
      type="button"
      data-vcard-name={filename}
      data-vcard={vcard}
      {...stylex.props(directoryButton.base, tone, scale, xstyle)}
    >
      {children}
    </button>
  );
}
