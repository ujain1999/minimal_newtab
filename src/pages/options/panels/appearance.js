import { showNotification } from "../lib/notification.js";

let currentSettings = null;

export function render(container, settings) {
    currentSettings = { ...settings };

    container.innerHTML = `
        <h2>Appearance</h2>

        <div class="setting-row segmented-control-container" data-setting="theme">
            <label>Theme:</label>
            <div class="segmented-control">
                <label><input type="radio" name="theme" value="system" ${settings.theme === "system" ? "checked" : ""}><span>System</span></label>
                <label><input type="radio" name="theme" value="dark" ${settings.theme === "dark" ? "checked" : ""}><span>Dark</span></label>
                <label><input type="radio" name="theme" value="light" ${settings.theme === "light" ? "checked" : ""}><span>Light</span></label>
            </div>
        </div>

        <div class="setting-row">
            <label for="background-image-input">Custom Background Image:</label>
            <div class="background-image-controls">
                <label for="background-image-input" id="background-add-label" class="background-add-label">
                    <div id="background-preview-container" class="background-preview-container">
                        <span class="plus-icon">+</span>
                    </div>
                </label>
                <div id="image-present-container" class="background-preview-container ${settings.backgroundImage ? "" : "hidden"}">
                    <img id="background-preview" src="${settings.backgroundImage || "#"}" alt="Background preview" class="${settings.backgroundImage ? "" : "hidden"}">
                    <button id="clear-background-image" class="clear-background-button ${settings.backgroundImage ? "" : "hidden"}">&times;</button>
                </div>
                <input type="file" id="background-image-input" class="visually-hidden" accept="image/*">
            </div>
        </div>

        <label class="checkbox-label" data-setting="useUnsplash">
            <input type="checkbox" id="use-unsplash" ${settings.useUnsplash ? "checked" : ""}>
            <span class="custom-checkbox"></span> Use random background from Unsplash
        </label>
        <div id="unsplash-options" class="sub-settings" style="display:${settings.useUnsplash ? "block" : "none"}">
            <p style="font-size:0.9em;opacity:0.8;margin-top:-0.5em;margin-bottom:1em;">
                This will fetch a new high-quality background image. It will override the custom background image if one is set.
            </p>
            <div class="setting-row">
                <label for="unsplash-api-key">Unsplash API Key (Required)</label>
                <input class="text-input" type="text" id="unsplash-api-key" placeholder="Enter your Unsplash Access Key" value="${settings.unsplashApiKey || ""}">
                <p style="font-size:0.8em;opacity:0.7;margin-top:0.3em;">
                    An API key is required to fetch images from Unsplash. Get a free key from
                    <a href="https://unsplash.com/developers" target="_blank" rel="noopener">Unsplash Developers</a>.
                </p>
            </div>
            <div class="tooltip-wrapper" data-tooltip="Requires an Unsplash API Key">
                <div class="setting-row">
                    <label for="unsplash-update-frequency">Update Frequency</label>
                    <select id="unsplash-update-frequency" ${settings.unsplashApiKey ? "" : "disabled"}>
                        <option value="15min" ${settings.unsplashUpdateFrequency === "15min" ? "selected" : ""}>15 Minutes</option>
                        <option value="30min" ${settings.unsplashUpdateFrequency === "30min" ? "selected" : ""}>30 Minutes</option>
                        <option value="hourly" ${settings.unsplashUpdateFrequency === "hourly" ? "selected" : ""}>Hourly</option>
                        <option value="daily" ${settings.unsplashUpdateFrequency === "daily" ? "selected" : ""} ${!settings.unsplashUpdateFrequency ? "selected" : ""}>Daily</option>
                        <option value="weekly" ${settings.unsplashUpdateFrequency === "weekly" ? "selected" : ""}>Weekly</option>
                    </select>
                </div>
            </div>
            <div class="tooltip-wrapper" data-tooltip="Requires an Unsplash API Key">
                <div class="setting-row">
                    <label class="checkbox-label">
                        <input type="checkbox" id="show-unsplash-refresh" ${settings.unsplashApiKey ? "" : "disabled"} ${settings.showUnsplashRefresh ? "checked" : ""}>
                        <span class="custom-checkbox"></span> Show manual refresh button
                    </label>
                </div>
            </div>
        </div>

        <label class="checkbox-label" data-setting="pixelArt">
            <input type="checkbox" id="show-pixelArt" ${settings.pixelArt ? "checked" : ""}>
            <span class="custom-checkbox"></span> Show Background Pixel Art
        </label>
        <div id="pixel-art-select-div" class="sub-settings ${settings.pixelArt ? "" : "disabled"}">
            <label for="pixel-art-select">Select Pixel Art: </label>
            <select id="pixel-art-select" name="pixel-art-select">
                <option value="flowers" ${settings.selectedPixelArt === "flowers" ? "selected" : ""}>Flowers</option>
                <option value="hearts" ${settings.selectedPixelArt === "hearts" ? "selected" : ""}>Hearts</option>
                <option value="stars" ${settings.selectedPixelArt === "stars" ? "selected" : ""}>Stars</option>
                <option value="kitty" ${settings.selectedPixelArt === "kitty" ? "selected" : ""}>Kitty</option>
                <option value="leaves" ${settings.selectedPixelArt === "leaves" ? "selected" : ""}>Leaves</option>
                <option value="custom" ${settings.selectedPixelArt === "custom" ? "selected" : ""}>Custom</option>
            </select>
            <br>
            <div id="custom-svg-input-div" style="display:${settings.selectedPixelArt === "custom" ? "block" : "none"}">
                <label for="custom-svg-input">Custom SVG</label><br>
                <textarea id="custom-svg-input" name="custom-svg-input" rows="4" cols="50" placeholder="Paste your SVG code here...">${settings.customSVG || ""}</textarea>
                <br>
                <ul style="text-align:left;margin-top:0.5em">
                    <li>For best results:
                        <ul>
                            <li>The SVG should have a <code>viewBox="0 0 512 512"</code> attribute.</li>
                            <li>Remove any <code>fill</code> attributes from the SVG paths to allow the extension's theme colors to apply.</li>
                        </ul>
                    </li>
                    <li>You can use online tools to create or convert images to SVG code:
                        <ul>
                            <li><a href="https://svgco.de/" target="_blank" rel="noopener">SVGcode</a> - Convert raster images (PNG, JPG) to SVG.</li>
                            <li><a href="https://nikitahl.github.io/svg-2-code/" target="_blank" rel="noopener">SVG-2-Code</a> - Optimize and get code from an SVG file.</li>
                        </ul>
                    </li>
                </ul>
            </div>
            <div class="setting-row">
                <label for="pixelArtOpacity">Pixel Art Opacity</label>
                <input type="range" id="pixelArtOpacity" min="0" max="100" step="1" value="${settings.pixelArtOpacity || 40}">
            </div>
            <div class="setting-row">
                <label for="pixelArtDensity">Pixel Art Density</label>
                <input type="range" id="pixelArtDensity" min="0" max="100" step="1" value="${settings.pixelArtDensity || 20}">
            </div>
            <div class="setting-row">
                <label>Pixel Art Color (Dark Theme)<input type="color" id="pixelArtColorDark" value="${settings.pixelArtColorDark || "#cccccc"}"></label>
            </div>
            <div class="setting-row">
                <label>Pixel Art Color (Light Theme)<input type="color" id="pixelArtColorLight" value="${settings.pixelArtColorLight || "#b04288"}"></label>
            </div>
        </div>

        <div class="setting-row" style="margin-top:2em">
            <label for="custom-css" data-setting="customCSS">Custom CSS</label>
            <p style="font-size:0.9em;opacity:0.8;margin-top:0.3em;margin-bottom:0.8em;">
                Add your own CSS to customize the appearance of the new tab page. Changes apply after saving settings.
            </p>
            <textarea id="custom-css" rows="10" placeholder="/* Add your custom CSS here */" style="width:100%;font-family:monospace;font-size:0.9em;">${settings.customCSS || ""}</textarea>
            <p style="font-size:0.8em;opacity:0.7;margin-top:0.5em;">
                Note: Invalid CSS may affect page styling. Use the "Restore Defaults" button if something breaks.
            </p>
        </div>
    `;

    setupEventListeners(container, settings);
}

function setupEventListeners(container, settings) {
    container.querySelector("#show-pixelArt").addEventListener("change", (e) => {
        container.querySelector("#pixel-art-select-div").classList.toggle("disabled", !e.target.checked);
    });

    container.querySelector("#pixel-art-select").addEventListener("change", (e) => {
        container.querySelector("#custom-svg-input-div").style.display = e.target.value === "custom" ? "block" : "none";
    });

    container.querySelector("#use-unsplash").addEventListener("change", (e) => {
        container.querySelector("#unsplash-options").style.display = e.target.checked ? "block" : "none";
        toggleUnsplashAdvancedOptions(container);
    });

    const unsplashApiKeyInput = container.querySelector("#unsplash-api-key");
    unsplashApiKeyInput.addEventListener("input", () => toggleUnsplashAdvancedOptions(container));

    container.querySelectorAll('input[name="theme"]').forEach((radio) => {
        radio.addEventListener("change", (e) => {
            applyTheme(e.target.value);
        });
    });

    const bgInput = container.querySelector("#background-image-input");
    bgInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            currentSettings.backgroundImage = event.target.result;
            const preview = container.querySelector("#background-preview");
            preview.src = event.target.result;
            preview.classList.remove("hidden");
            container.querySelector("#image-present-container").classList.remove("hidden");
            container.querySelector("#background-add-label").classList.add("hidden");
            container.querySelector("#clear-background-image").classList.remove("hidden");
            showNotification("Background image saved. It will appear on the new tab page.", 3000, "success");
        };
        reader.readAsDataURL(file);
    });

    container.querySelector("#clear-background-image").addEventListener("click", () => {
        currentSettings.backgroundImage = "";
        container.querySelector("#background-image-input").value = "";
        container.querySelector("#background-preview").src = "#";
        container.querySelector("#background-preview").classList.add("hidden");
        container.querySelector("#image-present-container").classList.add("hidden");
        container.querySelector("#background-add-label").classList.remove("hidden");
        container.querySelector("#clear-background-image").classList.add("hidden");
        showNotification("Background image cleared.", 2000, "restore");
    });
}

function toggleUnsplashAdvancedOptions(container) {
    const apiKey = container.querySelector("#unsplash-api-key").value.trim();
    const tooltips = container.querySelectorAll("#unsplash-options .tooltip-wrapper");
    const freqSelect = container.querySelector("#unsplash-update-frequency");
    const refreshCheck = container.querySelector("#show-unsplash-refresh");

    freqSelect.disabled = !apiKey;
    refreshCheck.disabled = !apiKey;
    if (!apiKey) {
        refreshCheck.checked = false;
        tooltips.forEach((w) => w.classList.add("disabled"));
    } else {
        tooltips.forEach((w) => w.classList.remove("disabled"));
    }
}

function applyTheme(theme) {
    document.body.style.backgroundColor = null;
    document.body.classList.remove("dark", "light");
    if (theme === "dark") {
        document.body.classList.add("dark");
    } else if (theme === "light") {
        document.body.classList.add("light");
    } else {
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.body.classList.add(dark ? "dark" : "light");
    }
}

export function collect() {
    const selectedTheme = document.querySelector('input[name="theme"]:checked')?.value || "system";
    localStorage.setItem("theme", selectedTheme);

    const bg = currentSettings?.backgroundImage || "";

    return {
        theme: selectedTheme,
        backgroundImage: bg,
        useUnsplash: document.getElementById("use-unsplash").checked,
        unsplashApiKey: document.getElementById("unsplash-api-key").value.trim(),
        unsplashUpdateFrequency: document.getElementById("unsplash-update-frequency").value,
        showUnsplashRefresh: document.getElementById("show-unsplash-refresh").checked,
        pixelArt: document.getElementById("show-pixelArt").checked,
        selectedPixelArt: document.getElementById("pixel-art-select").value,
        customSVG: document.getElementById("custom-svg-input").value,
        pixelArtOpacity: document.getElementById("pixelArtOpacity").value,
        pixelArtDensity: document.getElementById("pixelArtDensity").value,
        pixelArtColorDark: document.getElementById("pixelArtColorDark").value,
        pixelArtColorLight: document.getElementById("pixelArtColorLight").value,
        customCSS: document.getElementById("custom-css").value.replace(/<\/style>/gi, ""),
    };
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-appearance [data-setting]");
}
