function loadStylesheet(filename) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = filename; // e.g., 'styles.css' or 'theme.css'
  document.head.appendChild(link);
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