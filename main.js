import { renderCalendar } from './widgets/calendar.js';
import { renderTodo } from './widgets/todo.js';

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${mins}`;
}

const weatherCodes = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm"
};

function fetchWeatherAndCity(lat, lon, tempUnit = 'celsius') {
    const now = new Date();
    const cachedWeather = localStorage.getItem('weatherData');
    
    if (cachedWeather) {
        const weatherData = JSON.parse(cachedWeather);
        if ((now - new Date(weatherData.timestamp)) < 30 * 60 * 1000) {
            document.getElementById('weather').textContent = weatherData.text;
            return;
        }
    }

    const tempUnitParam = tempUnit === 'fahrenheit' ? '&temperature_unit=fahrenheit' : '';

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true${tempUnitParam}`)
        .then(res => res.json())
        .then(data => {
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            const desc = weatherCodes[code] || `Code ${code}`;
            let weatherText = `${desc}, ${temp}°${tempUnit === 'celsius' ? 'C' : 'F'}`;

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                .then(res => res.json())
                .then(location => {
                    const city = location.address.city || location.address.town || location.address.village || location.address.county || "your area";
                    const weatherString = `${city}: ${weatherText}`;
                    document.getElementById('weather').textContent = weatherString;
                    
                    // Cache the weather data
                    localStorage.setItem('weatherData', JSON.stringify({
                        text: weatherString,
                        timestamp: now.toISOString()
                    }));
                })
                .catch(() => {
                    document.getElementById('weather').textContent = weatherText;
                });
        })
        .catch(() => {
            document.getElementById('weather').textContent = "Unable to fetch weather.";
        });
}

function fetchWeatherByCity(city, tempUnit = 'celsius') {
    const now = new Date();
    const cachedWeather = localStorage.getItem('weatherData');
    
    if (cachedWeather) {
        const weatherData = JSON.parse(cachedWeather);
        if ((now - new Date(weatherData.timestamp)) < 30 * 60 * 1000) {
            document.getElementById('weather').textContent = weatherData.text;
            return;
        }
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                fetchWeatherAndCity(lat, lon, tempUnit);
            } else {
                document.getElementById('weather').textContent = "City not found";
            }
        })
        .catch(() => {
            document.getElementById('weather').textContent = "Unable to fetch weather";
        });
}

function displayPhotoCredit(photoData) {
    const creditContainer = document.getElementById('photo-credit');
    const creditLink = document.getElementById('photo-credit-link');

    if (photoData && photoData.user) {
        creditLink.href = photoData.user.links.html + "?utm_source=minimal_new_tab&utm_medium=referral";
        creditLink.textContent = photoData.user.name;
        creditContainer.style.display = 'block';
    } else {
        creditContainer.style.display = 'none';
    }
}

function analyzeAndSetTextColor(imageUrl) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const x = Math.floor(img.width / 4);
        const y = Math.floor(img.height / 4);
        const width = Math.floor(img.width / 2);
        const height = Math.floor(img.height / 2);
        const imageData = ctx.getImageData(x, y, width, height).data;

        let r = 0, g = 0, b = 0;
        for (let i = 0; i < imageData.length; i += 4) {
            r += imageData[i];
            g += imageData[i + 1];
            b += imageData[i + 2];
        }
        const pixelCount = imageData.length / 4;
        const luminance = (0.299 * (r / pixelCount) + 0.587 * (g / pixelCount) + 0.114 * (b / pixelCount));
        document.body.style.color = luminance > 128 ? '#222' : '#f0f0f0';
    };
}

async function setUnsplashBackground(forceRefresh = false) {
    const now = new Date();
    const cachedData = localStorage.getItem('unsplashData');
    const userApiKey = settings.unsplashApiKey;    
    
    let currentTheme = localStorage.getItem('theme') || 'system';
    let themeQuery = '';
    if (currentTheme === 'system') {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (currentTheme === 'dark') {
        themeQuery = ',dark';
    }

    const frequencyMap = {
        '15min': 15 * 60 * 1000,
        '30min': 30 * 60 * 1000,
        'hourly': 60 * 60 * 1000,
        'daily': 24 * 60 * 60 * 1000,
        'weekly': 7 * 24 * 60 * 60 * 1000
    };
    const updateFrequency = frequencyMap[settings.unsplashUpdateFrequency] || frequencyMap['daily'];

    if (userApiKey && settings.showUnsplashRefresh) {
        document.getElementById('refresh-background').style.display = 'inline-flex';
    }

    if (cachedData && !forceRefresh) {
        const { timestamp, photo } = JSON.parse(cachedData);
        if ((now - new Date(timestamp)) < updateFrequency) {
            const img = new Image();
            img.onload = () => {
                document.body.style.backgroundImage = `url(${photo.urls.full})`;
                analyzeAndSetTextColor(photo.urls.full);
            };
            img.src = photo.urls.full;
            displayPhotoCredit(photo);
            return;
        }
    }

    if (!userApiKey) {
        console.error("Unsplash API key is missing. Please add it in the options page.");
        const creditContainer = document.getElementById('photo-credit');
        creditContainer.style.display = 'block';
        creditContainer.innerHTML = 'Unsplash background requires an API key in settings.';
        return;
    }

    try {
        let apiUrl;
        if (userApiKey) {
            apiUrl = `https://api.unsplash.com/photos/random?query=wallpapers${themeQuery}&orientation=landscape&client_id=${userApiKey}`;
        }
        const response = await fetch(apiUrl);
        if (response.ok) {
            const newPhoto = await response.json();
            const img = new Image();
            img.onload = () => {
                document.body.style.backgroundImage = `url(${newPhoto.urls.full})`;
                analyzeAndSetTextColor(newPhoto.urls.full);
                localStorage.setItem('unsplashData', JSON.stringify({
                    timestamp: now.toISOString(),
                    photo: newPhoto
                }));
                displayPhotoCredit(newPhoto);
            };
            img.src = newPhoto.urls.full;
        }
        else if (response.status === 429) {
            console.warn("Unsplash background refresh rate-limited. Please wait before trying again.");
        }
    } catch (error) {
        console.error("Failed to fetch Unsplash background:", error);
    }
}

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

    const iconContainer = document.querySelector('.theme-icon');
    const label = document.querySelector('.theme-label');
    iconContainer.innerHTML = icons[theme];
    label.textContent = theme[0].toUpperCase() + theme.slice(1);

    const customizeContainer = document.querySelector('.customize-icon');
    if (theme == 'system') {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            customizeContainer.innerHTML = customizeIcon["dark"];
        }
        else {
            customizeContainer.innerHTML = customizeIcon["light"];
        }
    }
    else {
        customizeContainer.innerHTML = customizeIcon[theme];
    }

}

function renderBookmarks(nodes, container, level = 0, path = "") {
    nodes.forEach((node, idx) => {
        const currentPath = `${path}/${node.title || "Untitled"}`;

        if (node.children && node.children.length > 0) {
            const folderRow = document.createElement('div');
            folderRow.className = 'bookmark-folder';
            folderRow.style.marginLeft = `${level * 0.5}rem`;

            const chevron = document.createElement('span');
            chevron.textContent = "▶";
            chevron.className = 'chevron';

            const title = document.createElement('span');
            title.textContent = ` ${node.title || "Untitled folder"}`;

            folderRow.appendChild(chevron);
            folderRow.appendChild(title);

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'bookmark-children';
            childrenContainer.style.maxHeight = '0';
            childrenContainer.style.overflow = 'hidden';

            const isOpen = localStorage.getItem(currentPath) === "true";
            if (isOpen) {
                childrenContainer.style.maxHeight = '1000px';
                chevron.textContent = "▼";
            }

            folderRow.addEventListener('click', () => {
                const expanded = childrenContainer.style.maxHeight !== '0px';
                if (expanded) {
                    childrenContainer.style.maxHeight = '0';
                    chevron.textContent = "▶";
                    localStorage.setItem(currentPath, "false");
                } else {
                    childrenContainer.style.maxHeight = '1000px';
                    chevron.textContent = "▼";
                    localStorage.setItem(currentPath, "true");
                }
            });

            container.appendChild(folderRow);
            container.appendChild(childrenContainer);

            renderBookmarks(node.children, childrenContainer, level + 1, currentPath);

        } else if (node.url) {
            const a = document.createElement('a');
            a.href = node.url;
            a.className = 'shortcut';
            a.style.marginLeft = `${level * 0.5}rem`;
            a.textContent = node.title || node.url;
            container.appendChild(a);
        }
    });
}

const defaultSettings = {
    "clock": true,
    "weather": true,
    "bookmarks": true,
    "topRight": true,
    "tempUnit": "celsius",
    "topRightOrder": [
        { id: "bookmarks", displayBool: true, url: "chrome://bookmarks" },
        { id: "downloads", displayBool: true, url: "chrome://downloads" },
        { id: "history", displayBool: true, url: "chrome://history" },
        { id: "extensions", displayBool: true, url: "chrome://extensions" },
        { id: "passwords", displayBool: true, url: "chrome://password-manager/passwords" },
        { id: "settings", displayBool: true, url: "chrome://settings" },
    ],
    "sidebar": false, "sidebarPosition": "right", "sidebarWidgets": [
    ],
    "unsplashApiKey": "", 
    "showUnsplashRefresh": false,
    "unsplashUpdateFrequency": "daily"
};

const settings = JSON.parse(localStorage.getItem("settings")) || defaultSettings;

if (settings.useUnsplash) {
    setUnsplashBackground();
} else if (settings.backgroundImage) {
    document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
    analyzeAndSetTextColor(settings.backgroundImage);
}

if (settings.useUnsplash || settings.backgroundImage) {
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
}

if (settings.clock) {
    setInterval(updateClock, 1000);
    updateClock();
}
else {
    document.getElementById("clock").style.display = 'none';
}

if (settings.weather) {
    const useCustomCity = settings.useCustomCity;
    const tempUnit = settings.tempUnit || 'celsius';
    if (useCustomCity && settings.customCity) {
        const customCity = settings.customCity;
        fetchWeatherByCity(customCity, tempUnit);
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => fetchWeatherAndCity(pos.coords.latitude, pos.coords.longitude, tempUnit),
                () => { document.getElementById('weather').textContent = "Location access denied."; }
            );
        } else {
            document.getElementById('weather').textContent = "Geolocation not supported.";
        }
    }
} else {
    document.getElementById('weather').style.display = 'none';
}

if (settings.bookmarks) {
    chrome.bookmarks.getTree(tree => {
        const shortcuts = document.getElementById('shortcuts');
        let bookmarksBar = tree[0].children.find(folder => folder.title.toLowerCase() === "bookmarks bar");
        if (settings.bookmarkFolder) {
            bookmarksBar = tree[0].children.find(folder => folder.title.toLowerCase() === settings.bookmarkFolder.toLowerCase());
        }
        if (bookmarksBar && bookmarksBar.children) {
            renderBookmarks(bookmarksBar.children, shortcuts);
        } else {
            shortcuts.textContent = "No bookmarks found.";
        }
    });
}
else {
    document.getElementById("shortcuts").style.display = 'none';
}

if (settings.topRight) {
    const topRightOrder = settings.topRightOrder;
    let container = document.getElementById("top-right");
    container.innerHTML = "";
    topRightOrder.map((item) => {
        if (item.displayBool) {
            let itemElem = document.createElement("span");
            itemElem.id = "open-" + item["id"];
            itemElem.innerHTML = item["id"];
            itemElem.addEventListener('click', () => {
                chrome.tabs.create({ url: item['url'] });
            })
            container.append(itemElem);
        }

    })
}
else {
    document.getElementById('top-right').style.display = 'none';
}

if (settings.sidebar) {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = 'flex';
    sidebar.classList.add(settings.sidebarPosition || 'right');

    const sidebarContent = sidebar.querySelector('.sidebar-content');
    const selectedWidgets = settings.sidebarWidgets || [];

    const widgetRenderers = {
        calendar: renderCalendar,
        todo: renderTodo
    };

    if (selectedWidgets.length > 0) {
        selectedWidgets.forEach(widgetId => {
            if (widgetRenderers[widgetId]) {
                const widgetContainer = document.createElement('div');
                widgetContainer.classList.add('widget');
                widgetContainer.id = `widget-${widgetId}`;

                const widgetContent = widgetRenderers[widgetId];
                widgetContainer.append(widgetContent());
                sidebarContent.appendChild(widgetContainer);
            }
        });
    } else {
        sidebarContent.innerHTML = '<p style="text-align: center; margin-top: 50px;">No widgets selected. You can add widgets from the Customize menu.</p>';
    }

    const handle = sidebar.querySelector('.sidebar-handle');
    handle.addEventListener('click', () => {
        sidebar.classList.toggle('minimised');
    });
}
if (settings.unsplashApiKey && settings.showUnsplashRefresh) {
    document.getElementById('refresh-background').addEventListener('click', () => {
        setUnsplashBackground(true);
    });
}
const icons = {
    system: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"> <defs> <linearGradient id="half"> <stop offset="50%" stop-color="white" /> <stop offset="50%" stop-color="black" /> </linearGradient> </defs> <circle cx="24" cy="24" r="10" fill="url(#half)" stroke="currentColor" stroke-width="2"/> <line x1="24" y1="2" x2="24" y2="10" stroke="currentColor" stroke-width="2"/> <line x1="24" y1="38" x2="24" y2="46" stroke="currentColor" stroke-width="2"/> <line x1="2" y1="24" x2="10" y2="24" stroke="currentColor" stroke-width="2"/> <line x1="38" y1="24" x2="46" y2="24" stroke="currentColor" stroke-width="2"/> <line x1="8.5" y1="8.5" x2="14.5" y2="14.5" stroke="currentColor" stroke-width="2"/> <line x1="33.5" y1="33.5" x2="39.5" y2="39.5" stroke="currentColor" stroke-width="2"/> <line x1="8.5" y1="39.5" x2="14.5" y2="33.5" stroke="currentColor" stroke-width="2"/> <line x1="33.5" y1="14.5" x2="39.5" y2="8.5" stroke="currentColor" stroke-width="2"/> </svg>`,
    dark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path fill="none" stroke="white" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z"/> </svg>`,
    light: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="black" stroke-width="2"> <circle cx="24" cy="24" r="10" fill="none"/> <line x1="24" y1="2" x2="24" y2="10"/> <line x1="24" y1="38" x2="24" y2="46"/> <line x1="2" y1="24" x2="10" y2="24"/> <line x1="38" y1="24" x2="46" y2="24"/> <line x1="8.5" y1="8.5" x2="14.5" y2="14.5"/> <line x1="33.5" y1="33.5" x2="39.5" y2="39.5"/> <line x1="8.5" y1="39.5" x2="14.5" y2="33.5"/> <line x1="33.5" y1="14.5" x2="39.5" y2="8.5"/> </svg>`
};

const customizeIcon = {
    "dark": `<svg fill="white" width="32px" height="32px" viewBox="-1 0 44 44"><path id="_45.Settings" data-name="45.Settings" d="M35,22H13A10,10,0,0,1,13,2H35a10,10,0,0,1,0,20ZM35,4H13a8,8,0,0,0,0,16H35A8,8,0,0,0,35,4ZM13,18a6,6,0,1,1,6-6A6,6,0,0,1,13,18ZM13,8a4,4,0,1,0,4,4A4,4,0,0,0,13,8Zm0,18H35a10,10,0,0,1,0,20H13a10,10,0,0,1,0-20Zm0,18H35a8,8,0,0,0,0-16H13a8,8,0,0,0,0,16ZM35,30a6,6,0,1,1-6,6A6,6,0,0,1,35,30Zm0,10a4,4,0,1,0-4-4A4,4,0,0,0,35,40Z" transform="translate(-3 -2)" fill-rule="evenodd"/></svg>`,
    "light": `<svg fill="black" width="32px" height="32px" viewBox="-1 0 44 44"><path id="_45.Settings" data-name="45.Settings" d="M35,22H13A10,10,0,0,1,13,2H35a10,10,0,0,1,0,20ZM35,4H13a8,8,0,0,0,0,16H35A8,8,0,0,0,35,4ZM13,18a6,6,0,1,1,6-6A6,6,0,0,1,13,18ZM13,8a4,4,0,1,0,4,4A4,4,0,0,0,13,8Zm0,18H35a10,10,0,0,1,0,20H13a10,10,0,0,1,0-20Zm0,18H35a8,8,0,0,0,0-16H13a8,8,0,0,0,0,16ZM35,30a6,6,0,1,1-6,6A6,6,0,0,1,35,30Zm0,10a4,4,0,1,0-4-4A4,4,0,0,0,35,40Z" transform="translate(-3 -2)" fill-rule="evenodd"/></svg>`
}

document.getElementById("customize").addEventListener("click", () => {
    location.href = "/options.html";
})

// Initialize theme
let theme = localStorage.getItem('theme') || 'system';
applyTheme(theme);

// Handle toggle click
document.querySelector('.theme-toggle').addEventListener('click', () => {
    if (theme === 'system') {
        theme = 'dark';
    } else if (theme === 'dark') {
        theme = 'light';
    } else {
        theme = 'system';
    }

    localStorage.setItem('theme', theme);
    applyTheme(theme);
});

// React to system theme change if in system mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (theme === 'system') {
        applyTheme('system');
    }
});