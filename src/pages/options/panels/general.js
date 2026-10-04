import { getSettingsByPanel } from "../settings/registry.js";
import { escapeHtml } from "../lib/html.js";

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

async function fetchCitySuggestions(query) {
    if (query.length < 3) return [];
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=city&limit=5`
        );
        const data = await res.json();
        return data.map((p) => p.display_name);
    } catch {
        return [];
    }
}

export function render(container, settings) {
    container.innerHTML = `
        <h2>General Components</h2>

        <label class="checkbox-label" data-setting="clock">
            <input type="checkbox" id="show-clock" ${settings.clock ? "checked" : ""}>
            <span class="custom-checkbox"></span> Show Clock
        </label>
        <div id="clock-format" class="sub-settings" style="display:${settings.clock ? "block" : "none"}">
            <div class="setting-row segmented-control-container">
                <label>Clock format:</label>
                <div class="segmented-control">
                    <label><input type="radio" name="clock-format" value="24h" ${settings.clockFormat === "24h" ? "checked" : ""}><span>24h</span></label>
                    <label><input type="radio" name="clock-format" value="12h" ${settings.clockFormat === "12h" ? "checked" : ""}><span>12h</span></label>
                </div>
            </div>
        </div>

        <label class="checkbox-label" data-setting="weather">
            <input type="checkbox" id="show-weather" ${settings.weather ? "checked" : ""}>
            <span class="custom-checkbox"></span> Show Weather
        </label>
        <div id="weather-options" class="sub-settings ${settings.weather ? "" : "disabled"}">
            <label class="checkbox-label" data-setting="useCustomCity">
                <input type="checkbox" id="use-custom-city" ${settings.useCustomCity ? "checked" : ""}>
                <span class="custom-checkbox"></span> Use a custom location
            </label>
            <div id="custom-city-container" style="display:${settings.useCustomCity ? "block" : "none"}">
                <label for="custom-city">Custom City</label>
                <div id="city-search-container">
                    <input class="text-input" type="text" id="custom-city" name="custom-city" placeholder="Search for a city..." autocomplete="off" value="${escapeHtml(settings.customCity)}">
                    <div id="city-suggestions"></div>
                </div>
            </div>
            <div class="setting-row segmented-control-container">
                <label>Temperature Unit:</label>
                <div class="segmented-control">
                    <label><input type="radio" name="temp-unit" value="celsius" ${settings.tempUnit === "celsius" ? "checked" : ""}><span>°C</span></label>
                    <label><input type="radio" name="temp-unit" value="fahrenheit" ${settings.tempUnit === "fahrenheit" ? "checked" : ""}><span>°F</span></label>
                </div>
            </div>
        </div>

        <label class="checkbox-label" data-setting="bookmarks">
            <input type="checkbox" id="show-bookmarks" ${settings.bookmarks ? "checked" : ""}>
            <span class="custom-checkbox"></span> Show Bookmarks
        </label>
        <div id="bookmark-folder-selector-span" class="sub-settings ${settings.bookmarks ? "" : "disabled"}">
            <label for="bookmark-folders">Select Bookmark folder: </label>
            <select id="bookmark-folders" name="bookmark-folders">
                <option value="">All</option>
            </select>
            <br>
            <span id="expand-bookmarks-span">
                <label class="checkbox-label" data-setting="expandBookmarks">
                    <input type="checkbox" id="expand-bookmarks" ${settings.expandBookmarks ? "checked" : ""}>
                    <span class="custom-checkbox"></span> Expand bookmark folders by default
                </label>
            </span>
        </div>
    `;

    setupEventListeners(container, settings);
    populateBookmarkFolders(settings);
    setupCityAutocomplete(container);
}

function setupEventListeners(container, settings) {
    container.querySelector("#show-clock").addEventListener("change", (e) => {
        container.querySelector("#clock-format").style.display = e.target.checked ? "block" : "none";
    });

    container.querySelector("#show-weather").addEventListener("change", (e) => {
        container.querySelector("#weather-options").classList.toggle("disabled", !e.target.checked);
    });

    container.querySelector("#use-custom-city").addEventListener("change", (e) => {
        const cityContainer = container.querySelector("#custom-city-container");
        cityContainer.style.display = e.target.checked ? "block" : "none";
        if (!e.target.checked) {
            container.querySelector("#custom-city").value = "";
        }
    });

    container.querySelector("#show-bookmarks").addEventListener("change", (e) => {
        container.querySelector("#bookmark-folder-selector-span").classList.toggle("disabled", !e.target.checked);
    });

    container.querySelector("#custom-city").addEventListener("input", () => {
        localStorage.removeItem("weatherData");
    });
}

function populateBookmarkFolders(settings) {
    const select = document.getElementById("bookmark-folders");
    if (!select) return;

    if (typeof chrome !== "undefined" && chrome.bookmarks && chrome.bookmarks.getTree) {
        chrome.bookmarks.getTree((tree) => {
            if (tree && tree[0] && tree[0].children) {
                tree[0].children.forEach((folder) => {
                    const opt = document.createElement("option");
                    opt.value = opt.textContent = folder.title;
                    if (settings.bookmarkFolder === folder.title) opt.selected = true;
                    select.appendChild(opt);
                });
            }
        });
    }
}

function setupCityAutocomplete(container) {
    const cityInput = container.querySelector("#custom-city");
    const suggestions = container.querySelector("#city-suggestions");

    const onInput = debounce(async (e) => {
        const results = await fetchCitySuggestions(e.target.value);
        suggestions.innerHTML = "";
        if (results && results.length > 0) {
            results.forEach((s) => {
                const div = document.createElement("div");
                div.textContent = s;
                div.addEventListener("click", () => {
                    cityInput.value = s;
                    suggestions.style.display = "none";
                    suggestions.innerHTML = "";
                });
                suggestions.appendChild(div);
            });
            suggestions.style.display = "block";
        } else {
            suggestions.style.display = "none";
        }
    }, 300);

    cityInput.addEventListener("input", onInput);
    document.addEventListener("click", (e) => {
        const searchContainer = container.querySelector("#city-search-container");
        if (searchContainer && !searchContainer.contains(e.target)) {
            suggestions.style.display = "none";
        }
    });
}

export function collect(settings) {
    return {
        clock: document.getElementById("show-clock").checked,
        clockFormat: document.querySelector('input[name="clock-format"]:checked')?.value || "24h",
        weather: document.getElementById("show-weather").checked,
        useCustomCity: document.getElementById("use-custom-city").checked,
        customCity: document.getElementById("custom-city").value || "",
        tempUnit: document.querySelector('input[name="temp-unit"]:checked')?.value || "celsius",
        bookmarks: document.getElementById("show-bookmarks").checked,
        bookmarkFolder: document.getElementById("bookmark-folders")?.value || "",
        expandBookmarks: document.getElementById("expand-bookmarks").checked,
    };
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-general [data-setting]");
}
