"use client";

import { lazy, Suspense, useEffect, useState } from "react";

const PwaInstall = lazy(() => import("./pwa-install").then((m) => ({ default: m.PwaInstall })));

export function PwaInstallLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Chrome can fire beforeinstallprompt before the deferred chunk loads;
    // stash it so PwaInstall can pick it up on mount.
    const stash = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
    };
    window.addEventListener("beforeinstallprompt", stash);
    const timer = setTimeout(() => setReady(true), 1500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", stash);
    };
  }, []);

  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <PwaInstall />
    </Suspense>
  );
}
