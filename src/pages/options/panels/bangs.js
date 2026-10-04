import { BANGS } from "../../../components/bangs/bangs.js";

const EDIT_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;

let selectedBangs = [];
let customBangs = [];
let editedBangs = {};
let editingBangTrigger = null;

export function render(container, settings) {
    selectedBangs = Array.isArray(settings.selectedBangs) ? [...settings.selectedBangs] : BANGS.map((b) => b.trigger);
    customBangs = Array.isArray(settings.customBangs) ? settings.customBangs.map((b) => ({ ...b })) : [];
    editedBangs = { ...(settings.editedBangs || {}) };

    container.innerHTML = `
        <h2>Bang Search</h2>
        <p style="font-size:0.9em;opacity:0.7;margin-bottom:1.5em;">
            Customize which bangs are available and add your own. Bangs let you search directly on a site using
            <code>!trigger query</code> (e.g. <code>!g react hooks</code>).
        </p>

        <h3 data-setting="selectedBangs">Built-in Bangs</h3>
        <p style="font-size:0.85em;opacity:0.6;margin-bottom:1em;">
            Uncheck a bang to disable it.
        </p>
        <div class="table-scroll">
            <table class="options-table" id="builtin-bangs-table">
                <thead>
                    <tr>
                        <th>Use</th>
                        <th>Trigger</th>
                        <th>Site</th>
                        <th>Domain</th>
                        <th style="width:60px;"></th>
                    </tr>
                </thead>
                <tbody id="builtin-bangs-tbody"></tbody>
            </table>
        </div>

        <div id="edit-bang-modal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="edit-bang-modal-title">
            <div class="modal-content">
                <h3 id="edit-bang-modal-title">Edit Bang: <span id="edit-bang-modal-trigger"></span></h3>
                <div class="setting-row">
                    <label for="edit-bang-domain" style="min-width:100px;">Domain:</label>
                    <input class="text-input" type="text" id="edit-bang-domain" placeholder="e.g. google.com" style="flex:1;">
                </div>
                <div class="setting-row">
                    <label for="edit-bang-search-url" style="min-width:100px;">Search URL:</label>
                    <input class="text-input" type="text" id="edit-bang-search-url" placeholder="https://..." style="flex:1;">
                </div>
                <div class="setting-row">
                    <label for="edit-bang-home-url" style="min-width:100px;">Home URL:</label>
                    <input class="text-input" type="text" id="edit-bang-home-url" placeholder="https://..." style="flex:1;">
                </div>
                <div class="setting-row" style="justify-content:flex-end;gap:0.5em;margin-top:1em;">
                    <button id="edit-bang-cancel" class="ghost-button">Cancel</button>
                    <button id="edit-bang-save" class="ghost-button">Save</button>
                </div>
                <span id="edit-bang-error" style="color:#f44336;font-size:0.9em;display:none;"></span>
            </div>
        </div>

        <h3 style="margin-top:2em;" data-setting="customBangs">Custom Bangs</h3>
        <p style="font-size:0.85em;opacity:0.6;margin-bottom:1em;">
            Add your own bang shortcuts. Use <code>{query}</code> in the search URL where the search term should go.
        </p>

        <div id="custom-bangs-list" class="table-scroll">
            <table class="options-table" id="custom-bangs-table">
                <thead>
                    <tr>
                        <th>Trigger</th>
                        <th>Name</th>
                        <th>Domain</th>
                        <th style="width:60px;"></th>
                    </tr>
                </thead>
                <tbody id="custom-bangs-tbody"></tbody>
            </table>
        </div>

        <div id="custom-bang-form" style="margin-top:1.5em;padding:1em;background:rgba(128,128,128,0.08);border-radius:8px;">
            <div class="setting-row">
                <label for="custom-bang-trigger" style="min-width:100px;">Trigger:</label>
                <input class="text-input" type="text" id="custom-bang-trigger" placeholder="e.g. rd" style="width:150px;">
            </div>
            <div class="setting-row">
                <label for="custom-bang-name" style="min-width:100px;">Name:</label>
                <input class="text-input" type="text" id="custom-bang-name" placeholder="e.g. Reddit" style="width:250px;">
            </div>
            <div class="setting-row">
                <label for="custom-bang-domain" style="min-width:100px;">Domain:</label>
                <input class="text-input" type="text" id="custom-bang-domain" placeholder="e.g. reddit.com" style="width:250px;">
            </div>
            <div class="setting-row">
                <label for="custom-bang-search-url" style="min-width:100px;">Search URL:</label>
                <input class="text-input" type="text" id="custom-bang-search-url" placeholder="e.g. https://www.reddit.com/search?q={query}" style="flex:1;">
            </div>
            <div class="setting-row">
                <label for="custom-bang-home-url" style="min-width:100px;">Home URL:</label>
                <input class="text-input" type="text" id="custom-bang-home-url" placeholder="e.g. https://www.reddit.com" style="flex:1;">
            </div>
            <button id="add-custom-bang-btn" class="ghost-button" style="margin-top:0.5em;">Add Bang</button>
            <span id="custom-bang-error" style="color:#f44336;margin-left:1em;font-size:0.9em;display:none;"></span>
        </div>
    `;

    renderBuiltinBangs(container);
    renderCustomBangs(container);
    setupEventListeners(container);
}

function renderBuiltinBangs(container) {
    const tbody = container.querySelector("#builtin-bangs-tbody");
    tbody.innerHTML = "";
    BANGS.forEach((b) => {
        const edits = editedBangs[b.trigger] || {};
        const tr = document.createElement("tr");

        const td1 = document.createElement("td");
        const label = document.createElement("label");
        label.className = "checkbox-label";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.dataset.bangTrigger = b.trigger;
        cb.checked = selectedBangs.includes(b.trigger);
        cb.addEventListener("change", () => {
            selectedBangs = cb.checked
                ? [...selectedBangs, b.trigger]
                : selectedBangs.filter((t) => t !== b.trigger);
        });
        label.innerHTML = '<span class="custom-checkbox"></span>';
        label.prepend(cb);
        td1.appendChild(label);

        const td2 = document.createElement("td");
        td2.textContent = "!" + b.trigger;
        const td3 = document.createElement("td");
        td3.textContent = b.name;
        const td4 = document.createElement("td");
        td4.textContent = edits.domain || b.domain;
        td4.title = "Search: " + (edits.searchUrl || b.searchUrl) + "\nHome: " + (edits.homeUrl || b.homeUrl);

        const td5 = document.createElement("td");
        const editBtn = document.createElement("button");
        editBtn.className = "edit-bang-btn";
        editBtn.title = "Edit this bang";
        editBtn.setAttribute("aria-label", `Edit !${b.trigger}`);
        editBtn.innerHTML = EDIT_ICON;
        editBtn.addEventListener("click", () => openEditModal(container, b, edits));
        td5.appendChild(editBtn);

        tr.append(td1, td2, td3, td4, td5);
        tbody.appendChild(tr);
    });
}

function renderCustomBangs(container) {
    const tbody = container.querySelector("#custom-bangs-tbody");
    tbody.innerHTML = "";
    customBangs.forEach((b, i) => {
        const tr = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.textContent = "!" + b.trigger;
        const td2 = document.createElement("td");
        td2.textContent = b.name;
        const td3 = document.createElement("td");
        td3.textContent = b.domain;
        const td4 = document.createElement("td");
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-bang-btn";
        removeBtn.textContent = "×";
        removeBtn.title = "Remove this bang";
        removeBtn.setAttribute("aria-label", `Remove !${b.trigger}`);
        removeBtn.addEventListener("click", () => {
            customBangs.splice(i, 1);
            renderCustomBangs(container);
        });
        td4.appendChild(removeBtn);
        tr.append(td1, td2, td3, td4);
        tbody.appendChild(tr);
    });
}

function openEditModal(container, bang, edits) {
    editingBangTrigger = bang.trigger;
    container.querySelector("#edit-bang-modal-trigger").textContent = "!" + bang.trigger;
    container.querySelector("#edit-bang-domain").value = edits.domain || bang.domain;
    container.querySelector("#edit-bang-search-url").value = edits.searchUrl || bang.searchUrl;
    container.querySelector("#edit-bang-home-url").value = edits.homeUrl || bang.homeUrl;
    container.querySelector("#edit-bang-error").style.display = "none";
    container.querySelector("#edit-bang-modal").classList.remove("hidden");
    container.querySelector("#edit-bang-domain").focus();
}

function closeEditModal() {
    document.getElementById("edit-bang-modal")?.classList.add("hidden");
    editingBangTrigger = null;
}

// Returns true if a dialog was open and has been closed (lets Escape close it instead of leaving the page).
export function closeOpenModal() {
    const modal = document.getElementById("edit-bang-modal");
    if (!modal || modal.classList.contains("hidden")) return false;
    closeEditModal();
    return true;
}

function setupEventListeners(container) {
    const modal = container.querySelector("#edit-bang-modal");
    container.querySelector("#edit-bang-cancel").addEventListener("click", closeEditModal);
    modal.addEventListener("click", (e) => {
        if (e.target === e.currentTarget) closeEditModal();
    });

    container.querySelector("#edit-bang-save").addEventListener("click", () => {
        const trigger = editingBangTrigger;
        if (!trigger) return;

        const domain = container.querySelector("#edit-bang-domain").value.trim();
        const searchUrl = container.querySelector("#edit-bang-search-url").value.trim();
        const homeUrl = container.querySelector("#edit-bang-home-url").value.trim();
        const errorEl = container.querySelector("#edit-bang-error");

        if (!domain || !searchUrl || !homeUrl) {
            errorEl.textContent = "All fields are required.";
            errorEl.style.display = "block";
            return;
        }

        if (!searchUrl.includes("{query}")) {
            errorEl.textContent = "Search URL must contain {query}.";
            errorEl.style.display = "block";
            return;
        }

        errorEl.style.display = "none";
        editedBangs[trigger] = { domain, searchUrl, homeUrl };
        closeEditModal();
        renderBuiltinBangs(container);
    });

    container.querySelector("#add-custom-bang-btn").addEventListener("click", () => {
        const fields = ["trigger", "name", "domain", "search-url", "home-url"].map((f) =>
            container.querySelector(`#custom-bang-${f}`),
        );
        const [trigger, name, domain, searchUrl, homeUrl] = fields.map((el) => el.value.trim());
        const errorEl = container.querySelector("#custom-bang-error");

        if (!trigger || !name || !domain || !searchUrl || !homeUrl) {
            errorEl.textContent = "All fields are required.";
            errorEl.style.display = "inline";
            return;
        }

        if (BANGS.some((b) => b.trigger === trigger) || customBangs.some((b) => b.trigger === trigger)) {
            errorEl.textContent = "A bang with this trigger already exists.";
            errorEl.style.display = "inline";
            return;
        }

        if (!searchUrl.includes("{query}")) {
            errorEl.textContent = "Search URL must contain {query}.";
            errorEl.style.display = "inline";
            return;
        }

        errorEl.style.display = "none";
        customBangs.push({ trigger, name, domain, searchUrl, homeUrl });
        fields.forEach((el) => (el.value = ""));
        renderCustomBangs(container);
    });
}

export function collect() {
    // Keep the built-in order regardless of the order boxes were toggled in.
    const triggers = BANGS.map((b) => b.trigger).filter((t) => selectedBangs.includes(t));
    return {
        selectedBangs: triggers,
        customBangs,
        editedBangs,
    };
}

export function getSettingElements() {
    return document.querySelectorAll("#panel-bangs [data-setting]");
}
