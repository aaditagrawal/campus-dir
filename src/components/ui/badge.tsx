import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

import { colors, motion, radii } from "@/styles/constants.stylex";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
type BadgeProps = Omit<React.ComponentProps<"span">, "className" | "style"> & {
  asChild?: boolean;
  variant?: BadgeVariant;
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  root: {
    display: "inline-flex",
    width: "fit-content",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    flexShrink: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    borderRadius: radii.md,
    borderStyle: "solid",
    borderWidth: "1px",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "0.75rem",
    lineHeight: "1rem",
    fontWeight: 500,
    outline: "none",
    transitionProperty: "color, background-color, border-color, box-shadow",
    transitionDuration: motion.fast,
    boxShadow: {
      default: "none",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
  },
  default: {
    borderColor: "transparent",
    backgroundColor: colors.primary,
    color: colors.primaryForeground,
  },
  secondary: {
    borderColor: "transparent",
    backgroundColor: colors.secondary,
    color: colors.secondaryForeground,
  },
  destructive: {
    borderColor: "transparent",
    backgroundColor: colors.destructive,
    color: colors.white,
  },
  outline: {
    borderColor: colors.border,
    backgroundColor: "transparent",
    color: colors.foreground,
  },
});

const variantStyles = {
  default: styles.default,
  secondary: styles.secondary,
  destructive: styles.destructive,
  outline: styles.outline,
};

function Badge({ variant = "default", asChild = false, xstyle, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      {...stylex.props(styles.root, variantStyles[variant], xstyle)}
      {...props}
    />
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
