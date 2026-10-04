export class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentPanel = null;
        this.onNavigate = null;

        window.addEventListener("hashchange", () => this.resolve());
    }

    resolve() {
        const hash = location.hash.slice(1) || this.routes[0]?.id || "";
        const parts = hash.split("/");
        const panelId = parts[0];
        const settingId = parts[1] || null;

        const route = this.routes.find((r) => r.id === panelId);
        if (!route && this.routes.length > 0) {
            return this.navigate(this.routes[0].id);
        }

        if (this.currentPanel !== panelId) {
            if (this.onNavigate) {
                this.onNavigate(panelId, settingId);
            }
            this.currentPanel = panelId;
        }

        return { panelId, settingId };
    }

    navigate(panelId, settingId) {
        const path = settingId ? `${panelId}/${settingId}` : panelId;
        location.hash = `#${path}`;
    }

    getPanelId() {
        const hash = location.hash.slice(1);
        return hash.split("/")[0] || this.routes[0]?.id || "";
    }

    getSettingId() {
        const hash = location.hash.slice(1);
        const parts = hash.split("/");
        return parts[1] || null;
    }

    start() {
        this.resolve();
    }
}
