(function () {
  "use strict";

  const OVERLAY_ID = "quick-command-overlay";
  const CONTAINER_ID = "quick-command-container";
  const INPUT_ID = "quick-command-input";

  let overlayElement = null;
  let inputElement = null;

  function focusInput() {
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  }

  function ensureFocus() {
    if (document.activeElement !== inputElement) {
      setTimeout(() => focusInput(), 10);
    }
  }

  function createOverlay() {
    if (overlayElement) return;

    overlayElement = document.createElement("div");
    overlayElement.id = OVERLAY_ID;
    overlayElement.innerHTML = `
      <div id="${CONTAINER_ID}">
        <input type="text" id="${INPUT_ID}" placeholder="Type a command..." autofocus />
        <div class="quick-command-hint">Press Esc to close</div>
      </div>
    `;

    document.body.appendChild(overlayElement);

    inputElement = document.getElementById(INPUT_ID);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ensureFocus());
    });

    overlayElement.addEventListener("click", (e) => {
      if (e.target === overlayElement) {
        hideOverlay();
      }
    });

    document.addEventListener("keydown", handleKeydown);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      hideOverlay();
    }
  }

  function showOverlay() {
    createOverlay();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ensureFocus());
    });
  }

  function hideOverlay() {
    if (overlayElement) {
      overlayElement.remove();
      overlayElement = null;
      inputElement = null;
    }
    document.removeEventListener("keydown", handleKeydown);
    chrome.runtime.sendMessage({ action: "overlayHidden" });
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "showOverlay") {
      // Check if keyboard navigation is enabled
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      if (!settings.enableKeyboardNav) {
        return; // Disabled, ignore the command
      }
      showOverlay();
    } else if (message.action === "hideOverlay") {
      hideOverlay();
    }
  });
})();
