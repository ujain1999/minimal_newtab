export function createSearchBar() {
    const container = document.createElement("div");
    container.className = "search-container";
    const input = document.createElement("input");
    input.type = "text";
    input.id = "settings-search";
    input.placeholder = "Search settings\u2026";
    container.appendChild(input);
    return container;
}

export function setupSearch() {
    const input = document.getElementById("settings-search");
    if (!input) return;

    input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        filterPanels(query);
    });
}

function filterPanels(query) {
    const panels = document.querySelectorAll(".options-panel");

    if (!query) {
        panels.forEach((p) => (p.style.display = ""));
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
