import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

import { colors, motion, radii } from "@/styles/constants.stylex";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

type ButtonProps = Omit<React.ComponentProps<"button">, "className" | "style"> & {
  asChild?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  root: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    flexShrink: 0,
    whiteSpace: "nowrap",
    borderRadius: radii.md,
    borderStyle: "solid",
    borderWidth: 0,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
    fontWeight: 500,
    outline: "none",
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.5 },
    pointerEvents: { default: "auto", ":disabled": "none" },
    transform: { default: "scale(1)", ":active": "scale(0.97)", ":disabled": "scale(1)" },
    transitionProperty: "color, background-color, border-color, box-shadow, transform, opacity",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.standard,
    boxShadow: {
      default: "none",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
  },
  default: {
    backgroundColor: {
      default: colors.primary,
      ":hover": `color-mix(in oklab, ${colors.primary} 90%, transparent)`,
    },
    color: colors.primaryForeground,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  destructive: {
    backgroundColor: {
      default: colors.destructive,
      ":hover": `color-mix(in oklab, ${colors.destructive} 90%, transparent)`,
    },
    color: colors.white,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  outline: {
    borderWidth: "1px",
    borderColor: colors.input,
    backgroundColor: { default: colors.background, ":hover": colors.accent },
    color: { default: colors.foreground, ":hover": colors.accentForeground },
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  secondary: {
    backgroundColor: {
      default: colors.secondary,
      ":hover": `color-mix(in oklab, ${colors.secondary} 80%, transparent)`,
    },
    color: colors.secondaryForeground,
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  ghost: {
    backgroundColor: { default: "transparent", ":hover": colors.accent },
    color: { default: colors.foreground, ":hover": colors.accentForeground },
  },
  link: {
    padding: 0,
    backgroundColor: "transparent",
    color: colors.primary,
    textUnderlineOffset: "4px",
    textDecorationLine: { default: "none", ":hover": "underline" },
  },
  sizeDefault: { height: "2.25rem", paddingInline: "1rem", paddingBlock: "0.5rem" },
  sizeSm: {
    height: "2rem",
    gap: "0.375rem",
    paddingInline: "0.75rem",
    borderRadius: radii.md,
  },
  sizeLg: { height: "2.5rem", paddingInline: "1.5rem", borderRadius: radii.md },
  sizeIcon: { width: "2.25rem", height: "2.25rem", padding: 0 },
});

const variantStyles = {
  default: styles.default,
  destructive: styles.destructive,
  outline: styles.outline,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
};

const sizeStyles = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
};

function Button({
  variant = "default",
  size = "default",
  asChild = false,
  xstyle,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      {...stylex.props(
        stylex.defaultMarker(),
        styles.root,
        variantStyles[variant],
        sizeStyles[size],
        xstyle,
      )}
      {...props}
    />
  );
}

export { Button, styles as buttonStyles };
export type { ButtonProps, ButtonSize, ButtonVariant };
