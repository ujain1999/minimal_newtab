const defaultSettings = {
    "clock": true,
    "weather": true,
    "customCity": "",
    "useCustomCity": false,
    "bookmarks": true,
    "bookmarkFolder": "Bookmarks Bar",
    "topRight": true,
    "topRightOrder": [
        { id: "bookmarks", displayBool: true, url: "chrome://bookmarks", },
        { id: "downloads", displayBool: true, url: "chrome://downloads" },
        { id: "history", displayBool: true, url: "chrome://history" },
        { id: "extensions", displayBool: true, url: "chrome://extensions" },
        { id: "passwords", displayBool: true, url: "chrome://password-manager/passwords" },
        { id: "settings", displayBool: true, url: "chrome://settings" }
    ],
    "pixelArt": true,
    "selectedPixelArt": "flowers",
    "customSVG": "",
    "pixelArtOpacity": 40,
    "pixelArtDensity": 20,
    "pixelArtColorDark": "#cccccc",
    "pixelArtColorLight": "#b04288",
    "availableWidgets": ["calendar", "todo"]
,
    "backgroundImage": ""};

Object.assign(defaultSettings, {
    "sidebar": false, "sidebarPosition": "right", "sidebarWidgets": []
});

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
        "clock", "weather", "useCustomCity", "customCity", "bookmarks", "bookmarkFolder", "topRight", "topRightOrder", "pixelArt", "selectedPixelArt",
        "customSVG", "pixelArtOpacity", "pixelArtDensity", "pixelArtColorDark", "pixelArtColorLight", "availableWidgets", "theme", "backgroundImage",
        "sidebar", "sidebarPosition", "sidebarWidgets"
    ];

    let settingsJsonStr = localStorage.getItem("settings") || JSON.stringify(defaultSettings);
    let settings = JSON.parse(settingsJsonStr);
    settings_keys.map((key) => {
        if (!settings.hasOwnProperty(key) && key != "topRightOrder") {
            settings[key] = true;
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
    if (settings['bookmarks']) {
        document.getElementById("show-bookmarks").checked = true;
    }
    else {
        document.querySelector("#bookmark-folder-selector-span select").disabled = true;
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
    if (settings['sidebar']) {
        document.getElementById("show-sidebar").checked = true;
    } else {
        document.getElementById("sidebar-options").style.display = "none";
    }
    if (settings['sidebarPosition']) {
        document.querySelector(`input[name="sidebar-position"][value="${settings.sidebarPosition}"]`).checked = true;
    }
    const theme = localStorage.getItem('theme') || 'system';
    if (document.querySelector(`input[name="theme"][value="${theme}"]`)) {
        document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
    }

    // Handle background image preview
    const bgPreview = document.getElementById('background-preview');
    const imagePresentContainer = document.getElementById('image-present-container');
    const bgAddLabel = document.getElementById('background-add-label');
    const clearBgButton = document.getElementById('clear-background-image');

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

    document.getElementById("back-link").addEventListener("click", () => {
        chrome.tabs.update({ url: "chrome://newtab" });
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
            } else if (key === 'theme') {
                const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
                localStorage.setItem('theme', selectedTheme);
            } else if (key === 'sidebarPosition') {
                settings_obj[key] = document.querySelector('input[name="sidebar-position"]:checked').value;
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
                // This is handled by its own event listener, so just carry over the existing value
                settings_obj[key] = settings.backgroundImage || "";
            }
            else {
                settings_obj[key] = document.getElementById("show-" + key).checked;
            }


        });
        localStorage.setItem("settings", JSON.stringify(settings_obj));
        showNotification("Settings Saved!", 2000, 'success', false);
    })

    const cityInput = document.getElementById('custom-city');
    const suggestionsContainer = document.getElementById('city-suggestions');

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

    // Drag and drop for widgets
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
    }
    else {
        document.querySelector("#bookmark-folder-selector-span select").disabled = true;
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

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (theme === 'system') {
        applyTheme('system');
    }
});