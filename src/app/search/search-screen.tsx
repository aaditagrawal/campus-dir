"use client";

import SearchDialog from "@/components/search-dialog";

function closeSearch(): void {
  const referrer = document.referrer;
  if (referrer.length > 0) {
    try {
      if (new URL(referrer).origin === window.location.origin) {
        window.history.back();
        return;
      }
    } catch {
      // A malformed referrer just sends the reader home.
    }
  }
  window.location.assign("/");
}

export function SearchScreen() {
  return <SearchDialog onClose={closeSearch} />;
}
