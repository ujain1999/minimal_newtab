function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

async function fetchCitySuggestions(query) {
    if (query.length < 3) {
        document.getElementById('city-suggestions').style.display = 'none';
        return;
    }
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=city&limit=5`);
        const data = await response.json();
        return data.map(place => place.display_name);
    } catch (error) {
        console.error("Error fetching city suggestions:", error);
        return [];
    }
}

function showNotification(message, duration = 2000, type = 'success', reload = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'hidden'; // Reset classes
    notification.classList.add(type);
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
            if (reload) {
                location.reload();
            }
        }, 500); // Wait for fade out before reloading
    }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
    const settings_keys = [
        "clock", "weather", "useCustomCity", "customCity", "tempUnit", "bookmarks", "bookmarkFolder", "expandBookmarks", "topRight", "topRightOrder", "pixelArt", 
        "selectedPixelArt", "customSVG", "pixelArtOpacity", "pixelArtDensity", "pixelArtColorDark", "pixelArtColorLight", "availableWidgets", "theme", "backgroundImage",
        "sidebar", "sidebarPosition", "sidebarWidgets", "sidebarExpanded", "sidebarShowCustomize", "useUnsplash", "unsplashApiKey", "unsplashUpdateFrequency", 
        "showUnsplashRefresh", "customCSS"
    ];

    let settingsJsonStr = localStorage.getItem("settings") || JSON.stringify(defaultSettings);
    let settings = JSON.parse(settingsJsonStr);
    settings_keys.map((key) => {
        if (!settings.hasOwnProperty(key)) {
            settings[key] = defaultSettings[key];
        }
    });
    if (settings['clock']) {
        document.getElementById("show-clock").checked = true;
    };
    if (settings['weather']) {
        document.getElementById("show-weather").checked = true;
    } else {
        document.getElementById("weather-options").style.display = "none";
    }
    if (settings['useCustomCity']) {
        document.getElementById("use-custom-city").checked = true;
        document.getElementById("custom-city-container").style.display = 'block';
    } else {
        document.getElementById("custom-city-container").style.display = 'none';
    };
    if (settings['customCity']) {
        document.getElementById("custom-city").value = settings['customCity'];
    }
    if (settings['tempUnit']) {
        document.querySelector(`input[name="temp-unit"][value="${settings.tempUnit}"]`).checked = true;
    }
    if (settings['bookmarks']) {
        document.getElementById("show-bookmarks").checked = true;
    }
    else {
        document.querySelector("#bookmark-folder-selector-span select").disabled = true;
    }
    if (settings['expandBookmarks']) {
        document.getElementById("expand-bookmarks").checked = true;
    }
    if (settings['topRight']) {
        document.getElementById("show-topRight").checked = true;
    }
    else {
        document.querySelector("#shortcuts-links").style.display = "none";
    }
    if (settings['pixelArt']) {
        document.getElementById("show-pixelArt").checked = true;
    }
    if (settings['selectedPixelArt']) {
        document.getElementById("pixel-art-select").value = settings['selectedPixelArt'];
        if (settings['selectedPixelArt'] == "custom") {
            document.getElementById("custom-svg-input-div").style.display = "block";
            document.getElementById("custom-svg-input").value = settings['customSVG'];
        }
        else {
            document.getElementById("custom-svg-input-div").style.display = "none";
        }
    }
    if (settings['pixelArtOpacity']) {
        document.getElementById("pixelArtOpacity").value = settings['pixelArtOpacity'];
    }
    if (settings['pixelArtDensity']) {
        document.getElementById("pixelArtDensity").value = settings['pixelArtDensity'];
    }
    if (settings['pixelArtColorDark']) {
        document.getElementById("pixelArtColorDark").value = settings['pixelArtColorDark'];
    }
    if (settings['pixelArtColorLight']) {
        document.getElementById("pixelArtColorLight").value = settings['pixelArtColorLight'];
    }
    if (settings['customCSS']) {
        document.getElementById("custom-css").value = settings['customCSS'];
    }
    if (settings['sidebar']) {
        document.getElementById("show-sidebar").checked = true;
    } else {
        document.getElementById("sidebar-options").style.display = "none";
    }
    if (settings['sidebarPosition']) {
        document.querySelector(`input[name="sidebar-position"][value="${settings.sidebarPosition}"]`).checked = true;
    }
    if (settings['sidebarExpanded']) {
        document.getElementById("sidebar-expanded-check").checked = true;
    }
    // Initialize and enforce dependency for sidebar Customize button visibility
    if (settings['sidebarShowCustomize'] === undefined) settings['sidebarShowCustomize'] = true;
    const sidebarShowCustomizeCheckbox = document.getElementById('sidebar-show-customize');
    if (sidebarShowCustomizeCheckbox) {
        sidebarShowCustomizeCheckbox.checked = !!settings['sidebarShowCustomize'];
    }

    function updateCustomizeDependency() {
        const expanded = document.getElementById('sidebar-expanded-check').checked;
        if (sidebarShowCustomizeCheckbox) {
            if (expanded) {
                sidebarShowCustomizeCheckbox.checked = true;
                sidebarShowCustomizeCheckbox.disabled = true;
                const wrapper = document.getElementById('sidebar-show-customize-wrapper');
                if (wrapper) wrapper.classList.add('disabled');
            } else {
                sidebarShowCustomizeCheckbox.disabled = false;
                const wrapper = document.getElementById('sidebar-show-customize-wrapper');
                if (wrapper) wrapper.classList.remove('disabled');
            }
        }
    }
    updateCustomizeDependency();
    const theme = localStorage.getItem('theme') || 'system';
    if (document.querySelector(`input[name="theme"][value="${theme}"]`)) {
        document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
    }

    // Handle background image preview
    const bgPreview = document.getElementById('background-preview');
    const imagePresentContainer = document.getElementById('image-present-container');
    const bgAddLabel = document.getElementById('background-add-label');
    const clearBgButton = document.getElementById('clear-background-image');
    const useUnsplashCheckbox = document.getElementById('use-unsplash');
    if (settings.useUnsplash) {
        useUnsplashCheckbox.checked = true;
        document.getElementById('unsplash-options').style.display = 'block';
    } else {
        document.getElementById('unsplash-options').style.display = 'none';
    }

    document.getElementById('unsplash-api-key').value = settings.unsplashApiKey || '';
    const unsplashApiKeyInput = document.getElementById('unsplash-api-key');
    const unsplashUpdateFrequencySelect = document.getElementById('unsplash-update-frequency');
    const showUnsplashRefreshCheckbox = document.getElementById('show-unsplash-refresh');

    function toggleUnsplashAdvancedOptions() {
        const hasApiKey = unsplashApiKeyInput.value.trim() !== '';
        const tooltipWrappers = document.querySelectorAll('#unsplash-options .tooltip-wrapper');

        unsplashUpdateFrequencySelect.disabled = !hasApiKey;
        showUnsplashRefreshCheckbox.disabled = !hasApiKey;
        if (!hasApiKey) {
            showUnsplashRefreshCheckbox.checked = false;
            tooltipWrappers.forEach(wrapper => wrapper.classList.add('disabled'));
        }
        else { tooltipWrappers.forEach(wrapper => wrapper.classList.remove('disabled')); }
    }
    toggleUnsplashAdvancedOptions(); // Initial check
    document.getElementById('unsplash-update-frequency').value = settings.unsplashUpdateFrequency || 'daily';
    showUnsplashRefreshCheckbox.checked = settings.showUnsplashRefresh || false;

    // Populate About panel: logo and version + links
    try {
        // Prefer chrome.runtime.getManifest() when available (extension context)
        let manifest = null;
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
            manifest = chrome.runtime.getManifest();
        }
        if (manifest && manifest.version) {
            document.getElementById('extension-version').textContent = manifest.version;
        } else {
            // Fallback: fetch manifest.json relative to the page
            fetch('manifest.json').then(r => r.json()).then(m => {
                if (m && m.version) document.getElementById('extension-version').textContent = m.version;
            }).catch(() => {
                document.getElementById('extension-version').textContent = 'Unknown';
            });
        }
    } catch (e) {
        try {
            fetch('manifest.json').then(r => r.json()).then(m => {
                if (m && m.version) document.getElementById('extension-version').textContent = m.version;
            });
        } catch (ignored) {
            document.getElementById('extension-version').textContent = 'Unknown';
        }
    }

    // If the webstore badge image exists, keep it; otherwise the img onerror handler shows the fallback SVG.
    // Add an accessible tooltip using data-tooltip wrappers for consistent styling if desired later.

    if (settings.backgroundImage) {
        bgPreview.src = settings.backgroundImage;
        bgPreview.classList.remove('hidden');
        imagePresentContainer.classList.remove('hidden');
        bgAddLabel.classList.add('hidden');
        clearBgButton.classList.remove('hidden');
    } else {
        bgPreview.classList.add('hidden');
        imagePresentContainer.classList.add('hidden');
        bgAddLabel.classList.remove('hidden');
        clearBgButton.classList.add('hidden');
    }

    // Populate widgets
    const sidebarWidgetsTbody = document.getElementById('sidebar-widgets');
    const enabledWidgets = settings.sidebarWidgets || [];
    let allWidgets = settings.availableWidgets || defaultSettings.availableWidgets;

    // Ensure allWidgets is an array to prevent errors from old settings formats
    if (!Array.isArray(allWidgets)) {
        allWidgets = defaultSettings.availableWidgets;
    }

    // Create a set of enabled widgets for quick lookup
    const enabledWidgetSet = new Set(enabledWidgets);
    const sortedWidgets = [
        ...enabledWidgets,
        ...allWidgets.filter(w => !enabledWidgetSet.has(w))
    ];

    sortedWidgets.forEach(widgetId => {
        const tr = document.createElement('tr');
        tr.setAttribute('draggable', 'true');

        const td1 = document.createElement('td');
        const td1label = document.createElement('label');
        td1label.className = "checkbox-label";
        td1label.innerHTML = `<input type="checkbox" data-widget="${widgetId}" ${enabledWidgetSet.has(widgetId) ? 'checked' : ''}><span class="custom-checkbox"></span>`;
        td1.appendChild(td1label);

        const td2 = document.createElement('td');
        td2.textContent = widgetId.charAt(0).toUpperCase() + widgetId.slice(1);

        const td3 = document.createElement('td');
        td3.className = 'drag-handle';
        td3.innerHTML = `<span>☰</span>`;

        tr.append(td1, td2, td3);
        sidebarWidgetsTbody.appendChild(tr);
    });



    if (settings.topRightOrder) {
        let tbody = document.querySelector("table#top-right-links tbody");
        tbody.innerHTML = "";
        settings['topRightOrder'].map(item => {
            let tr = document.createElement("tr");
            let td1 = document.createElement("td");
            let td1label = document.createElement("label");
            td1label.className = "checkbox-label";
            let td1check = document.createElement("input")
            td1check.type = "checkbox";
            td1check.setAttribute("data-key", item.id);
            td1check.checked = item.displayBool;
            td1label.innerHTML = '<span class="custom-checkbox"></span>';
            td1label.prepend(td1check);
            td1.append(td1label);
            let td2 = document.createElement("td");
            td2.innerHTML = item.id;
            let td3 = document.createElement("td");
            td3.innerHTML = `<span>☰</span>`;
            td3.classList.add('drag-handle');
            tr.innerHTML = "";
            tr.append(td1);
            tr.append(td2);
            tr.append(td3);
            tbody.append(tr);
        })
    }
    const shortcutsTableBody = document.querySelector("table#top-right-links tbody");
    let draggingShortcutRow = null;

    shortcutsTableBody.addEventListener('dragstart', e => {
        const row = e.target.closest('tr');
        if (row) {
            draggingShortcutRow = row;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', null); // Necessary for Firefox
            row.classList.add('dragging');
        }
    });

    shortcutsTableBody.addEventListener('dragend', e => {
        if (draggingShortcutRow) {
            draggingShortcutRow.classList.remove('dragging');
            draggingShortcutRow = null;
        }
    });

    shortcutsTableBody.addEventListener('dragover', e => {
        e.preventDefault();
        const targetRow = e.target.closest('tr');
        if (targetRow && targetRow !== draggingShortcutRow) {
            const rect = targetRow.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            shortcutsTableBody.insertBefore(draggingShortcutRow, next && targetRow.nextSibling || targetRow);
        }
    });

    shortcutsTableBody.addEventListener('drop', e => {
        e.preventDefault();
    });

    // Make rows draggable
    shortcutsTableBody.querySelectorAll('tr').forEach(row => row.setAttribute('draggable', 'true'));

    let selectElem = document.querySelector("#bookmark-folder-selector-span select");
    chrome.bookmarks.getTree(tree => {
        tree[0].children.map((folder) => {
            const optionElem = document.createElement("option");
            optionElem.value = folder.title;
            optionElem.text = folder.title;
            if (settings['bookmarkFolder'] == folder.title) {
                optionElem.selected = true;
            }
            selectElem.append(optionElem);
        })
    });

    // Back link navigation
    document.getElementById("back-link").addEventListener("click", () => {
        chrome.tabs.update({ url: "chrome://newtab" });
    });

    // Navigate back when pressing Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            chrome.tabs.update({ url: "chrome://newtab" });
        }
    });

    let saveBtn = document.getElementById("save");
    saveBtn.addEventListener("click", () => {
        let settings_obj = {};
        settings_keys.map((key) => {
            if (key == "topRightOrder") {
                let orderArr = []
                const tbody = document.querySelector("table#top-right-links tbody");
                let trs = tbody.children;
                for (var i = 0; i < trs.length; i++) {
                    let tr = tbody.children[i];
                    let trType = tr.querySelector("td input").getAttribute("data-key");
                    let checkedBool = tr.querySelector("td input").checked;
                    orderArr.push({
                        id: trType,
                        displayBool: checkedBool,
                        url: trType == "passwords" ? "chrome://password-manager/passwords" : "chrome://" + trType
                    });
                }
                settings_obj["topRightOrder"] = orderArr;
            }
            else if (key == "bookmarkFolder") {
                settings_obj[key] = document.querySelector("#bookmark-folder-selector-span select").value;
            }
            else if (key == "expandBookmarks") {
                settings_obj[key] = document.getElementById("expand-bookmarks").checked;
            }
            else if (key == "selectedPixelArt") {
                settings_obj[key] = document.querySelector("#pixel-art-select").value;
            }
            else if (key == "customSVG") {
                settings_obj[key] = document.querySelector("#custom-svg-input").value;
            }
            else if (["pixelArtOpacity", "pixelArtDensity", "pixelArtColorDark", "pixelArtColorLight"].includes(key)) {
                settings_obj[key] = document.getElementById(key).value;
            }
            else if (key == "customCity") {
                settings_obj[key] = document.getElementById("custom-city").value;
                if (document.getElementById("custom-city").value) {
                    localStorage.removeItem('weatherData');
                }
            } else if (key == "useCustomCity") {
                settings_obj[key] = document.getElementById("use-custom-city").checked;
                if (settings_obj[key] !== settings.useCustomCity || settings_obj.customCity !== settings.customCity) {
                    localStorage.removeItem('weatherData');
                }
            } else if (key === 'tempUnit') {
                settings_obj[key] = document.querySelector('input[name="temp-unit"]:checked').value;
            } else if (key === 'theme') {
                const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
                localStorage.setItem('theme', selectedTheme);
            } else if (key === 'sidebarPosition') {
                settings_obj[key] = document.querySelector('input[name="sidebar-position"]:checked').value;
            } else if (key === 'sidebarExpanded') {
                settings_obj[key] = document.getElementById("sidebar-expanded-check").checked;
            } else if (key === 'sidebarShowCustomize') {
                // If sidebarExpanded is set, enforce true for the customize button
                const expandedVal = document.getElementById("sidebar-expanded-check").checked;
                settings_obj[key] = expandedVal ? true : document.getElementById('sidebar-show-customize').checked;
            } else if (key === 'sidebarWidgets') {
                const widgetRows = document.querySelectorAll('#sidebar-widgets tr');
                const selectedWidgets = [];
                widgetRows.forEach(row => {
                    selectedWidgets.push(row.querySelector('input').getAttribute('data-widget'));
                });
                settings_obj[key] = selectedWidgets;
            } else if (key === 'availableWidgets') {
                // This is a static list for now, just carry it over.
                settings_obj[key] = settings.availableWidgets || defaultSettings.availableWidgets;
            }
            else if (key === 'backgroundImage') {
                settings_obj[key] = settings.backgroundImage || "";
            } else if (key === 'useUnsplash') {
                settings_obj[key] = document.getElementById('use-unsplash').checked;
                if (settings_obj[key]) {
                    settings_obj['backgroundImage'] = "";
                }
            } else if (key === 'unsplashApiKey') {
                settings_obj[key] = document.getElementById('unsplash-api-key').value.trim();
            } else if (key === 'unsplashUpdateFrequency') {
                settings_obj[key] = document.getElementById('unsplash-update-frequency').value;
                localStorage.removeItem('unsplashData');
            }
            else if (key === 'showUnsplashRefresh') {
                settings_obj[key] = document.getElementById('show-unsplash-refresh').checked;
            }
            else if (key === 'customCSS') {
                // Sanitize: remove </style> tags to prevent breaking out of style block
                const rawCSS = document.getElementById('custom-css').value;
                settings_obj[key] = rawCSS.replace(/<\/style>/gi, '');
            }
            else {
                settings_obj[key] = document.getElementById("show-" + key).checked;
            }


        });
        localStorage.setItem("settings", JSON.stringify(settings_obj));
        if (settings_obj.useUnsplash) {
            localStorage.removeItem('unsplashData');
        }
        showNotification("Settings Saved!", 2000, 'success', false);
    })

    const cityInput = document.getElementById('custom-city');
    const suggestionsContainer = document.getElementById('city-suggestions');

    unsplashApiKeyInput.addEventListener('input', toggleUnsplashAdvancedOptions);
    // When the 'keep sidebar expanded' option changes, enforce customize-button dependency
    const sidebarExpandedCheck = document.getElementById('sidebar-expanded-check');
    if (sidebarExpandedCheck) {
        sidebarExpandedCheck.addEventListener('change', () => {
            // updateCustomizeDependency is defined above during initialization
            try { updateCustomizeDependency(); } catch (e) { /* noop if not available */ }
        });
    }

    document.getElementById('use-unsplash').addEventListener('change', (e) => {
        document.getElementById('unsplash-options').style.display = e.target.checked ? 'block' : 'none';
        toggleUnsplashAdvancedOptions();
    });

    const onCityInput = debounce(async (e) => {
        const query = e.target.value;
        const suggestions = await fetchCitySuggestions(query);
        suggestionsContainer.innerHTML = '';
        if (suggestions && suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const div = document.createElement('div');
                div.textContent = suggestion;
                div.addEventListener('click', () => {
                    cityInput.value = suggestion;
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = '';
                });
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }, 300);

    cityInput.addEventListener('input', onCityInput);

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!document.getElementById('city-search-container').contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    const navLinks = document.querySelectorAll('.options-sidebar nav a');
    const panels = document.querySelectorAll('.options-panel');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);

            navLinks.forEach(navLink => navLink.classList.remove('active'));
            panels.forEach(panel => panel.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });

    const widgetList = document.getElementById('sidebar-widgets');
    let draggingElement = null;

    widgetList.addEventListener('dragstart', (e) => {
        const row = e.target.closest('tr');
        if (row) {
            draggingElement = row;
            e.dataTransfer.effectAllowed = 'move';
            row.classList.add('dragging');
        }
    });

    widgetList.addEventListener('dragend', (e) => {
        if (draggingElement) {
            draggingElement.classList.remove('dragging');
            draggingElement = null;
        }
    });

    widgetList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const targetRow = e.target.closest('tr');
        if (targetRow && targetRow !== draggingElement) {
            const rect = targetRow.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            widgetList.insertBefore(draggingElement, next && targetRow.nextSibling || targetRow);
        }
    });

    widgetList.addEventListener('drop', (e) => {
        e.preventDefault();
    });





    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            applyTheme(e.target.value);
        });
    });

    document.getElementById('background-image-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                settings.backgroundImage = event.target.result;
                localStorage.setItem("settings", JSON.stringify(settings));
                bgPreview.src = event.target.result;
                imagePresentContainer.classList.remove('hidden');
                bgPreview.classList.remove('hidden');
                bgAddLabel.classList.add('hidden');
                clearBgButton.classList.remove('hidden');
                showNotification("Background image saved. It will appear on the new tab page.", 3000, 'success', false);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('clear-background-image').addEventListener('click', () => {
        settings.backgroundImage = "";
        localStorage.setItem("settings", JSON.stringify(settings));
        document.getElementById('background-image-input').value = ''; // Clear file input
        bgPreview.src = '#';
        imagePresentContainer.classList.add('hidden');
        bgPreview.classList.add('hidden');
        bgAddLabel.classList.remove('hidden');
        clearBgButton.classList.add('hidden');
        showNotification("Background image cleared.", 2000, 'restore', false);
    });
});

document.getElementById("show-weather").addEventListener('change', (e) => {
    document.getElementById('weather-options').style.display = e.target.checked ? 'block' : 'none';
});

document.getElementById("use-custom-city").addEventListener('change', (e) => {
    document.getElementById('custom-city-container').style.display = e.target.checked ? 'block' : 'none';
    if (!e.target.checked) {
        // Clear custom city value when unchecked to revert to geolocation
        document.getElementById('custom-city').value = '';
    }
});

document.getElementById("custom-city").addEventListener('input', () => {
    // When user types, invalidate weather cache
    localStorage.removeItem('weatherData');
});


document.getElementById("restore-defaults").addEventListener("click", () => {
    localStorage.removeItem("settings");
    localStorage.setItem("settings", JSON.stringify(defaultSettings));
    showNotification("Settings restored to defaults! Reloading...", 2000, 'restore', true);
});

document.getElementById("show-bookmarks").onchange = (e) => {
    if (e.target.checked) {
        document.querySelector("#bookmark-folder-selector-span select").disabled = false;
        // document.querySelector("#expand-bookmarks-span").style.display = "block";
    }
    else {
        document.querySelector("#bookmark-folder-selector-span select").disabled = true;
        document.querySelector("#bookmark-folder-selector-span").style.display = "none";
    }
}

document.getElementById("show-topRight").onchange = (e) => {
    if (e.target.checked) {
        document.querySelector("#shortcuts-links").style.display = "block";
    }
    else {
        document.querySelector("#shortcuts-links").style.display = "none";
    }
}

document.getElementById("show-pixelArt").onchange = (e) => {
    if (e.target.checked) {
        document.querySelector("#pixel-art-select-div").style.display = "block";
    }
    else {
        document.querySelector("#pixel-art-select-div").style.display = "none";
    }
}

document.getElementById("pixel-art-select").onchange = (e) => {
    let selectedPixelArt = e.target.value;
    if (selectedPixelArt == "custom") {
        document.getElementById("custom-svg-input-div").style.display = "block";
    }
    else {
        document.getElementById("custom-svg-input-div").style.display = "none";
    }
}

document.getElementById("show-sidebar").onchange = (e) => {
    if (e.target.checked) {
        document.querySelector("#sidebar-options").style.display = "block";
    }
    else {
        document.querySelector("#sidebar-options").style.display = "none";
    }
}


let theme = localStorage.getItem('theme') || 'system';

function applyTheme(theme) {
    document.body.classList.remove('dark', 'light');
    if (theme === 'dark') {
        document.body.classList.add('dark');
    } else if (theme === 'light') {
        document.body.classList.add('light');
    } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.add('light');
        }
    }
}

applyTheme(theme);

    // Update About icons based on theme (light/dark/system)
    function updateAboutIcons() {
        const webstoreImg = document.getElementById('webstore-img');
        const githubImg = document.getElementById('github-img');
        if (!webstoreImg || !githubImg) return;

        let effective = theme;
        if (theme === 'system') {
            effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        webstoreImg.src = `favicons/chromewebstore-${effective}.png`;
        githubImg.src = `favicons/github-${effective}.png`;
    }
    updateAboutIcons();

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (theme === 'system') {
        applyTheme('system');
    }
});

// Keep About icons in sync when system theme changes while in 'system' mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (theme === 'system') {
        try { updateAboutIcons(); } catch (err) { /* ignore */ }
    }
});

// Easter egg: clicking on the app icon or title 10 times redirects to YouTube
(function() {
    const CLICK_TARGET = 10;
    let clickCount = 0;
    const logo = document.getElementById('about-logo');
    const title = document.getElementById('about-title');

    function incrementAndMaybeRedirect() {
        clickCount++;
        if (clickCount >= CLICK_TARGET) {
            // Open YouTube (navigate current tab) as the easter egg destination
            chrome.tabs.create({ url: 'https://music.youtube.com/playlist?list=PLK_7F5FZ-_UQvmcztt2X7qMYOSGIH31Hc&si=BwTs_LOMzIQskPP7' });
            // try {
            //     window.location.href = 'https://www.youtube.com/';
            // } catch (e) {
            //     window.open('https://www.youtube.com/', '_blank');
                
            // }
        }
    }

    [logo, title].forEach(el => {
        if (!el) return;
        el.addEventListener('click', incrementAndMaybeRedirect);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                incrementAndMaybeRedirect();
            }
        });
    });
})();