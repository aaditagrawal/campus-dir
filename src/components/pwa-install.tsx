"use client";

import * as React from "react";
import Image from "next/image";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "native" | "ios" | "safari-desktop";

const DISMISSED_KEY = "pwa-install-dismissed-at";
const INSTALLED_KEY = "pwa-installed";
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const SHOW_DELAY_MS = 2500;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos() {
  const ua = window.navigator.userAgent;
  const isIpadOs =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || isIpadOs;
}

function isDesktopSafari() {
  const ua = window.navigator.userAgent;
  return (
    /safari/i.test(ua) && !/chrome|chromium|crios|android|edg/i.test(ua) && !isIos()
  );
}

function wasRecentlyDismissed() {
  const at = Number(localStorage.getItem(DISMISSED_KEY) ?? 0);
  return Date.now() - at < DISMISS_COOLDOWN_MS;
}

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
    if (
      isStandalone() ||
      localStorage.getItem(INSTALLED_KEY) ||
      wasRecentlyDismissed()
    ) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (nextMode: PromptMode) => {
      timer = setTimeout(() => {
        setMode(nextMode);
        setVisible(true);
      }, SHOW_DELAY_MS);
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      if (timer) clearTimeout(timer);
      show("native");
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isIos()) show("ios");
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
    <div
      role="dialog"
      aria-label="Install Campus Directory"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border bg-card/85 p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 animate-in fade-in slide-in-from-bottom-6 duration-500"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="mt-0.5 shrink-0 rounded-xl border"
        />
        <div className="min-w-0 pr-6">
          <p className="font-medium leading-tight">Install Campus Directory</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Get the app on your {mode === "ios" ? "home screen" : "device"} —
            fast, full-screen, and it works offline.
          </p>
        </div>
      </div>

      {mode === "native" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={install}>
            <Download /> Install app
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      )}

      {mode === "ios" && (
        <div className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3 text-sm">
          <p className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              1
            </span>
            Tap the <Share className="size-4 shrink-0" aria-hidden /> Share
            button in Safari
          </p>
          <p className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              2
            </span>
            Choose <SquarePlus className="size-4 shrink-0" aria-hidden />
            <span className="font-medium">Add to Home Screen</span>
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-1 w-full"
            onClick={dismiss}
          >
            Got it
          </Button>
        </div>
      )}

      {mode === "safari-desktop" && (
        <div className="mt-3 space-y-2 rounded-xl bg-muted/60 p-3 text-sm">
          <p className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              1
            </span>
            Open the <span className="font-medium">File</span> menu in Safari
          </p>
          <p className="flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              2
            </span>
            Choose <span className="font-medium">Add to Dock…</span>
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-1 w-full"
            onClick={dismiss}
          >
            Got it
          </Button>
        </div>
      )}
    </div>
  );
}
