export const panels = [
    { id: "general", label: "General" },
    { id: "shortcuts", label: "Shortcuts" },
    { id: "appearance", label: "Appearance" },
    { id: "sidebar", label: "Sidebar" },
    { id: "keyboard", label: "Keyboard navigation" },
    { id: "backup", label: "Backup" },
    { id: "about", label: "About" },
];

export const settings = [
    { key: "clock", label: "Show Clock", type: "checkbox", panel: "general", searchTerms: ["clock", "time"] },
    { key: "clockFormat", label: "Clock format", type: "segmented", panel: "general", options: [{ value: "24h", label: "24h" }, { value: "12h", label: "12h" }], dependsOn: "clock", searchTerms: ["clock", "time", "format", "24h", "12h"] },
    { key: "weather", label: "Show Weather", type: "checkbox", panel: "general", searchTerms: ["weather", "temperature"] },
    { key: "useCustomCity", label: "Use a custom location", type: "checkbox", panel: "general", dependsOn: "weather", searchTerms: ["weather", "city", "location", "custom"] },
    { key: "tempUnit", label: "Temperature Unit", type: "segmented", panel: "general", options: [{ value: "celsius", label: "°C" }, { value: "fahrenheit", label: "°F" }], dependsOn: "weather", searchTerms: ["temperature", "celsius", "fahrenheit", "unit"] },
    { key: "bookmarks", label: "Show Bookmarks", type: "checkbox", panel: "general", searchTerms: ["bookmarks", "bookmark"] },
    { key: "expandBookmarks", label: "Expand bookmark folders by default", type: "checkbox", panel: "general", dependsOn: "bookmarks", searchTerms: ["bookmarks", "expand", "folder"] },
    { key: "topRight", label: "Show Top-Right Shortcuts", type: "checkbox", panel: "shortcuts", searchTerms: ["shortcuts", "top right", "links"] },
    { key: "theme", label: "Theme", type: "segmented", panel: "appearance", options: [{ value: "system", label: "System" }, { value: "dark", label: "Dark" }, { value: "light", label: "Light" }], searchTerms: ["theme", "dark", "light", "mode"] },
    { key: "pixelArt", label: "Show Background Pixel Art", type: "checkbox", panel: "appearance", searchTerms: ["pixel art", "background", "art"] },
    { key: "pixelArtOpacity", label: "Pixel Art Opacity", type: "range", panel: "appearance", dependsOn: "pixelArt", searchTerms: ["pixel art", "opacity"] },
    { key: "pixelArtDensity", label: "Pixel Art Density", type: "range", panel: "appearance", dependsOn: "pixelArt", searchTerms: ["pixel art", "density"] },
    { key: "pixelArtColorDark", label: "Pixel Art Color (Dark Theme)", type: "color", panel: "appearance", dependsOn: "pixelArt", searchTerms: ["pixel art", "color", "dark"] },
    { key: "pixelArtColorLight", label: "Pixel Art Color (Light Theme)", type: "color", panel: "appearance", dependsOn: "pixelArt", searchTerms: ["pixel art", "color", "light"] },
    { key: "useUnsplash", label: "Use random background from Unsplash", type: "checkbox", panel: "appearance", searchTerms: ["unsplash", "background", "image", "photo"] },
    { key: "customCSS", label: "Custom CSS", type: "textarea", panel: "appearance", searchTerms: ["css", "custom", "style"] },
    { key: "sidebar", label: "Show Sidebar", type: "checkbox", panel: "sidebar", searchTerms: ["sidebar", "panel"] },
    { key: "sidebarPosition", label: "Sidebar Position", type: "segmented", panel: "sidebar", options: [{ value: "left", label: "Left" }, { value: "right", label: "Right" }], dependsOn: "sidebar", searchTerms: ["sidebar", "position", "left", "right"] },
    { key: "sidebarExpanded", label: "Keep sidebar expanded", type: "checkbox", panel: "sidebar", dependsOn: "sidebar", searchTerms: ["sidebar", "expanded"] },
    { key: "sidebarShowCustomize", label: "Show Customize button in sidebar", type: "checkbox", panel: "sidebar", dependsOn: "sidebar", searchTerms: ["sidebar", "customize"] },
    { key: "enableKeyboardNav", label: "Enable Keyboard Navigation", type: "checkbox", panel: "keyboard", searchTerms: ["keyboard", "navigation", "shortcut", "command"] },
    { key: "openInNewTab", label: "Open links in new tab", type: "checkbox", panel: "keyboard", searchTerms: ["links", "tab", "open"] },
];

export function getSettingsByPanel(panelId) {
    return settings.filter((s) => s.panel === panelId);
}

export function getSetting(key) {
    return settings.find((s) => s.key === key);
}
