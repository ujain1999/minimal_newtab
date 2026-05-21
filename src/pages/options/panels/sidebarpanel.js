export function render(container, settings) {
    const allWidgets = Array.isArray(settings.availableWidgets) ? settings.availableWidgets : ["calendar", "todo"];
    const enabledWidgets = Array.isArray(settings.sidebarWidgets) ? settings.sidebarWidgets : [];
    const enabledSet = new Set(enabledWidgets);
    const sorted = [...enabledWidgets, ...allWidgets.filter((w) => !enabledSet.has(w))];

    container.innerHTML = `
        <h2>Sidebar</h2>
        <label class="checkbox-label" data-setting="sidebar">
            <input type="checkbox" id="show-sidebar" ${settings.sidebar ? "checked" : ""}>
            <span class="custom-checkbox"></span> Show Sidebar
        </label>
        <div id="sidebar-options" class="sub-settings ${settings.sidebar ? "" : "disabled"}">
            <div class="setting-row segmented-control-container">
                <label>Sidebar Position:</label>
                <div class="segmented-control">
                    <label><input type="radio" name="sidebar-position" value="left" ${settings.sidebarPosition === "left" ? "checked" : ""}><span>Left</span></label>
                    <label><input type="radio" name="sidebar-position" value="right" ${settings.sidebarPosition === "right" ? "checked" : ""}><span>Right</span></label>
                </div>
            </div>
            <div class="sub-settings">
                <label>Widgets (drag to reorder):</label>
                <table class="options-table" id="sidebar-widgets-table">
                    <thead>
                        <tr>
                            <th>Show</th>
                            <th>Widget</th>
                            <th class="drag-handle-header">Order</th>
                        </tr>
                    </thead>
                    <tbody id="sidebar-widgets" class="reorder-list">
                        ${sorted.map((w) => `
                            <tr draggable="true">
                                <td>
                                    <label class="checkbox-label">
                                        <input type="checkbox" data-widget="${w}" ${enabledSet.has(w) ? "checked" : ""}>
                                        <span class="custom-checkbox"></span>
                                    </label>
                                </td>
                                <td>${w.charAt(0).toUpperCase() + w.slice(1)}</td>
                                <td class="drag-handle"><span>☰</span></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
            <br>
            <div class="setting-row">
                <div class="tooltip-wrapper" id="sidebar-show-customize-wrapper" data-tooltip="This is required while 'Keep sidebar expanded' is enabled.">
                    <label class="checkbox-label" data-setting="sidebarShowCustomize">
                        <input type="checkbox" id="sidebar-show-customize" ${settings.sidebarShowCustomize ? "checked" : ""} ${settings.sidebarExpanded ? "disabled" : ""}>
                        <span class="custom-checkbox"></span> Show Customize button in sidebar
                    </label>
                </div>
            </div>
            <div class="setting-row">
                <label class="checkbox-label" data-setting="sidebarExpanded">
                    <input type="checkbox" id="sidebar-expanded-check" ${settings.sidebarExpanded ? "checked" : ""}>
                    <span class="custom-checkbox"></span> Keep sidebar expanded
                </label>
            </div>
        </div>
    `;

    setupEventListeners(container);
    setupDragAndDrop(container);

    updateCustomizeDependency(container);
}

function setupEventListeners(container) {
    container.querySelector("#show-sidebar").addEventListener("change", (e) => {
        container.querySelector("#sidebar-options").classList.toggle("disabled", !e.target.checked);
    });

    container.querySelector("#sidebar-expanded-check").addEventListener("change", () => {
        updateCustomizeDependency(container);
    });
}

function updateCustomizeDependency(container) {
    const expanded = container.querySelector("#sidebar-expanded-check").checked;
    const customizeCheck = container.querySelector("#sidebar-show-customize");
    const wrapper = container.querySelector("#sidebar-show-customize-wrapper");

    if (expanded) {
        customizeCheck.checked = true;
        customizeCheck.disabled = true;
        wrapper.classList.add("disabled");
    } else {
        customizeCheck.disabled = false;
        wrapper.classList.remove("disabled");
    }
}

function setupDragAndDrop(container) {
    const tbody = container.querySelector("#sidebar-widgets");
    if (!tbody) return;

    let draggingRow = null;

    tbody.addEventListener("dragstart", (e) => {
        const row = e.target.closest("tr");
        if (row) {
            draggingRow = row;
            e.dataTransfer.effectAllowed = "move";
            row.classList.add("dragging");
        }
    });

    tbody.addEventListener("dragend", () => {
        if (draggingRow) {
            draggingRow.classList.remove("dragging");
            draggingRow = null;
        }
    });

    tbody.addEventListener("dragover", (e) => {
        e.preventDefault();
        const targetRow = e.target.closest("tr");
        if (targetRow && targetRow !== draggingRow) {
            const rect = targetRow.getBoundingClientRect();
            const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            tbody.insertBefore(draggingRow, (next && targetRow.nextSibling) || targetRow);
        }
    });

    tbody.addEventListener("drop", (e) => e.preventDefault());
}

export function collect() {
    const expanded = document.getElementById("sidebar-expanded-check").checked;

    const widgetRows = document.querySelectorAll("#sidebar-widgets tr");
    const selectedWidgets = [];
    widgetRows.forEach((row) => {
        selectedWidgets.push(row.querySelector("input").getAttribute("data-widget"));
    });

    const sortedWidgets = [];
    widgetRows.forEach((row) => {
        const cb = row.querySelector("input");
        if (cb.checked) {
            sortedWidgets.push(cb.getAttribute("data-widget"));
        }
    });

    return {
        sidebar: document.getElementById("show-sidebar").checked,
        sidebarPosition: document.querySelector('input[name="sidebar-position"]:checked')?.value || "right",
        sidebarWidgets: sortedWidgets,
        sidebarExpanded: expanded,
        sidebarShowCustomize: expanded ? true : document.getElementById("sidebar-show-customize").checked,
        availableWidgets: selectedWidgets,
    };
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-sidebar [data-setting]");
}
