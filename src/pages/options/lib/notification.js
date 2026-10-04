let container = null;

function ensureContainer() {
    if (!container) {
        container = document.getElementById("notification");
    }
    return container;
}

export function showNotification(message, duration = 2000, type = "success", reload = false) {
    const el = ensureContainer();
    if (!el) return;

    el.textContent = message;
    el.className = "hidden";
    el.classList.add(type);
    el.classList.remove("hidden");
    el.classList.add("show");

    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => {
            el.classList.add("hidden");
            if (reload) location.reload();
        }, 500);
    }, duration);
}
