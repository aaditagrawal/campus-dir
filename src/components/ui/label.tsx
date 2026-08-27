"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

type LabelProps = Omit<React.ComponentProps<typeof LabelPrimitive.Root>, "className" | "style"> & {
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  label: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    userSelect: "none",
    fontSize: "0.875rem",
    lineHeight: 1,
    fontWeight: 500,
  },
});

function Label({ xstyle, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root data-slot="label" {...stylex.props(styles.label, xstyle)} {...props} />
  );
}

export { Label };
export type { LabelProps };
