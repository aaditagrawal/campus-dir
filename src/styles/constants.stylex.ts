import * as stylex from "@stylexjs/stylex";

export const breakpoints = stylex.defineConsts({
  sm: "@media (min-width: 640px)",
  md: "@media (min-width: 768px)",
});

export const preferences = stylex.defineConsts({
  reducedMotion: "@media (prefers-reduced-motion: reduce)",
  reducedTransparency: "@media (prefers-reduced-transparency: reduce)",
});

export const colors = stylex.defineConsts({
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  popover: "var(--popover)",
  popoverForeground: "var(--popover-foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  destructive: "var(--destructive)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  rose: "oklch(0.645 0.246 16.439)",
  roseLight: "oklch(0.712 0.194 13.428)",
  blue: "oklch(0.546 0.245 262.881)",
  white: "oklch(0.985 0 0)",
});

export const fonts = stylex.defineConsts({
  sans: "var(--font-instrument-sans)",
  serif: "var(--font-instrument-serif)",
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
});

export const radii = stylex.defineConsts({
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) + 4px)",
});

export const motion = stylex.defineConsts({
  fast: "150ms",
  normal: "200ms",
  slow: "500ms",
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
});
