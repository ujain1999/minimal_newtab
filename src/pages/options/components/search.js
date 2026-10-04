export function setupSearch() {
    const input = document.getElementById("settings-search");
    if (!input) return;

    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        filterPanels(query);
    });
}

function setEmptyMessage(query) {
    let el = document.getElementById("search-empty");
    if (!query) {
        el?.remove();
        return;
    }
    if (!el) {
        el = document.createElement("p");
        el.id = "search-empty";
        el.style.opacity = "0.6";
        document.querySelector(".options-content").prepend(el);
    }
    el.textContent = `No settings match "${query}".`;
}

function filterPanels(query) {
    const panels = document.querySelectorAll(".options-panel");

    if (!query) {
        panels.forEach((p) => (p.style.display = ""));
        setEmptyMessage("");
        return;
    }

    let firstMatch = null;

    panels.forEach((panel) => {
        const text = panel.textContent.toLowerCase();
        if (text.includes(query)) {
            panel.style.display = "block";
            if (!firstMatch) firstMatch = panel;
        } else {
            panel.style.display = "none";
        }
    });

    setEmptyMessage(firstMatch ? "" : query);

    if (firstMatch) {
        const active = document.querySelector(".options-panel.active");
        if (active && active.style.display === "none") {
            active.classList.remove("active");
            firstMatch.classList.add("active");
            const navLinks = document.querySelectorAll(".options-sidebar nav a");
            navLinks.forEach((link) => {
                const id = link.dataset.panel;
                link.classList.toggle("active", id === firstMatch.id.replace("panel-", ""));
            });
        }
    }
}
