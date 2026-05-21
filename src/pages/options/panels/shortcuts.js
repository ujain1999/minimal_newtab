export function render(container, settings) {
    const order = settings.topRightOrder || [];

    container.innerHTML = `
        <h2>Shortcuts</h2>
        <label class="checkbox-label" data-setting="topRight">
            <input type="checkbox" id="show-topRight" ${settings.topRight ? "checked" : ""}>
            <span class="custom-checkbox"></span> Show Top-Right Shortcuts
        </label>
        <div id="shortcuts-links" class="sub-settings ${settings.topRight ? "" : "disabled"}">
            <p>Customize which shortcut links are displayed and in what order.</p>
            <table class="options-table" id="top-right-links">
                <thead>
                    <tr>
                        <th>Show</th>
                        <th>Link</th>
                        <th class="drag-handle-header">Order</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.map((item) => `
                        <tr draggable="true">
                            <td>
                                <label class="checkbox-label">
                                    <input type="checkbox" data-key="${item.id}" ${item.displayBool ? "checked" : ""}>
                                    <span class="custom-checkbox"></span>
                                </label>
                            </td>
                            <td>${item.id}</td>
                            <td class="drag-handle"><span>☰</span></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    setupEventListeners(container);
    setupDragAndDrop(container);
}

function setupEventListeners(container) {
    container.querySelector("#show-topRight").addEventListener("change", (e) => {
        container.querySelector("#shortcuts-links").classList.toggle("disabled", !e.target.checked);
    });
}

function setupDragAndDrop(container) {
    const tbody = container.querySelector("#top-right-links tbody");
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
    const tbody = document.querySelector("#top-right-links tbody");
    const rows = tbody ? Array.from(tbody.children) : [];
    const orderArr = rows.map((tr) => {
        const checkbox = tr.querySelector("td input");
        const id = checkbox.getAttribute("data-key");
        return {
            id,
            displayBool: checkbox.checked,
            url: id === "passwords" ? "chrome://password-manager/passwords" : `chrome://${id}`,
        };
    });

    return {
        topRight: document.getElementById("show-topRight").checked,
        topRightOrder: orderArr,
    };
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-shortcuts [data-setting]");
}
