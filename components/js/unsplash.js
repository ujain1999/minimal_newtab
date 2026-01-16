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

async function renderUnsplashBackground(settings, forceRefresh = false) {
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

export { renderUnsplashBackground };