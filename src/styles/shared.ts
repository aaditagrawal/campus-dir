import * as stylex from "@stylexjs/stylex";
import { breakpoints, colors, fonts, motion, preferences, radii } from "./constants.stylex";

export const shared = stylex.create({
  page: {
    width: "100%",
    maxWidth: "64rem",
    marginInline: "auto",
    paddingInline: "1rem",
    paddingBlock: "2rem",
  },
  pageNarrow: {
    maxWidth: "56rem",
  },
  pageGrid: {
    display: "grid",
    gap: "2rem",
  },
  pageHeader: {
    marginBottom: "2rem",
  },
  heading1: {
    fontFamily: fonts.serif,
    fontSize: "1.875rem",
    lineHeight: "2.25rem",
  },
  heading1Strong: {
    fontWeight: 700,
  },
  heading2: {
    fontFamily: fonts.serif,
    fontSize: "1.25rem",
    lineHeight: "1.75rem",
  },
  heading2Strong: {
    fontWeight: 600,
  },
  heading3: {
    fontFamily: fonts.serif,
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    fontWeight: 600,
  },
  mutedText: {
    color: colors.mutedForeground,
  },
  textSm: {
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  textXs: {
    fontSize: "0.75rem",
    lineHeight: "1rem",
  },
  mono: {
    fontFamily: fonts.mono,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    scrollMarginTop: "6rem",
  },
  sectionCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    scrollMarginTop: "6rem",
  },
  sectionBottom: {
    marginBottom: "2rem",
  },
  grid2: {
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [breakpoints.sm]: "repeat(2, minmax(0, 1fr))",
    },
  },
  stretch: {
    alignItems: "stretch",
  },
  columns2: {
    columnCount: {
      default: 1,
      [breakpoints.sm]: 2,
    },
    columnGap: "1rem",
    columnFill: "balance",
  },
  flex: {
    display: "flex",
  },
  flexColumn: {
    display: "flex",
    flexDirection: "column",
  },
  flexWrap: {
    flexWrap: "wrap",
  },
  flex1: {
    flex: 1,
  },
  itemsStart: {
    alignItems: "flex-start",
  },
  itemsCenter: {
    alignItems: "center",
  },
  justifyBetween: {
    justifyContent: "space-between",
  },
  justifyCenter: {
    justifyContent: "center",
  },
  gap1: {
    gap: "0.25rem",
  },
  gap2: {
    gap: "0.5rem",
  },
  gap3: {
    gap: "0.75rem",
  },
  gap4: {
    gap: "1rem",
  },
  fullWidth: {
    width: "100%",
  },
  relative: {
    position: "relative",
  },
  absoluteFill: {
    position: "absolute",
    inset: 0,
  },
  link: {
    textDecorationLine: "underline",
    textUnderlineOffset: "2px",
  },
  linkHover: {
    color: {
      default: colors.mutedForeground,
      ":hover": colors.foreground,
    },
    textDecorationLine: {
      default: "none",
      ":hover": "underline",
    },
  },
  focusRing: {
    outline: "none",
    boxShadow: {
      default: "none",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
  },
  glass: {
    backgroundColor: {
      default: `color-mix(in oklab, ${colors.card} 70%, transparent)`,
      [preferences.reducedTransparency]: colors.card,
    },
    borderColor: `color-mix(in oklab, ${colors.border} 60%, transparent)`,
    backdropFilter: {
      default: "none",
      [breakpoints.md]: "saturate(120%) blur(8px)",
      [preferences.reducedTransparency]: "none",
    },
  },
  cardHover: {
    boxShadow: {
      default: "none",
      ":hover": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
    transitionProperty: "box-shadow",
    transitionDuration: motion.normal,
    transitionTimingFunction: motion.standard,
  },
  breakInsideAvoid: {
    breakInside: "avoid",
    marginBottom: "1rem",
  },
  scrollTarget: {
    scrollMarginTop: "6rem",
  },
  rounded: {
    borderRadius: radii.md,
  },
  truncate: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  breakAll: {
    overflowWrap: "anywhere",
  },
});
