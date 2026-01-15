import { renderClock } from './components/js/clock.js';
import { renderWeather } from './components/js/weather.js';
import { renderBookmarks } from './components/js/bookmarks.js';
import { renderTopRight } from './components/js/topRight.js';
import { renderSidebar } from './components/js/sidebar.js';



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
            const cacheBust = new Date().getTime();
            apiUrl = `https://api.unsplash.com/photos/random?query=wallpapers${themeQuery}&orientation=landscape&client_id=${userApiKey}&cache_bust=${cacheBust}`;
        
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

if (localStorage.getItem("settings") === null) {
    localStorage.setItem("settings", JSON.stringify(defaultSettings));
}

const settings = JSON.parse(localStorage.getItem("settings")) || defaultSettings;

// Apply custom CSS if provided
if (settings.customCSS) {
    const styleElement = document.createElement('style');
    styleElement.id = 'user-custom-css';
    styleElement.textContent = settings.customCSS;
    document.head.appendChild(styleElement);
}

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

if (settings.topRight) {
    renderTopRight(settings);
}
else {
    document.getElementById('top-right').style.display = 'none';
}

if (settings.clock) {
    renderClock();
}
else {
    document.getElementById("clock").style.display = 'none';
}

if (settings.weather) {
    renderWeather(settings);
} else {
    document.getElementById('weather').style.display = 'none';
}

if (settings.bookmarks) {
    renderBookmarks(settings);
} else {
    document.getElementById("shortcuts").style.display = 'none';
}

// if (settings.topRight) {
//     renderTopRight(settings);
// }
// else {
//     document.getElementById('top-right').style.display = 'none';
// }

if (settings.sidebar) {
    // const sidebar = document.getElementById('sidebar');
    // sidebar.style.display = 'flex';
    // sidebar.classList.add(settings.sidebarPosition || 'right');

    // const sidebarContent = sidebar.querySelector('.sidebar-content');
    // const selectedWidgets = settings.sidebarWidgets || [];

    // const widgetRenderers = {
    //     calendar: renderCalendar,
    //     todo: renderTodo
    // };

    // if (selectedWidgets.length > 0) {
    //     selectedWidgets.forEach(widgetId => {
    //         if (widgetRenderers[widgetId]) {
    //             const widgetContainer = document.createElement('div');
    //             widgetContainer.classList.add('widget');
    //             widgetContainer.id = `widget-${widgetId}`;

    //             const widgetContent = widgetRenderers[widgetId];
    //             widgetContainer.append(widgetContent());
    //             sidebarContent.appendChild(widgetContainer);
    //         }
    //     });
    // } else {
    //     sidebarContent.innerHTML = '<p style="text-align: center; margin-top: 50px;">No widgets selected. You can add widgets from the Customize menu.</p>';
    // }

    // if (settings.sidebarExpanded) {
    //     sidebar.classList.remove('minimised');
    // }
    
    // if (settings.sidebarShowCustomize || settings.sidebarExpanded) {
    //     const sidebarFooter = document.createElement('div');
    //     sidebarFooter.className = 'sidebar-footer';
    //     sidebarFooter.innerHTML = `<button id="sidebar-customize" class="sidebar-customize-btn" title="Customize">Customize</button>`;
    //     sidebar.appendChild(sidebarFooter);

    //     document.getElementById('sidebar-customize').addEventListener('click', () => {
    //         location.href = '/options.html';
    //     });
    // }

    // // Hide/show bottom-left customize button based on sidebar position and state
    // const customizeBtn = document.getElementById('customize');
    // const themeToggle = document.querySelector('.theme-toggle');
    // const updateCustomizeVisibility = () => {
    //     const isLeft = settings.sidebarPosition === 'left';
    //     const isRight = settings.sidebarPosition === 'right' || !settings.sidebarPosition;
    //     const isExpanded = !sidebar.classList.contains('minimised');
        
    //     // Hide customize button when sidebar is on left and expanded
    //     if (isLeft && isExpanded) {
    //         customizeBtn.style.opacity = '0';
    //         customizeBtn.style.pointerEvents = 'none';
    //     } else {
    //         customizeBtn.style.opacity = '1';
    //         customizeBtn.style.pointerEvents = 'auto';
    //     }
        
    //     // Hide theme toggle when sidebar is on right and expanded
    //     if (isRight && isExpanded) {
    //         themeToggle.style.opacity = '0';
    //         themeToggle.style.pointerEvents = 'none';
    //     } else {
    //         themeToggle.style.opacity = '1';
    //         themeToggle.style.pointerEvents = 'auto';
    //     }
    // };
    
    // updateCustomizeVisibility();
    
    // const handle = sidebar.querySelector('.sidebar-handle');
    // handle.addEventListener('click', () => {
    //     sidebar.classList.toggle('minimised');
    //     updateCustomizeVisibility();
    // });
    renderSidebar(settings);
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