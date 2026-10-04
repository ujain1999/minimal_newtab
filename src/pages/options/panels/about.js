export function render(container, settings) {
    container.innerHTML = `
        <h2>About</h2>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
            <img id="about-logo" src="../../assets/favicons/android-chrome-512x512.png" alt="Logo" style="width:72px;height:72px;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.12);">
            <div>
                <div id="about-title" role="button" tabindex="0" style="font-weight:bold;font-size:1.1rem;">Minimal New Tab</div>
                <div style="opacity:0.8;margin-top:0.25rem;">Version <span id="extension-version">-</span></div>
            </div>
        </div>
        <br>
        <div class="about-links" style="margin-top:1rem;display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;">
            <div class="tooltip-wrapper" data-tooltip="View on Chrome Web Store">
                <a id="webstore-link" class="icon-link webstore-badge-link" href="https://chromewebstore.google.com/detail/minimal-new-tab/hdodpjlgcieifmkkidligdnonbfiijnd" target="_blank" rel="noopener noreferrer" aria-label="Chrome Web Store">
                    <img id="webstore-img" src="../../assets/favicons/chromewebstore-light.png" alt="Chrome Web Store" class="webstore-badge">
                </a>
            </div>
            <div class="tooltip-wrapper" data-tooltip="View source on GitHub">
                <a id="github-link" class="icon-link" href="https://github.com/ujain1999/minimal_newtab" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                    <img id="github-img" src="../../assets/favicons/github-light.png" alt="GitHub">
                </a>
            </div>
        </div>
    `;

    populateVersion();
    setupEasterEgg();
    setupThemeSync();
}

function populateVersion() {
    const versionEl = document.getElementById("extension-version");
    if (!versionEl) return;

    try {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest) {
            const manifest = chrome.runtime.getManifest();
            if (manifest && manifest.version) {
                versionEl.textContent = manifest.version;
                return;
            }
        }
    } catch {}

    fetch("manifest.json")
        .then((r) => r.json())
        .then((m) => {
            if (m && m.version) versionEl.textContent = m.version;
        })
        .catch(() => {
            versionEl.textContent = "Unknown";
        });
}

function setupEasterEgg() {
    const CLICK_TARGET = 10;
    let clickCount = 0;
    const logo = document.getElementById("about-logo");
    const title = document.getElementById("about-title");

    const increment = () => {
        clickCount++;
        if (clickCount >= CLICK_TARGET) {
            if (typeof chrome !== "undefined" && chrome.tabs) {
                chrome.tabs.create({
                    url: "https://music.youtube.com/playlist?list=PLK_7F5FZ-_UQvmcztt2X7qMYOSGIH31Hc&si=BwTs_LOMzIQskPP7",
                });
            }
            clickCount = 0;
        }
    };

    [logo, title].forEach((el) => {
        if (!el) return;
        el.addEventListener("click", increment);
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                increment();
            }
        });
    });
}

function setupThemeSync() {
    const theme = localStorage.getItem("theme") || "system";
    updateIcons(theme);

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        const current = localStorage.getItem("theme") || "system";
        if (current === "system") updateIcons("system");
    });
}

function updateIcons(theme) {
    let effective = theme;
    if (theme === "system") {
        effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    const webstoreImg = document.getElementById("webstore-img");
    const githubImg = document.getElementById("github-img");
    if (webstoreImg) {
        webstoreImg.src = `../../assets/favicons/chromewebstore-${effective}.png`;
    }
    if (githubImg) {
        githubImg.src = `../../assets/favicons/github-${effective}.png`;
    }
}

export function collect() {
    return {};
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-about [data-setting]");
}
