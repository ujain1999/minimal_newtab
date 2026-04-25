const settings =
  JSON.parse(localStorage.getItem("settings")) || defaultSettings;

document.body.style.backgroundColor = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches
  ? "#121212"
  : "#f0f0f0";
