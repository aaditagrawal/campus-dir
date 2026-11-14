"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { useLocale } from "@/components/locale-provider";
import { supportedLocales } from "@/lib/locale";
import { colors, motion, radii } from "@/styles/constants.stylex";

const styles = stylex.create({
  wrap: { position: "relative" },
  trigger: {
    display: "flex", width: "2.25rem", height: "2.25rem", alignItems: "center", justifyContent: "center",
    borderWidth: 0, borderRadius: "9999px", backgroundColor: { default: "transparent", ":hover": colors.muted },
    color: { default: colors.mutedForeground, ":hover": colors.foreground }, cursor: "pointer", transitionProperty: "background-color, color", transitionDuration: motion.fast,
  },
  icon: { width: "1.125rem", height: "1.125rem" },
  menu: {
    position: "absolute", top: "calc(100% + 0.5rem)", right: 0, zIndex: 70, display: "grid", gap: "0.25rem", minWidth: "9rem",
    padding: "0.375rem", borderRadius: radii.lg, borderWidth: "1px", borderStyle: "solid", borderColor: colors.border,
    backgroundColor: colors.popover, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  },
  option: {
    borderWidth: 0, borderRadius: radii.md, backgroundColor: { default: "transparent", ":hover": colors.muted },
    paddingInline: "0.625rem", paddingBlock: "0.5rem", color: colors.foreground, textAlign: "left", cursor: "pointer", fontSize: "0.875rem",
  },
  selected: { backgroundColor: colors.muted, fontWeight: 600 },
});

export function LanguageMenu() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  return (
    <div ref={wrapRef} {...stylex.props(styles.wrap)}>
      <button ref={triggerRef} type="button" aria-label="Select language" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((value) => !value)} {...stylex.props(styles.trigger)}>
        <Globe2 aria-hidden {...stylex.props(styles.icon)} />
      </button>
      {open && (
        <div role="group" aria-label="Select language" {...stylex.props(styles.menu)}>
          {supportedLocales.map((supportedLocale) => (
            <button key={supportedLocale.code} type="button" aria-pressed={locale.code === supportedLocale.code} onClick={() => setLocale(supportedLocale.code)} {...stylex.props(styles.option, locale.code === supportedLocale.code && styles.selected)}>
              {supportedLocale.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
