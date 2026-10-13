import { englishLocale, type LocaleDefinition } from "@/lib/i18n";
import { hindiLocale } from "@/locales/hi";
import { kannadaLocale } from "@/locales/kn";

export const supportedLocales: readonly LocaleDefinition[] = [englishLocale, hindiLocale, kannadaLocale];
export const defaultLocale = englishLocale;
