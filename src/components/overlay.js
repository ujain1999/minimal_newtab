(function () {
  "use strict";

  const INPUT_ID = "quick-command-input";
  const SELECTED_CLASS = "selected";
  const NUMBER_HINT_CLASS = "number-hint";

  let inputElement = null;
  let currentIndex = -1;
  let currentItem = null;
  let allItems = [];
  let numberBuffer = "";
  let isActive = false;

  function getAllItems() {
    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return [];
    return Array.from(shortcuts.querySelectorAll("a.shortcut")).filter((item) => {
      let parent = item.parentElement;
      while (parent && parent !== shortcuts) {
        if (parent.classList.contains("collapsed")) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    });
  }

  function getNavigationItems() {
    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return [];

    const items = [];
    const seen = new Set();

    function walk(node) {
      if (!node) return;
      if (node.classList?.contains("collapsed")) return;
      
      if (node.tagName === "BUTTON" && node.classList.contains("bookmark-folder")) {
        if (!seen.has(node)) {
          items.push(node);
          seen.add(node);
        }
      } else if (node.tagName === "A" && node.classList.contains("shortcut")) {
        if (!seen.has(node)) {
          items.push(node);
          seen.add(node);
        }
      }
      
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        walk(children[i]);
      }
    }

    walk(shortcuts);
    return items;
  }

  function updateSelection() {
    const navItems = getNavigationItems();
    navItems.forEach((item, index) => {
      if (index === currentIndex) {
        item.classList.add(SELECTED_CLASS);
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        currentItem = item;
      } else {
        item.classList.remove(SELECTED_CLASS);
      }
    });
  }

  function clearSelection() {
    currentIndex = -1;
    currentItem = null;
    allItems.forEach((item) => item.classList.remove(SELECTED_CLASS));
  }

  function renderNumberHints() {
    clearNumberHints();
    allItems = getAllItems();
    allItems.slice(0, 10).forEach((item, index) => {
      const hint = document.createElement("span");
      hint.className = NUMBER_HINT_CLASS;
      hint.textContent = index === 9 ? "0" : (index + 1).toString();
      item.appendChild(hint);
    });
  }

  function setupFolderListeners() {
    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return;

    shortcuts.querySelectorAll("button.bookmark-folder").forEach((folder) => {
      folder.addEventListener("click", () => {
        setTimeout(() => {
          if (isActive) {
            renderNumberHints();
          }
          if (currentItem) {
            currentItem.classList.add(SELECTED_CLASS);
            currentItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        }, 10);
      });
    });
  }

  function clearNumberHints() {
    document.querySelectorAll(`.${NUMBER_HINT_CLASS}`).forEach((el) => el.remove());
  }

function navigateByNumber(num) {
    const index = num === "0" ? 9 : parseInt(num, 10) - 1;
    if (index >= 0 && index < allItems.length && allItems[index]) {
      allItems[index].click();
    }
  }

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

  function createInput() {
    if (inputElement) return;

    inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.id = INPUT_ID;
    inputElement.placeholder = "Type a command...";
    inputElement.autofocus = true;

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts) {
      shortcuts.insertBefore(inputElement, shortcuts.firstChild);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ensureFocus());
    });
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      hideOverlay();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter" && numberBuffer.length > 0) {
      e.preventDefault();
      navigateByNumber(numberBuffer);
      numberBuffer = "";
      if (inputElement) inputElement.value = "";
    } else if (e.key === "Enter" && currentIndex >= 0) {
      const navItems = getNavigationItems();
      e.preventDefault();
      navItems[currentIndex]?.click();
    } else if (e.key >= "0" && e.key <= "9" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (document.activeElement === inputElement) {
        e.preventDefault();
        numberBuffer += e.key;
        if (inputElement) inputElement.value = numberBuffer;
      }
    }
  }

  function moveSelection(direction) {
    const navItems = getNavigationItems();

    if (currentItem && navItems.includes(currentItem)) {
      currentIndex = navItems.indexOf(currentItem);
    }

    if (currentIndex === -1) {
      currentIndex = direction === 1 ? 0 : navItems.length - 1;
    } else {
      currentIndex = currentIndex + direction;
      if (currentIndex < 0) {
        currentIndex = navItems.length - 1;
      } else if (currentIndex >= navItems.length) {
        currentIndex = 0;
      }
    }
    currentItem = navItems[currentIndex];
    updateSelection();
  }

  function showOverlay() {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    if (!settings.enableKeyboardNav) {
      return;
    }
    isActive = true;
    createInput();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ensureFocus());
    });
    document.addEventListener("keydown", handleKeydown);

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts) {
      shortcuts.classList.add("command-mode");
    }

    allItems = getAllItems();
    renderNumberHints();
    setupFolderListeners();
  }

  function hideOverlay() {
    isActive = false;
    clearSelection();
    clearNumberHints();
    numberBuffer = "";

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts) {
      shortcuts.classList.remove("command-mode");
      shortcuts.querySelectorAll("." + SELECTED_CLASS).forEach((el) => {
        el.classList.remove(SELECTED_CLASS);
      });
    }

    if (inputElement) {
      inputElement.remove();
      inputElement = null;
    }
    document.removeEventListener("keydown", handleKeydown);

    chrome.runtime.sendMessage({ action: "overlayHidden" });
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "showOverlay") {
      showOverlay();
    } else if (message.action === "hideOverlay") {
      hideOverlay();
    }
  });
})();
