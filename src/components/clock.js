function updateClock() {
  const now = new Date();
  const mins = String(now.getMinutes()).padStart(2, '0');
  // Read clock format from settings; default to 24h if missing
  let clockFormat = "24h";
  try {
    const settingsStr = localStorage.getItem("settings");
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      clockFormat = settings.clockFormat || "24h";
    }
  } catch {
    clockFormat = "24h";
  }

  if (clockFormat === "12h") {
    const hours24 = now.getHours();
    const isPM = hours24 >= 12;
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    const meridiem = isPM ? "PM" : "AM";
    document.getElementById('clock').innerHTML = `${String(hours12)}:${mins}<span class=\"ampm\">${meridiem}</span>`;
  } else {
    const hours = String(now.getHours()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${mins}`;
  }
}

function renderClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

export { renderClock };
