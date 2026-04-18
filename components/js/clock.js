function updateClock() {
    const now = new Date();
    const settings = JSON.parse(localStorage.getItem("settings")) || {};
    let use12Hour = settings.use12HourClock;

    if (use12Hour === undefined || use12Hour === null) {
        use12Hour = Intl.DateTimeFormat([], { hour: 'numeric', hour12: true }).resolvedOptions().hour12 === true;
    }

    let hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');

    if (use12Hour) {
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        document.getElementById('clock').textContent = `${hours}:${mins} ${period}`;
    } else {
        hours = String(hours).padStart(2, '0');
        document.getElementById('clock').textContent = `${hours}:${mins}`;
    }
}

function renderClock() {
    loadStylesheet('components/css/clock.css');
    updateClock();
    setInterval(updateClock, 1000);
}

export { renderClock };