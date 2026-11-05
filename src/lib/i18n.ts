export const englishMessages = {
  "Select language": "Select language",
  English: "English",
  Academics: "Academics",
  Restaurants: "Restaurants",
  Hostels: "Hostels",
  Travel: "Travel",
  Emergency: "Emergency",
  "Campus Life": "Campus Life",
  Services: "Services",
  Tools: "Tools",
  "Grievance Redressal": "Grievance Redressal",
  Favorites: "Favorites",
  More: "More",
  Theme: "Theme",
  "Open search": "Open search",
  "Toggle theme": "Toggle theme",
  "Toggle navigation menu": "Toggle navigation menu",
  "Search anything…": "Search anything…",
  Search: "Search",
  "Search directory": "Search directory",
  "Close search": "Close search",
  "No results": "No results",
  "Save your contacts": "Save your contacts",
  "Your saved items": "Your saved items",
  "MIT Manipal": "MIT Manipal",
  Directory: "Directory",
  "Campus Directory": "Campus Directory",
  "Install Campus Directory": "Install Campus Directory",
  "Dismiss install prompt": "Dismiss install prompt",
  "Install app": "Install app",
  "Not now": "Not now",
  "Got it": "Got it",
  "Add to Home Screen": "Add to Home Screen",
  "Found something wrong or missing? Help improve this directory by contributing at":
    "Found something wrong or missing? Help improve this directory by contributing at",
  "Main": "Main",
  "Campus essentials, organized.": "Campus essentials, organized.",
  "Everything you need around MIT Manipal, in one place.":
    "Everything you need around MIT Manipal, in one place.",
  "Quick access": "Quick access",
  "Browse campus": "Browse campus",
  "Open now": "Open now",
  Closed: "Closed",
  "View all": "View all",
  "Contact": "Contact",
  "Download contact": "Download contact",
  "Add to favorites": "Add to favorites",
  "Remove from favorites": "Remove from favorites",
  "No saved items yet": "No saved items yet",
  "Emergency contacts": "Emergency contacts",
  "Restaurant directory": "Restaurant directory",
  "Hostel directory": "Hostel directory",
  "Academic resources": "Academic resources",
  "Travel services": "Travel services",
  "General services": "General services",
  "Campus tools": "Campus tools",
  "Mail to warden": "Mail to warden",
  "Send leave request": "Send leave request",
  Submit: "Submit",
  Cancel: "Cancel",
  "Required field": "Required field",
  "Loading…": "Loading…",
  "Try again": "Try again",
} as const;

export type TranslationKey = keyof typeof englishMessages;
export type LocaleMessages = Record<TranslationKey, string>;

export interface LocaleDefinition {
  code: string;
  label: string;
  messages: LocaleMessages;
}

export const englishLocale: LocaleDefinition = {
  code: "en",
  label: "English",
  messages: englishMessages,
};
