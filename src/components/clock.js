function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${mins}`;
}

function renderClock() {
    updateClock();
    setInterval(updateClock, 1000); 
}

export { renderClock };