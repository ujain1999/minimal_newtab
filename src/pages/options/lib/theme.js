// Applies a theme ("system" | "dark" | "light") to the page; mirrors lib/theme-init.js.
export function applyTheme(theme) {
    let effective = theme;
    if (theme !== "dark" && theme !== "light") {
        effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    for (const el of [document.documentElement, document.body]) {
        el.classList.remove("dark", "light");
        el.classList.add(effective);
    }
}
