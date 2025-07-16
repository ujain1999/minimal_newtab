document.addEventListener('DOMContentLoaded', () => {
    const settings_keys = [
        "clock", "weather", "bookmarks", "bookmarkFolder", "topRight", "topRightOrder"
    ];
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
        ]
    }

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
    };
    if (settings['topRightOrder']) {
        let tbody = document.querySelector("table#top-right-links tbody");
        tbody.innerHTML = "";
        console.log(settings);
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
        console.log(tree);
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
                debugger;
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
            else {
                settings_obj[key] = document.getElementById("show-" + key).checked;
            }

        });
        console.log(settings_obj);
        localStorage.setItem("settings", JSON.stringify(settings_obj));
        console.log(settings_obj)
        alert("Settings Saved!");
    })

});

document.getElementById("show-bookmarks").onchange = (e) => {
    if (e.target.checked) {
        document.querySelector("#bookmark-folder-selector-span select").disabled = false;
    }
    else {
        document.querySelector("#bookmark-folder-selector-span select").disabled = true;
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