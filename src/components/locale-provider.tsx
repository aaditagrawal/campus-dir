"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLocale, supportedLocales } from "@/lib/locale";
import type { LocaleDefinition, TranslationKey } from "@/lib/i18n";

const STORAGE_KEY = "campus-directory-locale";
const LocaleContext = createContext({ locale: defaultLocale, setLocale: (_code: string) => {} });

function translateText(node: Text, messages: LocaleDefinition["messages"]) {
  const source = node.data.trim();
  if (!source || !(source in messages)) return;
  const translated = messages[source as TranslationKey];
  if (translated !== source) node.data = node.data.replace(source, translated);
}

function translateTree(root: Node, messages: LocaleDefinition["messages"]) {
  if (root instanceof Element) {
    for (const attribute of ["aria-label", "placeholder", "title"]) {
      const source = root.getAttribute(attribute);
      if (source && source in messages) root.setAttribute(attribute, messages[source as TranslationKey]);
    }
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !["SCRIPT", "STYLE", "KBD", "CODE"].includes(parent.tagName)) translateText(node as Text, messages);
    node = walker.nextNode();
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState(defaultLocale);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const match = supportedLocales.find((candidate) => candidate.code === saved);
    if (match) setLocaleState(match);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale.code;
    translateTree(document.body, locale.messages);
    const observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) translateTree(node, locale.messages);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: (code: string) => {
        const next = supportedLocales.find((candidate) => candidate.code === code) ?? defaultLocale;
        localStorage.setItem(STORAGE_KEY, next.code);
        window.location.reload();
      },
    }),
    [locale],
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
