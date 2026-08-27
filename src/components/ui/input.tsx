import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

import { breakpoints, colors, motion, radii } from "@/styles/constants.stylex";

type InputProps = Omit<React.ComponentProps<"input">, "className" | "style"> & {
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  input: {
    display: "flex",
    width: "100%",
    minWidth: 0,
    height: "2.25rem",
    borderRadius: radii.md,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: colors.input,
      ":focus-visible": colors.ring,
      ":invalid": colors.destructive,
    },
    backgroundColor: "transparent",
    paddingInline: "0.75rem",
    paddingBlock: "0.25rem",
    color: colors.foreground,
    fontSize: { default: "1rem", [breakpoints.md]: "0.875rem" },
    lineHeight: { default: "1.5rem", [breakpoints.md]: "1.25rem" },
    outline: "none",
    cursor: { default: "text", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.5 },
    pointerEvents: { default: "auto", ":disabled": "none" },
    boxShadow: {
      default: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
    transitionProperty: "color, border-color, box-shadow",
    transitionDuration: motion.fast,
    "::placeholder": { color: colors.mutedForeground },
    "::selection": { backgroundColor: colors.primary, color: colors.primaryForeground },
  },
});

function Input({ xstyle, type, ...props }: InputProps) {
  return <input type={type} data-slot="input" {...stylex.props(styles.input, xstyle)} {...props} />;
}

export { Input };
export type { InputProps };
