export function render(container, settings) {
    container.innerHTML = `
        <h2>Keyboard navigation <span class="beta-badge">BETA</span></h2>
        <label class="checkbox-label" data-setting="enableKeyboardNav">
            <input type="checkbox" id="enable-keyboard-nav" ${settings.enableKeyboardNav ? "checked" : ""}>
            <span class="custom-checkbox"></span> Enable Keyboard Navigation
        </label>
        <p id="shortcut-instruction-paragraph" style="font-size:0.9em;opacity:0.8;margin-top:0.5em;">
            When enabled, press <strong id="shortcut-instruction">Alt+K</strong> to open the quick command overlay.
        </p>
        <label class="checkbox-label" style="margin-top:1em;" data-setting="openInNewTab">
            <input type="checkbox" id="open-in-new-tab" ${settings.openInNewTab ? "checked" : ""}>
            <span class="custom-checkbox"></span> Open links in new tab
        </label>
        <p style="font-size:0.85em;opacity:0.6;margin-top:0.3em;">
            When enabled, selected bookmarks will open in a new tab. Default is same tab.
        </p>
        <p style="font-size:0.85em;opacity:0.6;margin-top:0.5em;">
            To customize the keyboard shortcut, visit
            <a href="#" id="open-shortcuts" style="color:inherit;">chrome://extensions/shortcuts</a>.
        </p>
        <div id="how-to-use" style="font-size:0.85em;opacity:0.8;margin-top:1em;background:rgba(255,255,255,0.1);padding:1em;border-radius:6px;">
            <strong style="display:block;margin-bottom:0.5em;">How to use:</strong>
            <ul style="margin:0;padding-left:1.2em;">
                <li style="margin:0.3em 0;"><strong id="shortcut-usage">Alt+K</strong> — Open command mode</li>
                <li style="margin:0.3em 0;"><strong id="shortcut-options">Alt+,</strong> — Open options page</li>
                <li style="margin:0.3em 0;"><strong>Type to search</strong> — Search bookmarks by title</li>
                <li style="margin:0.3em 0;"><strong>Arrow Up/Down</strong> — Navigate through items</li>
                <li style="margin:0.3em 0;"><strong>Enter</strong> — Open selected bookmark or expand/collapse folder</li>
                <li style="margin:0.3em 0;"><strong>0-9</strong> — Quick jump to first 10 items</li>
                <li style="margin:0.3em 0;"><strong>Esc</strong> — Close overlay</li>
            </ul>
        </div>
    `;

    setupEventListeners(container);
    updateShortcutDisplay();
}

function setupEventListeners(container) {
    const shortcutsLink = container.querySelector("#open-shortcuts");
    if (shortcutsLink) {
        shortcutsLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (typeof chrome !== "undefined" && chrome.tabs) {
                chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
            }
        });
    }
}

function formatShortcut(key) {
    let s = key.replace(/Comma/g, ",");
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if (isMac) {
        s = s.replace(/Option/g, "⌥").replace(/Alt/g, "⌥");
    }
    return s.replace(/([⌥])(?!\+)/g, "$1+");
}

function updateShortcutDisplay() {
    if (typeof chrome === "undefined" || !chrome.commands || !chrome.commands.getAll) return;

    chrome.commands.getAll((commands) => {
        const toggleCmd = commands.find((c) => c.name === "toggle-overlay");
        const optionsCmd = commands.find((c) => c.name === "open-options");
        const instructionP = document.getElementById("shortcut-instruction-paragraph");
        const howToUse = document.getElementById("how-to-use");

        if (toggleCmd && toggleCmd.shortcut) {
            const shortcut = formatShortcut(toggleCmd.shortcut);
            if (instructionP) {
                let html = `<strong id="shortcut-instruction">${shortcut}</strong> — Open command overlay`;
                if (optionsCmd && optionsCmd.shortcut) {
                    html += `<br><strong>${formatShortcut(optionsCmd.shortcut)}</strong> — Open options`;
                }
                instructionP.innerHTML = html;
            }
            if (howToUse) {
                howToUse.style.display = "block";
                const usageEl = document.getElementById("shortcut-usage");
                if (usageEl) usageEl.textContent = shortcut;
                const optsEl = document.getElementById("shortcut-options");
                if (optsEl && optionsCmd && optionsCmd.shortcut) {
                    optsEl.textContent = formatShortcut(optionsCmd.shortcut);
                }
            }
        } else {
            if (instructionP) {
                instructionP.innerHTML =
                    `Set a shortcut at <a href="#" id="open-shortcuts-inline" style="color:inherit;">chrome://extensions/shortcuts</a> to use keyboard navigation.`;
                document.getElementById("open-shortcuts-inline")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
                });
            }
            if (howToUse) howToUse.style.display = "none";
        }
    });
}

export function collect() {
    return {
        enableKeyboardNav: document.getElementById("enable-keyboard-nav").checked,
        openInNewTab: document.getElementById("open-in-new-tab").checked,
    };
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-keyboard [data-setting]");
}
