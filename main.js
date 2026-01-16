import { renderClock } from './components/js/clock.js';
import { renderWeather } from './components/js/weather.js';
import { renderBookmarks } from './components/js/bookmarks.js';
import { renderTopRight } from './components/js/topRight.js';
import { renderSidebar } from './components/js/sidebar.js';
import { renderUnsplashBackground } from './components/js/unsplash.js';


if (localStorage.getItem("settings") === null) {
    localStorage.setItem("settings", JSON.stringify(defaultSettings));
}

const settings = JSON.parse(localStorage.getItem("settings")) || defaultSettings;

// Apply custom CSS if provided
if (settings.customCSS) {
    const styleElement = document.createElement('style');
    styleElement.id = 'user-custom-css';
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
}
else {
    document.getElementById('top-right').style.display = 'none';
}

if (settings.clock) {
    renderClock();
}
else {
    document.getElementById("clock").style.display = 'none';
}

if (settings.weather) {
    renderWeather(settings);
} else {
    document.getElementById('weather').style.display = 'none';
}

if (settings.bookmarks) {
    renderBookmarks(settings);
} else {
    document.getElementById("shortcuts").style.display = 'none';
}

if (settings.sidebar) {
    renderSidebar(settings);
}


if (settings.unsplashApiKey && settings.showUnsplashRefresh) {
    document.getElementById('refresh-background').addEventListener('click', () => {
        renderUnsplashBackground(settings, true);
    });
}

document.getElementById("customize").addEventListener("click", () => {
    location.href = "/options.html";
})

// Initialize theme
let theme = localStorage.getItem('theme') || 'system';
document.addEventListener('DOMContentLoaded', () => {applyTheme(theme);});

// Handle toggle click
document.querySelector('.theme-toggle').addEventListener('click', () => {
    if (theme === 'system') {
        theme = 'dark';
    } else if (theme === 'dark') {
        theme = 'light';
    } else {
        theme = 'system';
    }

    localStorage.setItem('theme', theme);
    document.addEventListener('DOMContentLoaded', () => {applyTheme(theme);});
});

// React to system theme change if in system mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (theme === 'system') {
        document.addEventListener('DOMContentLoaded', () => {applyTheme(theme);});
    }
});