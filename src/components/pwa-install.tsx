"use client";

import * as React from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@/components/ui/button";
import { breakpoints, colors, motion, preferences, radii } from "@/styles/constants.stylex";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    /** Stashed by PwaInstallLoader so the lazily loaded banner can still use it. */
    __pwaInstallPrompt?: BeforeInstallPromptEvent;
  }
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

type PromptMode = "native" | "ios" | "safari-desktop";

const DISMISSED_KEY = "pwa-install-dismissed-at";
const INSTALLED_KEY = "pwa-installed";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  const isIpadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || isIpadOs;
}

function isDesktopSafari() {
  const ua = window.navigator.userAgent;
  return /safari/i.test(ua) && !/chrome|chromium|crios|android|edg/i.test(ua) && !isIos();
}

function wasRecentlyDismissed() {
  const at = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
  return Date.now() - at < DISMISS_COOLDOWN_MS;
}

const installPromptIn = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(1.5rem) scale(0.98)" },
  to: { opacity: 1, transform: "translateY(0) scale(1)" },
});
const fadeIn = stylex.keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });

const styles = stylex.create({
  dialog: {
    position: "fixed",
    left: {
      default: "0.75rem",
      [breakpoints.sm]: "auto",
    },
    right: {
      default: "0.75rem",
      [breakpoints.sm]: "1.25rem",
    },
    bottom: {
      default: "0.75rem",
      [breakpoints.sm]: "1.25rem",
    },
    zIndex: 50,
    width: {
      default: "auto",
      [breakpoints.sm]: "24rem",
    },
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
    animationName: { default: installPromptIn, [preferences.reducedMotion]: fadeIn },
    animationDuration: "240ms",
    animationTimingFunction: motion.out,
  },
  dismiss: {
    position: "absolute",
    top: "0.75rem",
    right: "0.75rem",
    borderWidth: 0,
    borderRadius: radii.md,
    backgroundColor: {
      default: "transparent",
      ":hover": colors.accent,
    },
    padding: "0.25rem",
    color: {
      default: colors.mutedForeground,
      ":hover": colors.foreground,
    },
    cursor: "pointer",
    transitionProperty: "color, background-color",
    transitionDuration: motion.fast,
  },
  icon16: { width: "1rem", height: "1rem", flexShrink: 0 },
  top: { display: "flex", alignItems: "flex-start", gap: "0.75rem" },
  appIcon: {
    flexShrink: 0,
    marginTop: "0.125rem",
    borderRadius: radii.xl,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.border,
  },
  copy: { minWidth: 0, paddingRight: "1.5rem" },
  title: { fontWeight: 500, lineHeight: 1.25 },
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
  instructionButton: { width: "100%", marginTop: "0.25rem" },
});

export function PwaInstall() {
  const [mode, setMode] = React.useState<PromptMode | null>(null);
  const [visible, setVisible] = React.useState(false);
  const deferredPrompt = React.useRef<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    if (isStandalone() || localStorage.getItem(INSTALLED_KEY) || wasRecentlyDismissed()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (nextMode: PromptMode) => {
      timer = setTimeout(() => {
        setMode(nextMode);
        setVisible(true);
      }, SHOW_DELAY_MS);
    };
    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      deferredPrompt.current = event;
      if (timer) clearTimeout(timer);
      show("native");
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (window.__pwaInstallPrompt) {
      deferredPrompt.current = window.__pwaInstallPrompt;
      window.__pwaInstallPrompt = undefined;
      show("native");
    } else if (isIos()) show("ios");
    else if (isDesktopSafari()) show("safari-desktop");

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPrompt.current = null;
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
    } else {
      dismiss();
    }
  };

  if (!visible || !mode) return null;

  return (
    <dialog open aria-label="Install Campus Directory" {...stylex.props(styles.dialog)}>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        {...stylex.props(styles.dismiss)}
      >
        <X {...stylex.props(styles.icon16)} />
      </button>

      <div {...stylex.props(styles.top)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, image optimization is disabled */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          loading="lazy"
          {...stylex.props(styles.appIcon)}
        />
        <div {...stylex.props(styles.copy)}>
          <p {...stylex.props(styles.title)}>Install Campus Directory</p>
          <p {...stylex.props(styles.description)}>
            Get the app on your {mode === "ios" ? "home screen" : "device"} - fast, full-screen, and
            it works offline.
          </p>
        </div>
      </div>

      {mode === "native" && (
        <div {...stylex.props(styles.actions)}>
          <Button size="sm" xstyle={styles.grow} onClick={install}>
            <Download {...stylex.props(styles.icon16)} /> Install app
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      )}

      {mode === "ios" && (
        <div {...stylex.props(styles.instructions)}>
          <p {...stylex.props(styles.step)}>
            <span {...stylex.props(styles.number)}>1</span>
            Tap the <Share aria-hidden {...stylex.props(styles.icon16)} /> Share button in Safari
          </p>
          <p {...stylex.props(styles.step)}>
            <span {...stylex.props(styles.number)}>2</span>
            Choose <SquarePlus aria-hidden {...stylex.props(styles.icon16)} />
            <span {...stylex.props(styles.medium)}>Add to Home Screen</span>
          </p>
          <Button size="sm" variant="secondary" xstyle={styles.instructionButton} onClick={dismiss}>
            Got it
          </Button>
        </div>
      )}

      {mode === "safari-desktop" && (
        <div {...stylex.props(styles.instructions)}>
          <p {...stylex.props(styles.step)}>
            <span {...stylex.props(styles.number)}>1</span>
            Open the <span {...stylex.props(styles.medium)}>File</span> menu in Safari
          </p>
          <p {...stylex.props(styles.step)}>
            <span {...stylex.props(styles.number)}>2</span>
            Choose <span {...stylex.props(styles.medium)}>Add to Dock…</span>
          </p>
          <Button size="sm" variant="secondary" xstyle={styles.instructionButton} onClick={dismiss}>
            Got it
          </Button>
        </div>
      )}
    </dialog>
  );
}
