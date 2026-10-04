// `defaultSettings` is the global defined by ../../shared/defaultSettings.js (loaded as a
// classic script in options.html) so the options page and the new tab page share one source.

export function getDefaults() {
    return structuredClone(defaultSettings);
}

export function getSettings() {
    let stored = {};
    try {
        stored = JSON.parse(localStorage.getItem("settings")) || {};
    } catch {}
    return { ...getDefaults(), ...stored };
}

export function getTheme() {
    return localStorage.getItem("theme") || "system";
}

export function saveSettings(obj) {
    localStorage.setItem("settings", JSON.stringify(obj));
    if (obj.theme) {
        localStorage.setItem("theme", obj.theme);
    }
}

// Persists a single key immediately (used by actions that take effect without pressing Save).
export function saveSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem("settings", JSON.stringify(settings));
}

export function restoreDefaults() {
    localStorage.setItem("settings", JSON.stringify(defaultSettings));
}
