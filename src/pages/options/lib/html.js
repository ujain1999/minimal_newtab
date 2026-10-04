// Escapes a value for interpolation into the panel HTML templates (text or attribute context),
// so user-provided settings (custom CSS/SVG, city, API key) round-trip exactly.
export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
