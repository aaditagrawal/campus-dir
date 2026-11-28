import { themeInitializationScript } from "@/lib/theme";

/**
 * Inline document boot.
 *
 * The directory is static HTML. This script is the only JavaScript on those
 * pages: theme, brand fonts when the connection can afford them, menus,
 * favourites, vCards, the install prompt, and the search shortcut. It must
 * stay free of framework code so the first view does not download React.
 */
export const DOCUMENT_BOOT_SCRIPT = `${themeInitializationScript};
(function () {
  var root = document.documentElement;
  var THEME_KEY = "theme";
  var FAVORITES_KEY = "mit-directory-favorites";
  var INSTALL_DISMISS_KEY = "pwa-install-dismissed-at";
  var INSTALL_DONE_KEY = "pwa-installed";
  var DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;
  var deferredInstall = window.__pwaInstallPrompt || null;

  function constrained() {
    var net = navigator.connection;
    if (!net) return false;
    if (net.saveData) return true;
    var kind = net.effectiveType;
    if (kind === "slow-2g" || kind === "2g" || kind === "3g") return true;
    if (net.downlink && net.downlink < 0.8) return true;
    return false;
  }

  var themePreference = readTheme();
  var themeUnsaved = false;
  var unsavedFavorites = new Map();

  function readTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (error) { return null; }
  }

  function themeIsDark() {
    if (themePreference === "dark") return true;
    if (themePreference === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyDocumentState() {
    var dark = themeIsDark();
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    root.classList.toggle("brand-fonts", !constrained());
  }

  applyDocumentState();
  var themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  if (themeMedia.addEventListener) themeMedia.addEventListener("change", applyDocumentState);

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstall = event;
    window.__pwaInstallPrompt = event;
  });
  window.addEventListener("appinstalled", function () {
    try { localStorage.setItem(INSTALL_DONE_KEY, "1"); } catch (error) {}
    var banner = document.querySelector("[data-pwa-banner]");
    if (banner) banner.hidden = true;
  });

  function closest(event, selector) {
    var node = event.target;
    if (!node) return null;
    if (!node.closest) node = node.parentElement;
    if (!node || !node.closest) return null;
    return node.closest(selector);
  }

  function readStoredFavorites() {
    try {
      var raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function readFavorites() {
    var entries = new Map();
    for (var item of readStoredFavorites()) {
      var id = favoriteId(item);
      if (id) entries.set(id, item);
    }
    for (var change of unsavedFavorites) {
      if (change[1] === null) entries.delete(change[0]);
      else entries.set(change[0], change[1]);
    }
    return entries;
  }

  function favoriteId(item) {
    return item && item.id ? String(item.id) : "";
  }

  function paintFavorites() {
    var items = readFavorites();
    var buttons = document.querySelectorAll("[data-favorite]");
    for (var j = 0; j < buttons.length; j++) {
      var payload = readFavoritePayload(buttons[j]);
      var on = payload ? items.has(favoriteId(payload)) : false;
      buttons[j].setAttribute("aria-pressed", on ? "true" : "false");
      var label = on ? "Remove from favorites" : "Add to favorites";
      buttons[j].setAttribute("aria-label", label);
      buttons[j].title = label;
    }
    var tile = document.querySelector("[data-favorites-label]");
    if (tile) tile.textContent = items.size > 0 ? "Your saved items" : "Save your contacts";
  }

  function readFavoritePayload(button) {
    var raw = button.getAttribute("data-favorite");
    if (!raw) return null;
    try {
      var item = JSON.parse(raw);
      if (!item || !item.id || !item.type || !item.name || !item.href) return null;
      return item;
    } catch (error) {
      return null;
    }
  }

  function toggleFavorite(button) {
    var item = readFavoritePayload(button);
    if (!item) return;
    var items = readFavorites();
    var id = favoriteId(item);
    if (items.delete(id)) unsavedFavorites.set(id, null);
    else {
      items.set(id, item);
      unsavedFavorites.set(id, item);
    }
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(items.values())));
      unsavedFavorites.clear();
    } catch (error) {}
    paintFavorites();
  }

  function dialRandom(raw) {
    var pools;
    try { pools = JSON.parse(raw); } catch (error) { return; }
    if (!Array.isArray(pools)) return;
    var usable = [];
    for (var i = 0; i < pools.length; i++) {
      if (Array.isArray(pools[i]) && pools[i].length > 0) usable.push(pools[i]);
    }
    if (usable.length === 0) return;
    var phones = usable[Math.floor(Math.random() * usable.length)];
    var phone = phones[Math.floor(Math.random() * phones.length)];
    if (!phone) return;
    window.location.href = "tel:" + String(phone).replace(/\\s+/g, "");
  }

  function downloadCard(button) {
    var name = button.getAttribute("data-vcard-name") || "contact";
    var body = button.getAttribute("data-vcard") || "";
    var blob = new Blob([body.replace(/\\r?\\n/g, "\\r\\n")], { type: "text/vcard" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name.replace(/\\s+/g, "_") + ".vcf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function dismissInstall(banner) {
    try { localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now())); } catch (error) {}
    banner.hidden = true;
  }

  function showInstall(banner, mode) {
    var sections = banner.querySelectorAll("[data-pwa-mode]");
    for (var i = 0; i < sections.length; i++) sections[i].hidden = true;
    var section = banner.querySelector('[data-pwa-mode="' + mode + '"]');
    if (section) section.hidden = false;
    banner.hidden = false;
  }

  function bootPage() {
    paintFavorites();
    window.addEventListener("storage", function (event) {
      if (event.key === FAVORITES_KEY || event.key === null) paintFavorites();
      if (event.key === THEME_KEY || event.key === null) {
        themePreference = readTheme();
        themeUnsaved = false;
        applyDocumentState();
      }
    });

    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      if (!themeUnsaved) themePreference = readTheme();
      paintFavorites();
      applyDocumentState();
    });

    var shortcut = document.querySelector("[data-search-shortcut]");
    if (shortcut && navigator.platform.indexOf("Mac") !== -1) shortcut.textContent = "⌘K";

    document.addEventListener("click", function (event) {
      var favorite = closest(event, "[data-favorite]");
      if (favorite) {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(favorite);
        return;
      }
      var card = closest(event, "[data-vcard]");
      if (card) {
        event.preventDefault();
        downloadCard(card);
        return;
      }
      var theme = closest(event, "[data-theme-toggle]");
      if (theme) {
        var next = root.classList.contains("dark") ? "light" : "dark";
        themePreference = next;
        try {
          localStorage.setItem(THEME_KEY, next);
          themeUnsaved = false;
        } catch (error) {
          themeUnsaved = true;
        }
        applyDocumentState();
        return;
      }
      var dial = closest(event, "[data-random-tel]");
      if (dial) {
        var numbers = dial.getAttribute("data-random-tel");
        if (numbers) dialRandom(numbers);
        return;
      }
      var banner = document.querySelector("[data-pwa-banner]");
      if (!banner) return;
      if (closest(event, "[data-pwa-dismiss]")) {
        dismissInstall(banner);
        return;
      }
      if (closest(event, "[data-pwa-install]") && deferredInstall) {
        var prompt = deferredInstall;
        deferredInstall = null;
        prompt.prompt();
        prompt.userChoice.then(function (choice) {
          if (choice.outcome === "accepted") {
            try { localStorage.setItem(INSTALL_DONE_KEY, "1"); } catch (error) {}
            banner.hidden = true;
          } else {
            dismissInstall(banner);
          }
        });
      }
    });

    document.addEventListener("pointerdown", function (event) {
      var open = document.querySelectorAll("details[data-mobile-nav][open], details[data-more][open]");
      for (var i = 0; i < open.length; i++) {
        var panel = open[i].closest("[data-mobile-panel]");
        var menu = open[i].hasAttribute("data-mobile-nav") && panel &&
          panel.querySelector("[data-mobile-menu]");
        if (!open[i].contains(event.target) && !(menu && menu.contains(event.target))) {
          open[i].removeAttribute("open");
        }
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        var open = document.querySelectorAll("details[data-mobile-nav][open], details[data-more][open]");
        for (var i = 0; i < open.length; i++) {
          var details = open[i];
          var panel = details.closest("[data-mobile-panel]");
          var ownsFocus = details.contains(document.activeElement) ||
            (details.hasAttribute("data-mobile-nav") && panel &&
              panel.querySelector("[data-mobile-menu]")?.contains(document.activeElement));
          details.removeAttribute("open");
          if (ownsFocus) details.querySelector("summary")?.focus();
        }
      }
      if ((event.metaKey || event.ctrlKey) && (event.key === "k" || event.key === "K")) {
        if (window.location.pathname.indexOf("/search") === 0) return;
        event.preventDefault();
        window.location.href = "/search/";
      }
    }, true);

    var banner = document.querySelector("[data-pwa-banner]");
    var installed = false;
    var dismissed = false;
    try { installed = localStorage.getItem(INSTALL_DONE_KEY) === "1"; } catch (error) { installed = false; }
    try {
      dismissed = Date.now() - Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0) < DISMISS_FOR_MS;
    } catch (error) {
      dismissed = false;
    }
    var standalone =
      window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (banner && !standalone && !installed && !dismissed) {
      var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      var desktopSafari =
        /safari/i.test(navigator.userAgent) &&
        !/chrome|chromium|crios|android|edg/i.test(navigator.userAgent) &&
        !ios;
      var timer = 0;
      var schedule = function (mode) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () { showInstall(banner, mode); }, 2500);
      };
      window.addEventListener("beforeinstallprompt", function () { schedule("native"); });
      if (deferredInstall) schedule("native");
      else if (ios) schedule("ios");
      else if (desktopSafari) schedule("safari");
    }

    if (!constrained() && !document.querySelector('link[rel="manifest"]')) {
      var manifest = document.createElement("link");
      manifest.rel = "manifest";
      manifest.href = "/manifest.webmanifest";
      document.head.appendChild(manifest);
    }

    var host = window.location.hostname;
    var local = host === "localhost" || host === "127.0.0.1";
    if (!local && "serviceWorker" in navigator) {
      var registerWorker = function () {
        navigator.serviceWorker.register("/sw.js").catch(function () {});
      };
      if (!constrained()) registerWorker();
      else if ("requestIdleCallback" in window) requestIdleCallback(registerWorker);
      else window.addEventListener("load", function () { setTimeout(registerWorker, 2500); }, { once: true });
    }
    if (!local && !constrained()) {
      var loadAnalytics = function () {
        var script = document.createElement("script");
        script.src = "https://stat.sys256.com/script.js";
        script.defer = true;
        document.body.appendChild(script);
      };
      if ("requestIdleCallback" in window) requestIdleCallback(loadAnalytics, { timeout: 5000 });
      else setTimeout(loadAnalytics, 3000);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootPage);
  else bootPage();
})();
`;
