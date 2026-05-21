import { getSettings, saveSettings, restoreDefaults } from "./lib/storage.js";
import { Router } from "./lib/router.js";
import { showNotification } from "./lib/notification.js";
import { panels as panelDefs } from "./settings/registry.js";
import { createSearchBar, setupSearch } from "./components/search.js";

import * as generalPanel from "./panels/general.js";
import * as shortcutsPanel from "./panels/shortcuts.js";
import * as appearancePanel from "./panels/appearance.js";
import * as sidebarPanel from "./panels/sidebarpanel.js";
import * as keyboardPanel from "./panels/keyboard.js";
import * as backupPanel from "./panels/backup.js";
import * as aboutPanel from "./panels/about.js";

const panelModules = {
    general: generalPanel,
    shortcuts: shortcutsPanel,
    appearance: appearancePanel,
    sidebar: sidebarPanel,
    keyboard: keyboardPanel,
    backup: backupPanel,
    about: aboutPanel,
};

const router = new Router(panelDefs);

function init() {
    const settings = getSettings();

    applyInitialTheme(settings.theme);

    buildSidebar();

    const sidebarNav = document.querySelector(".options-sidebar nav");
    const searchBar = createSearchBar();
    sidebarNav.parentNode.insertBefore(searchBar, sidebarNav);

    Object.entries(panelModules).forEach(([id, mod]) => {
        const container = document.getElementById(`panel-${id}`);
        if (container) {
            mod.render(container, settings);
        }
    });

    setupRouter();
    setupSearch();
    setupSaveButton();
    setupRestoreButton();
    setupBackButton();
    setupEscapeKey();
    setupThemeSync();

    router.start();
}

function buildSidebar() {
    const nav = document.getElementById("options-nav");
    if (!nav) return;

    panelDefs.forEach((panel) => {
        const a = document.createElement("a");
        a.href = `#${panel.id}`;
        a.textContent = panel.label;
        a.dataset.panel = panel.id;
        nav.appendChild(a);
    });
}

function setupRouter() {
    router.onNavigate = (panelId, settingId) => {
        const searchInput = document.getElementById("settings-search");
        if (searchInput && searchInput.value) {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
        }

        const navLinks = document.querySelectorAll(".options-sidebar nav a");
        const panels = document.querySelectorAll(".options-panel");

        navLinks.forEach((link) => link.classList.toggle("active", link.dataset.panel === panelId));
        panels.forEach((p) => p.classList.toggle("active", p.id === `panel-${panelId}`));
    };
}

function setupSaveButton() {
    document.getElementById("save").addEventListener("click", () => {
        let settings = {};
        Object.values(panelModules).forEach((mod) => {
            const partial = mod.collect();
            Object.assign(settings, partial);
        });

        saveSettings(settings);
        if (settings.useUnsplash) {
            localStorage.removeItem("unsplashData");
        }
        showNotification("Settings Saved!", 2000, "success");
    });
}

function setupRestoreButton() {
    document.getElementById("restore-defaults").addEventListener("click", () => {
        restoreDefaults();
        showNotification("Settings restored to defaults! Reloading...", 2000, "restore", true);
    });
}

function setupBackButton() {
    document.getElementById("back-link").addEventListener("click", () => {
        if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.tabs.update({ url: "chrome://newtab" });
        }
    });
}

function setupEscapeKey() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            if (typeof chrome !== "undefined" && chrome.tabs) {
                chrome.tabs.update({ url: "chrome://newtab" });
            }
        }
    });
}

function applyInitialTheme(theme) {
    const t = theme || localStorage.getItem("theme") || "system";
    document.body.classList.remove("dark", "light");
    if (t === "dark") {
        document.body.classList.add("dark");
    } else if (t === "light") {
        document.body.classList.add("light");
    } else {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.body.classList.add(dark ? "dark" : "light");
    }
}

function setupThemeSync() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        const theme = localStorage.getItem("theme") || "system";
        if (theme === "system") {
            const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            document.body.classList.remove("dark", "light");
            document.body.classList.add(dark ? "dark" : "light");
        }
    });
}

document.addEventListener("DOMContentLoaded", init);
