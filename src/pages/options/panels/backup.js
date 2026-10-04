import { getDefaults, getSettings } from "../lib/storage.js";
import { showNotification } from "../lib/notification.js";

export function render(container, settings) {
    container.innerHTML = `
        <h2>Backup</h2>
        <p>Export your current settings or import a previously saved configuration.</p>
        <div class="settings-data-container">
            <div class="button-row">
                <button id="export-settings" class="ghost-button">Export Settings</button>
                <button id="import-settings" class="ghost-button">Import Settings</button>
                <input type="file" id="import-file" accept=".json" style="display:none">
            </div>
            <div id="import-drop-zone" class="drop-zone">
                <span class="drop-zone-text">or drag & drop a settings file here</span>
            </div>
        </div>
    `;

    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById("export-settings").addEventListener("click", exportSettings);
    document.getElementById("import-settings").addEventListener("click", () => {
        document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", (e) => {
        handleImportFile(e.target.files[0]);
        e.target.value = "";
    });

    setupDragDrop();
}

function setupDragDrop() {
    const dropZone = document.getElementById("import-drop-zone");
    const importBtn = document.getElementById("import-settings");
    const targets = [importBtn, dropZone].filter(Boolean);

    targets.forEach((target) => {
        target.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add("drag-over");
            importBtn.classList.add("drag-over");
        });

        target.addEventListener("dragleave", (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-over");
            importBtn.classList.remove("drag-over");
        });

        target.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove("drag-over");
            importBtn.classList.remove("drag-over");
            const file = e.dataTransfer.files[0];
            handleImportFile(file);
        });
    });
}

function exportSettings() {
    const stored = JSON.parse(localStorage.getItem("settings") || "{}");
    const merged = { ...getDefaults(), ...stored };
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "minimal-newtab-settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Settings exported successfully!", 2000, "success");
}

function handleImportFile(file) {
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        showNotification("Invalid file type. Please use a .json file.", 3000, "error");
        return;
    }

    if (file.size > 1024 * 1024) {
        showNotification("File too large. Maximum size is 1MB.", 3000, "error");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            let imported;
            try {
                imported = JSON.parse(event.target.result);
            } catch {
                showNotification("Invalid JSON format. File may be corrupted.", 3000, "error");
                return;
            }

            if (typeof imported !== "object" || imported === null || Array.isArray(imported)) {
                showNotification("Invalid settings format. Expected a settings object.", 3000, "error");
                return;
            }

            const knownKeys = ["clock", "clockFormat", "weather", "bookmarks", "theme", "topRight", "pixelArt", "sidebar"];
            if (!knownKeys.some((k) => imported.hasOwnProperty(k))) {
                showNotification("This doesn't appear to be a valid settings file.", 3000, "error");
                return;
            }

            const merged = { ...getDefaults(), ...imported };
            localStorage.setItem("settings", JSON.stringify(merged));
            if (merged.theme) localStorage.setItem("theme", merged.theme);
            showNotification("Settings imported successfully! Reloading...", 2000, "success", true);
        } catch {
            showNotification("Error importing settings. Please try again.", 3000, "error");
        }
    };
    reader.onerror = () => showNotification("Error reading file. Please try again.", 3000, "error");
    reader.readAsText(file);
}

export function collect() {
    return {};
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-backup [data-setting]");
}
