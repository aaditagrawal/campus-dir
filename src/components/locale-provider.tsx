"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLocale, supportedLocales } from "@/lib/locale";
import type { LocaleDefinition, TranslationKey } from "@/lib/i18n";

const STORAGE_KEY = "campus-directory-locale";
const LocaleContext = createContext({ locale: defaultLocale, setLocale: (_code: string) => {} });

function translateText(node: Text, messages: LocaleDefinition["messages"]) {
  const source = node.data.trim();
  const key = findTranslationKey(source);
  if (!key) return;
  const translated = messages[key];
  if (translated !== source) node.data = node.data.replace(source, translated);
}

function findTranslationKey(source: string): TranslationKey | undefined {
  if (!source) return;
  for (const locale of supportedLocales) {
    const entry = Object.entries(locale.messages).find(([, value]) => value === source);
    if (entry) return entry[0] as TranslationKey;
  }
}

function translateTree(root: Node, messages: LocaleDefinition["messages"]) {
  const translateElement = (element: Element) => {
    for (const attribute of ["aria-label", "placeholder", "title"]) {
      const source = element.getAttribute(attribute);
      const key = source && findTranslationKey(source);
      if (key && messages[key] !== source) element.setAttribute(attribute, messages[key]);
    }
  };
  if (root instanceof Element) translateElement(root);
  if (root instanceof Text && root.parentElement && !["SCRIPT", "STYLE", "KBD", "CODE"].includes(root.parentElement.tagName)) translateText(root, messages);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node instanceof Element) translateElement(node);
    else if (node instanceof Text && node.parentElement && !["SCRIPT", "STYLE", "KBD", "CODE"].includes(node.parentElement.tagName)) translateText(node, messages);
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(defaultLocale);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage can be blocked. */ }
    const match = supportedLocales.find((candidate) => candidate.code === saved);
    if (match) setLocaleState(match);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale.code;
    translateTree(document.body, locale.messages);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") for (const node of record.addedNodes) translateTree(node, locale.messages);
        else if (record.type === "characterData" || record.type === "attributes") translateTree(record.target, locale.messages);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"] });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (code: string) => {
        const next = supportedLocales.find((candidate) => candidate.code === code) ?? defaultLocale;
        try {
          localStorage.setItem(STORAGE_KEY, next.code);
          window.location.reload();
        } catch {
          setLocaleState(next);
        }
      },
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
