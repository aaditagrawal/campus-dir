import * as stylex from "@stylexjs/stylex";
import { Icon } from "@/components/icons";
import { breakpoints, colors, motion, preferences, radii } from "@/styles/constants.stylex";
import { directoryButton } from "@/components/static-actions";

const promptIn = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(1.5rem) scale(0.98)" },
  to: { opacity: 1, transform: "translateY(0) scale(1)" },
});
const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const styles = stylex.create({
  dialog: {
    position: "fixed",
    left: { default: "0.75rem", [breakpoints.sm]: "auto" },
    right: { default: "0.75rem", [breakpoints.sm]: "1.25rem" },
    bottom: { default: "0.75rem", [breakpoints.sm]: "1.25rem" },
    zIndex: 50,
    width: { default: "auto", [breakpoints.sm]: "24rem" },
    maxWidth: "28rem",
    marginInline: "auto",
    borderRadius: "1rem",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: `color-mix(in oklab, ${colors.card} 85%, transparent)`,
    color: colors.cardForeground,
    padding: "1rem",
    boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    backdropFilter: "blur(24px)",
    animationName: { default: promptIn, [preferences.reducedMotion]: fadeIn },
    animationDuration: "240ms",
    animationTimingFunction: motion.out,
  },
  dismiss: {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: { default: "transparent", ":hover": colors.accent },
    padding: "0.25rem",
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    cursor: "pointer",
  },
  icon16: { width: "1rem", height: "1rem", flexShrink: 0 },
  title: { fontWeight: 500, lineHeight: 1.25, paddingRight: "1.5rem" },
  description: {
    marginTop: "0.25rem",
    color: colors.mutedForeground,
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  actions: { display: "flex", gap: "0.5rem", marginTop: "0.75rem" },
  grow: { flex: 1 },
  instructions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginTop: "0.75rem",
    borderRadius: radii.xl,
    backgroundColor: `color-mix(in oklab, ${colors.muted} 60%, transparent)`,
    padding: "0.75rem",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  step: { display: "flex", alignItems: "center", gap: "0.5rem" },
  number: {
    display: "flex",
    width: "1.25rem",
    height: "1.25rem",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9999px",
    backgroundColor: colors.primary,
    color: colors.primaryForeground,
    fontSize: "0.6875rem",
    fontWeight: 600,
  },
  medium: { fontWeight: 500 },
  full: { width: "100%", marginTop: "0.25rem" },
});

export function PwaBanner() {
  return (
    <div
      data-pwa-banner
      hidden
      role="dialog"
      aria-label="Install Campus Directory"
      {...stylex.props(styles.dialog)}
    >
      <button
        type="button"
        data-pwa-dismiss
        aria-label="Dismiss install prompt"
        {...stylex.props(styles.dismiss)}
      >
        <Icon name="x" {...stylex.props(styles.icon16)} />
      </button>
      <p {...stylex.props(styles.title)}>Install Campus Directory</p>
      <p {...stylex.props(styles.description)}>
        Add it to your device. It opens full screen and works offline.
      </p>
      <div data-pwa-mode="native" hidden {...stylex.props(styles.actions)}>
        <button
          type="button"
          data-pwa-install
          {...stylex.props(
            directoryButton.base,
            directoryButton.primary,
            directoryButton.sm,
            styles.grow,
          )}
        >
          <Icon name="download" {...stylex.props(styles.icon16)} /> Install app
        </button>
        <button
          type="button"
          data-pwa-dismiss
          {...stylex.props(directoryButton.base, directoryButton.sm)}
        >
          Not now
        </button>
      </div>
      <div data-pwa-mode="ios" hidden {...stylex.props(styles.instructions)}>
        <p {...stylex.props(styles.step)}>
          <span {...stylex.props(styles.number)}>1</span>
          Tap the <Icon name="share" aria-hidden {...stylex.props(styles.icon16)} /> Share button in
          Safari
        </p>
        <p {...stylex.props(styles.step)}>
          <span {...stylex.props(styles.number)}>2</span>
          Choose <Icon name="squarePlus" aria-hidden {...stylex.props(styles.icon16)} />
          <span {...stylex.props(styles.medium)}>Add to Home Screen</span>
        </p>
        <button
          type="button"
          data-pwa-dismiss
          {...stylex.props(
            directoryButton.base,
            directoryButton.secondary,
            directoryButton.sm,
            styles.full,
          )}
        >
          Got it
        </button>
      </div>
      <div data-pwa-mode="safari" hidden {...stylex.props(styles.instructions)}>
        <p {...stylex.props(styles.step)}>
          <span {...stylex.props(styles.number)}>1</span>
          Open the <span {...stylex.props(styles.medium)}>File</span> menu in Safari
        </p>
        <p {...stylex.props(styles.step)}>
          <span {...stylex.props(styles.number)}>2</span>
          Choose <span {...stylex.props(styles.medium)}>Add to Dock…</span>
        </p>
        <button
          type="button"
          data-pwa-dismiss
          {...stylex.props(
            directoryButton.base,
            directoryButton.secondary,
            directoryButton.sm,
            styles.full,
          )}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
