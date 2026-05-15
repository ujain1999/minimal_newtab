import { renderClock } from "../../components/clock.js";
import { renderWeather } from "../../components/weather.js";
import { renderBookmarks } from "../../components/bookmarks.js";
import { renderTopRight } from "../../components/topRight.js";
import { renderSidebar } from "../../components/sidebar.js";
import { renderUnsplashBackground } from "../../components/unsplash.js";

if (localStorage.getItem("settings") === null) {
  localStorage.setItem("settings", JSON.stringify(defaultSettings));
}

// Initialize theme
let theme = localStorage.getItem("theme") || "system";

document.addEventListener("DOMContentLoaded", () => {
  document.body.style.backgroundColor = null;
  applyTheme(theme);
});

const settings =
  JSON.parse(localStorage.getItem("settings")) || defaultSettings;

// Apply custom CSS if provided
if (settings.customCSS) {
  const styleElement = document.createElement("style");
  styleElement.id = "user-custom-css";
  styleElement.textContent = settings.customCSS;
  document.head.appendChild(styleElement);
}

if (settings.useUnsplash) {
  renderUnsplashBackground(settings);
} else if (settings.backgroundImage) {
  document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
  analyzeAndSetTextColor(settings.backgroundImage);
}

if (settings.useUnsplash || settings.backgroundImage) {
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
}

if (settings.topRight) {
  renderTopRight(settings);
} else {
  document.getElementById("top-right").style.display = "none";
}

if (settings.clock) {
  renderClock();
} else {
  document.getElementById("clock").style.display = "none";
}

if (settings.weather) {
  renderWeather(settings);
} else {
  document.getElementById("weather").style.display = "none";
}

if (settings.bookmarks) {
  window.renderBookmarks = () => renderBookmarks(settings);
  renderBookmarks(settings);
} else {
  document.getElementById("shortcuts").style.display = "none";
}

// Quick nav: show number hints when modifier key is held
function setupQuickNav() {
  if (typeof chrome === "undefined" || !chrome.commands || !chrome.commands.getAll) return;
  if (!settings.enableKeyboardNav) return;

  chrome.commands.getAll((commands) => {
    const toggleCommand = commands.find((cmd) => cmd.name === "toggle-overlay");
    if (!toggleCommand || !toggleCommand.shortcut) return;

    const shortcut = toggleCommand.shortcut;
    let modifierKey = null;

    if (shortcut.includes("Alt") || shortcut.includes("⌥")) {
      modifierKey = "Alt";
    } else if (shortcut.includes("Ctrl") || shortcut.includes("⌃")) {
      modifierKey = "Control";
    } else if (shortcut.includes("Meta") || shortcut.includes("⌘") || shortcut.includes("Command")) {
      modifierKey = "Meta";
    }

    if (!modifierKey) return;

    let modifierHeld = false;
    let modifierTimeout = null;
    const shortcutsContainer = document.getElementById("shortcuts");

    function getVisibleLinks() {
      if (!shortcutsContainer) return [];
      return Array.from(shortcutsContainer.querySelectorAll("a.shortcut")).filter((item) => {
        let parent = item.parentElement;
        while (parent && parent !== shortcutsContainer) {
          if (parent.classList.contains("collapsed")) return false;
          parent = parent.parentElement;
        }
        return true;
      });
    }

    function showHints() {
      if (shortcutsContainer && shortcutsContainer.classList.contains("command-mode")) return;
      const links = getVisibleLinks();
      links.slice(0, 10).forEach((link, index) => {
        const hint = document.createElement("span");
        hint.className = "number-hint";
        hint.textContent = index === 9 ? "0" : (index + 1).toString();
        link.appendChild(hint);
      });
      document.body.classList.add("keyboard-hints");
    }

    function hideHints() {
      if (!shortcutsContainer || !shortcutsContainer.classList.contains("command-mode")) {
        document.querySelectorAll(".shortcut > .number-hint").forEach((el) => el.remove());
      }
      document.body.classList.remove("keyboard-hints");
    }

    function navigateByNumber(num) {
      if (shortcutsContainer && shortcutsContainer.classList.contains("command-mode")) return;
      const index = num === "0" ? 9 : parseInt(num, 10) - 1;
      const links = getVisibleLinks();
      if (index >= 0 && index < links.length && links[index]) {
        const url = links[index].href;
        if (url) {
          if (settings.openInNewTab) {
            window.open(url, "_blank");
          } else {
            window.location.href = url;
          }
        }
      }
    }

    document.addEventListener("keydown", (e) => {
      if (shortcutsContainer && shortcutsContainer.classList.contains("command-mode")) return;

      if (e.key === modifierKey && !e.repeat) {
        e.preventDefault();
        modifierHeld = true;
        modifierTimeout = setTimeout(() => {
          if (modifierHeld) showHints();
        }, 400);
        return;
      }

      if (modifierHeld && e.code.startsWith("Digit")) {
        e.preventDefault();
        navigateByNumber(e.code.replace("Digit", ""));
      }
    });

    document.addEventListener("keyup", (e) => {
      if (e.key === modifierKey) {
        modifierHeld = false;
        if (modifierTimeout) {
          clearTimeout(modifierTimeout);
          modifierTimeout = null;
        }
        hideHints();
      }
    });

    window.addEventListener("blur", () => {
      if (modifierHeld) {
        modifierHeld = false;
        if (modifierTimeout) {
          clearTimeout(modifierTimeout);
          modifierTimeout = null;
        }
        hideHints();
      }
    });
  });
}

setupQuickNav();

if (settings.sidebar) {
  renderSidebar(settings);
}

if (settings.unsplashApiKey && settings.showUnsplashRefresh) {
  document
    .getElementById("refresh-background")
    .addEventListener("click", () => {
      renderUnsplashBackground(settings, true);
    });
}

document.getElementById("customize").addEventListener("click", () => {
  location.href = "../options/options.html";
});

// Handle toggle click
document.querySelector(".theme-toggle").addEventListener("click", () => {
  if (theme === "system") {
    theme = "dark";
  } else if (theme === "dark") {
    theme = "light";
  } else {
    theme = "system";
  }

  localStorage.setItem("theme", theme);
  applyTheme(theme);
});

// React to system theme change if in system mode
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (theme === "system") {
      document.addEventListener("DOMContentLoaded", () => {
        applyTheme(theme);
      });
    }
  });
