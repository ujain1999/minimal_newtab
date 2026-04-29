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
