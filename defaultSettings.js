const defaultSettings = {
    "clock": true,
    "weather": true,
    "customCity": "",
    "useCustomCity": false,
    "tempUnit": "celsius",
    "bookmarks": true,
    "bookmarkFolder": "Bookmarks Bar",
    "expandBookmarks": false,
    "topRight": true,
    "topRightOrder": [
        { "id": "bookmarks", "displayBool": true, "url": "chrome://bookmarks" },
        { "id": "downloads", "displayBool": true, "url": "chrome://downloads" },
        { "id": "history", "displayBool": true, "url": "chrome://history" },
        { "id": "extensions", "displayBool": true, "url": "chrome://extensions" },
        { "id": "passwords", "displayBool": true, "url": "chrome://password-manager/passwords" },
        { "id": "settings", "displayBool": true, "url": "chrome://settings" }
    ],
    "pixelArt": true,
    "selectedPixelArt": "flowers",
    "customSVG": "",
    "pixelArtOpacity": 40,
    "pixelArtDensity": 20,
    "pixelArtColorDark": "#cccccc",
    "pixelArtColorLight": "#b04288",
    "availableWidgets": ["calendar", "todo"], 
    "useUnsplash": false, 
    "unsplashApiKey": "",
    "unsplashUpdateFrequency": "daily",
    "showUnsplashRefresh": false,
    "backgroundImage": "",
    "sidebar": false, 
    "sidebarPosition": "right", 
    "sidebarWidgets": [], 
    "sidebarExpanded": false, 
    "sidebarShowCustomize": true,
    "customCSS": ""
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