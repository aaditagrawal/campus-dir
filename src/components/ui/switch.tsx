"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

import { colors, motion } from "@/styles/constants.stylex";

type SwitchProps = Omit<
  React.ComponentProps<typeof SwitchPrimitive.Root>,
  "className" | "style"
> & {
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  root: {
    position: "relative",
    display: "inline-flex",
    width: "2rem",
    height: "1.15rem",
    flexShrink: 0,
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "9999px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    backgroundColor: "transparent",
    padding: 0,
    outline: "none",
    cursor: { default: "pointer", ":disabled": "not-allowed" },
    opacity: { default: 1, ":disabled": 0.5 },
    boxShadow: {
      default: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      ":focus-visible": `0 0 0 3px color-mix(in oklab, ${colors.ring} 50%, transparent)`,
    },
  },
  track: {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    backgroundColor: {
      default: colors.input,
      [stylex.when.ancestor('[data-state="checked"]')]: colors.primary,
    },
    transitionProperty: "background-color",
    transitionDuration: motion.fast,
  },
  thumb: {
    position: "relative",
    zIndex: 1,
    display: "block",
    width: "1rem",
    height: "1rem",
    borderRadius: "9999px",
    backgroundColor: colors.background,
    pointerEvents: "none",
    transform: {
      default: "translateX(0)",
      [stylex.when.ancestor('[data-state="checked"]')]: "translateX(calc(100% - 2px))",
    },
    transitionProperty: "transform, background-color",
    transitionDuration: motion.fast,
    transitionTimingFunction: motion.standard,
  },
});

function Switch({ xstyle, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      {...stylex.props(stylex.defaultMarker(), styles.root, xstyle)}
      {...props}
    >
      <span aria-hidden {...stylex.props(styles.track)} />
      <SwitchPrimitive.Thumb data-slot="switch-thumb" {...stylex.props(styles.thumb)} />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
export type { SwitchProps };
