// Classic script loaded in <head> (extension CSP forbids inline scripts). Applies the saved theme
// before the first paint: on <html> immediately (page background) and on <body> as soon as the
// parser creates it, so nothing ever renders unthemed. The options shell itself stays hidden
// (see css/base.css) until options.js has rendered every panel and adds the "ready" class.
(function () {
    let theme = "system";
    try {
        theme = localStorage.getItem("theme") || "system";
    } catch {}
    if (theme !== "dark" && theme !== "light") {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    const root = document.documentElement;
    root.classList.add(theme);

    const applyToBody = () => document.body.classList.add(theme);
    if (document.body) {
        applyToBody();
    } else {
        new MutationObserver((_, observer) => {
            if (document.body) {
                applyToBody();
                observer.disconnect();
            }
        }).observe(root, { childList: true });
    }
})();
