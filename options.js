const defaultSettings = {
    "clock": true,
    "weather": true,
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
    "pixelArtColorLight": "#b04288"
}

document.addEventListener('DOMContentLoaded', () => {
    const settings_keys = [
        "clock", "weather", "bookmarks", "bookmarkFolder", "topRight", "topRightOrder", "pixelArt", "selectedPixelArt",
        "customSVG", "pixelArtOpacity", "pixelArtDensity", "pixelArtColorDark", "pixelArtColorLight"
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
    };
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
    if (settings['topRightOrder']) {
        let tbody = document.querySelector("table#top-right-links tbody");
        tbody.innerHTML = "";
        settings['topRightOrder'].map(item => {
            let tr = document.createElement("tr");
            let td1 = document.createElement("td");
            let td1check = document.createElement("input")
            td1check.type = "checkbox";
            td1check.setAttribute("data-key", item.id);
            td1check.checked = item.displayBool;
            td1.append(td1check);
            let td2 = document.createElement("td");
            td2.innerHTML = item.id;
            let td3 = document.createElement("td");
            td3.innerHTML = `<button class="up">↑</button><button class="down">↓</button>`;
            tr.innerHTML = "";
            tr.append(td1);
            tr.append(td2);
            tr.append(td3);
            tbody.append(tr);
        })
    }
    let container = document.querySelector("table#top-right-links tbody");
    container.addEventListener('click', e => {
        if (e.target.classList.contains('up')) {
            const row = e.target.closest('tr');
            if (row.previousElementSibling) {
                container.insertBefore(row, row.previousElementSibling);
            }
        }

        if (e.target.classList.contains('down')) {
            const row = e.target.closest('tr');
            if (row.nextElementSibling) {
                container.insertBefore(row.nextElementSibling, row);
            }
        }
    });

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
            else {
                settings_obj[key] = document.getElementById("show-" + key).checked;
            }

        });
        localStorage.setItem("settings", JSON.stringify(settings_obj));
        alert("Settings Saved!");
        location.reload();
    })

});

document.getElementById("restore-defaults").addEventListener("click", () => {
    localStorage.removeItem("settings");
    localStorage.setItem("settings", JSON.stringify(defaultSettings));
    alert("Settings Restored to Defaults!");
    location.reload();
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