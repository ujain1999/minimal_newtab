import { getSettings, getTheme, saveSettings, restoreDefaults } from "./lib/storage.js";
import { Router } from "./lib/router.js";
import { showNotification } from "./lib/notification.js";
import { applyTheme } from "./lib/theme.js";
import { panels as panelDefs } from "./settings/registry.js";
import { setupSearch } from "./components/search.js";

import * as generalPanel from "./panels/general.js";
import * as shortcutsPanel from "./panels/shortcuts.js";
import * as appearancePanel from "./panels/appearance.js";
import * as sidebarPanel from "./panels/sidebarpanel.js";
import * as keyboardPanel from "./panels/keyboard.js";
import * as bangsPanel from "./panels/bangs.js";
import * as backupPanel from "./panels/backup.js";
import * as aboutPanel from "./panels/about.js";

const panelModules = {
    general: generalPanel,
    shortcuts: shortcutsPanel,
    appearance: appearancePanel,
    sidebar: sidebarPanel,
    keyboard: keyboardPanel,
    bangs: bangsPanel,
    backup: backupPanel,
    about: aboutPanel,
};

const router = new Router(panelDefs);

function init() {
    const settings = getSettings();

    try {
        buildSidebar();

        Object.entries(panelModules).forEach(([id, mod]) => {
            const container = document.getElementById(`panel-${id}`);
            if (container) {
                mod.render(container, settings);
            }
        });

        setupRouter();
        setupSearch();
        setupSaveButton(settings);
        setupRestoreButton();
        setupBackButton();
        setupEscapeKey();
        setupThemeSync();

        router.start();
    } finally {
        // Reveal the fully rendered page in one paint (see base.css / lib/theme-init.js).
        document.body.classList.add("ready");
    }
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
    router.onNavigate = (panelId) => {
        const searchInput = document.getElementById("settings-search");
        if (searchInput && searchInput.value) {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
        }

        const navLinks = document.querySelectorAll(".options-sidebar nav a");
        const panels = document.querySelectorAll(".options-panel");

        navLinks.forEach((link) => link.classList.toggle("active", link.dataset.panel === panelId));
        // On narrow screens the nav is a horizontally scrolling tab bar; keep the active tab visible.
        const activeLink = document.querySelector(".options-sidebar nav a.active");
        const nav = activeLink?.parentElement;
        if (nav && nav.scrollWidth > nav.clientWidth) {
            const linkRect = activeLink.getBoundingClientRect();
            const offset = linkRect.left - nav.getBoundingClientRect().left;
            nav.scrollTo({ left: nav.scrollLeft + offset - (nav.clientWidth - linkRect.width) / 2 });
        }
        panels.forEach((p) => p.classList.toggle("active", p.id === `panel-${panelId}`));
        document.querySelector(".options-content")?.scrollTo(0, 0);
    };
}

function setupSaveButton(initialSettings) {
    document.getElementById("save").addEventListener("click", () => {
        // Start from the stored settings so keys owned by other surfaces (e.g. a background
        // image uploaded on this page, which is persisted immediately) are kept.
        const settings = getSettings();
        Object.values(panelModules).forEach((mod) => {
            Object.assign(settings, mod.collect());
        });

        if (
            settings.customCity ||
            settings.useCustomCity !== initialSettings.useCustomCity ||
            settings.customCity !== initialSettings.customCity
        ) {
            localStorage.removeItem("weatherData");
        }
        if (settings.useUnsplash) {
            settings.backgroundImage = "";
        }
        localStorage.removeItem("unsplashData");

        saveSettings(settings);
        showNotification("Settings Saved!", 2000, "success");
    });
}

function setupRestoreButton() {
    document.getElementById("restore-defaults").addEventListener("click", () => {
        restoreDefaults();
        showNotification("Settings restored to defaults! Reloading...", 2000, "restore", true);
    });
}

function goToNewTab() {
    if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.update({ url: "chrome://newtab" });
    }
}

function setupBackButton() {
    document.getElementById("back-link").addEventListener("click", goToNewTab);
}

function setupEscapeKey() {
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        // Close an open dialog first instead of leaving the page.
        if (bangsPanel.closeOpenModal()) return;
        goToNewTab();
    });
}

function setupThemeSync() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (getTheme() === "system") {
            applyTheme("system");
        }
    });
}

init();
