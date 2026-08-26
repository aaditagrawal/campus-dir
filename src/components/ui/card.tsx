import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";

import { colors, radii } from "@/styles/constants.stylex";

type StyledDivProps = Omit<React.ComponentProps<"div">, "className" | "style"> & {
  xstyle?: StyleXStyles;
};

const styles = stylex.create({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    borderRadius: radii.xl,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: `color-mix(in oklab, ${colors.card} 60%, transparent)`,
    color: colors.cardForeground,
    paddingBlock: "1.5rem",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  },
  header: {
    display: "grid",
    gridAutoRows: "min-content",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      ':has([data-slot="card-action"])': "minmax(0, 1fr) auto",
    },
    gridTemplateRows: "auto auto",
    alignItems: "start",
    gap: "0.375rem",
    paddingInline: "1.5rem",
  },
  title: { fontSize: "1.125rem", lineHeight: 1, fontWeight: 600 },
  description: {
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  action: {
    gridColumnStart: 2,
    gridRow: "1 / span 2",
    alignSelf: "start",
    justifySelf: "end",
  },
  content: { paddingInline: "1.5rem" },
  footer: { display: "flex", alignItems: "center", paddingInline: "1.5rem" },
});

function Card({ xstyle, ...props }: StyledDivProps) {
  return <div data-slot="card" {...stylex.props(styles.card, xstyle)} {...props} />;
}
function CardHeader({ xstyle, ...props }: StyledDivProps) {
  return <div data-slot="card-header" {...stylex.props(styles.header, xstyle)} {...props} />;
}
function CardTitle({ xstyle, ...props }: StyledDivProps) {
  return <div data-slot="card-title" {...stylex.props(styles.title, xstyle)} {...props} />;
}
function CardDescription({ xstyle, ...props }: StyledDivProps) {
  return (
    <div data-slot="card-description" {...stylex.props(styles.description, xstyle)} {...props} />
  );
}
function CardAction({ xstyle, ...props }: StyledDivProps) {
  return <div data-slot="card-action" {...stylex.props(styles.action, xstyle)} {...props} />;
}
function CardContent({ xstyle, ...props }: StyledDivProps) {
  return <div data-slot="card-content" {...stylex.props(styles.content, xstyle)} {...props} />;
}
function CardFooter({ xstyle, ...props }: StyledDivProps) {
  return <div data-slot="card-footer" {...stylex.props(styles.footer, xstyle)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
