let overlayVisible = false;

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-overlay") {
    toggleOverlay();
  }
});

async function toggleOverlay() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (overlayVisible) {
    chrome.tabs.sendMessage(tab.id, { action: "hideOverlay" });
    overlayVisible = false;
  } else {
    chrome.tabs.sendMessage(tab.id, { action: "showOverlay" });
    overlayVisible = true;
  }
}

chrome.tabs.onRemoved.addListener(() => {
  overlayVisible = false;
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "overlayHidden") {
    overlayVisible = false;
  }
});