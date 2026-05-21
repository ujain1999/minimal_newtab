const defaultSettings = {
    "clock": true,
    "clockFormat": "24h",
    "weather": true,
    "customCity": "",
    "useCustomCity": false,
    "tempUnit": "celsius",
    "bookmarks": true,
    "bookmarkFolder": "Bookmarks Bar",
    "expandBookmarks": false,
    "topRight": true,
    "topRightOrder": [
        { "id": "bookmarks", "displayBool": true, "url": "chrome://bookmarks" },
        { "id": "downloads", "displayBool": true, "url": "chrome://downloads" },
        { "id": "history", "displayBool": true, "url": "chrome://history" },
        { "id": "extensions", "displayBool": true, "url": "chrome://extensions" },
        { "id": "passwords", "displayBool": true, "url": "chrome://password-manager/passwords" },
        { "id": "settings", "displayBool": true, "url": "chrome://settings" }
    ],
    "pixelArt": true,
    "selectedPixelArt": "flowers",
    "customSVG": "",
    "pixelArtOpacity": 40,
    "pixelArtDensity": 20,
    "pixelArtColorDark": "#cccccc",
    "pixelArtColorLight": "#b04288",
    "availableWidgets": ["calendar", "todo"],
    "useUnsplash": false,
    "unsplashApiKey": "",
    "unsplashUpdateFrequency": "daily",
    "showUnsplashRefresh": false,
    "backgroundImage": "",
    "sidebar": false,
    "sidebarPosition": "right",
    "sidebarWidgets": [],
    "sidebarExpanded": false,
    "sidebarShowCustomize": true,
    "customCSS": "",
    "enableKeyboardNav": false,
    "openInNewTab": false
};

export function getDefaults() {
    return { ...defaultSettings };
}

export function getSettings() {
    const raw = localStorage.getItem("settings");
    if (!raw) return { ...defaultSettings };
    try {
        const stored = JSON.parse(raw);
        const merged = { ...defaultSettings, ...stored };
        return merged;
    } catch {
        return { ...defaultSettings };
    }
}

export function saveSettings(obj) {
    localStorage.setItem("settings", JSON.stringify(obj));
    if (obj.theme) {
        localStorage.setItem("theme", obj.theme);
    }
}

export function restoreDefaults() {
    localStorage.removeItem("settings");
    return { ...defaultSettings };
}
