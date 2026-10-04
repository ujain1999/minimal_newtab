import { state, INPUT_ID, SELECTED_CLASS, SEARCH_MODE_CLASS, focusInput, ensureFocus } from "./overlay-state.js";
import { parseBangInput, getBangSearchUrl, getDefaultSearchUrl, renderBangSuggestions, insertBangAndFocus } from "../bangs/bangs.js";
import { renderSearchResults, enterSearchMode, exitSearchMode } from "../search/search.js";
import { getAllItems, getNavigationItems, renderNumberHints, clearSelection, clearNumberHints, moveSelection, navigateByNumber, setupFolderListeners } from "../navigation/navigation.js";

(function () {
  "use strict";

  (function initModifierKey() {
    if (typeof chrome !== 'undefined' && chrome.commands && chrome.commands.getAll) {
      chrome.commands.getAll((commands) => {
        const cmd = commands.find(c => c.name === "toggle-overlay");
        if (cmd && cmd.shortcut) {
          if (cmd.shortcut.includes("Alt") || cmd.shortcut.includes("⌥")) {
            state.modifierKey = "Alt";
          } else if (cmd.shortcut.includes("Ctrl") || cmd.shortcut.includes("⌃")) {
            state.modifierKey = "Control";
          } else if (cmd.shortcut.includes("Meta") || cmd.shortcut.includes("⌘") || cmd.shortcut.includes("Command")) {
            state.modifierKey = "Meta";
          }
        }
        if (!state.modifierKey) state.modifierKey = "Alt";
      });
    } else {
      state.modifierKey = "Alt";
    }
  })();

  function openLink(url) {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    if (settings.openInNewTab) {
      chrome.tabs.create({ url: url });
    } else {
      window.location.href = url;
    }
  }

  function createInput() {
    if (state.inputElement) return;

    state.inputElement = document.createElement("input");
    state.inputElement.type = "text";
    state.inputElement.id = INPUT_ID;
    state.inputElement.placeholder = "Search your bookmarks...";
    state.inputElement.autofocus = true;

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts) {
      shortcuts.insertBefore(state.inputElement, shortcuts.firstChild);
    }

    state.inputElement.addEventListener("input", (e) => {
      const value = e.target.value;
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      const enableBangs = settings.enableBangs !== false;
      let bangInfo = parseBangInput(value);

      if (!enableBangs) bangInfo = null;

      if (bangInfo && bangInfo.bang && bangInfo.hasSpace) {
        state.inputElement.placeholder = `Search ${bangInfo.bang.name}...`;
      } else if (enableBangs && value.startsWith("!")) {
        state.inputElement.placeholder = "Type a search query or select a bang below";
      } else {
        state.inputElement.placeholder = "Search your bookmarks...";
      }

      if (value.length > 0) {
        enterSearchMode();
        clearTimeout(state.debounceTimer);
        state.currentIndex = -1;
        state.currentItem = null;

        if (bangInfo && !bangInfo.hasSpace) {
          state.isBangMode = true;
          renderBangSuggestions(bangInfo.trigger);
        } else {
          state.isBangMode = false;
          state.debounceTimer = setTimeout(() => {
            renderSearchResults(value, bangInfo);
          }, 100);
        }
      } else {
        clearTimeout(state.debounceTimer);
        state.isBangMode = false;
        state.currentBangSuggestions = [];
        exitSearchMode();
        state.currentIndex = -1;
        state.currentItem = null;
      }
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ensureFocus());
    });
  }

  function handleKeydown(e) {
    if (state.modifierKey && e.code.startsWith("Digit")) {
      const modPressed =
        (state.modifierKey === "Alt" && e.altKey) ||
        (state.modifierKey === "Control" && e.ctrlKey) ||
        (state.modifierKey === "Meta" && e.metaKey);
      if (modPressed) {
        e.preventDefault();
        navigateByNumber(e.code.replace("Digit", ""), openLink);
        return;
      }
    }

    if (e.key === "Escape") {
      hideOverlay();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const inputValue = state.inputElement ? state.inputElement.value : "";
      const settings = JSON.parse(localStorage.getItem("settings") || "{}");
      const enableBangs = settings.enableBangs !== false;
      let bangInfo = parseBangInput(inputValue);

      if (!enableBangs) bangInfo = null;

      if (state.currentIndex >= 0) {
        const navItems = getNavigationItems();
        const item = navItems[state.currentIndex];
        if (item) {
          if (state.isBangMode) {
            const trigger = item.dataset.bangTrigger;
            if (trigger) {
              insertBangAndFocus(trigger);
            }
            return;
          }
          if (state.isSearchMode) {
            const link = item.querySelector("a");
            if (link) {
              openLink(link.href);
            }
          } else {
            const link =
              item.querySelector("a") || (item.tagName === "A" ? item : null);
            if (link && link.href) {
              openLink(link.href);
            } else {
              item.click();
            }
          }
          return;
        }
      }

      if (bangInfo && bangInfo.bang && bangInfo.hasSpace) {
        const url = getBangSearchUrl(bangInfo.bang, bangInfo.query);
        if (url) openLink(url);
        return;
      }

      if (bangInfo && bangInfo.bang && !bangInfo.hasSpace) {
        openLink(bangInfo.bang.homeUrl);
        return;
      }

      if (
        state.isSearchMode &&
        inputValue.length > 0 &&
        state.searchResults.length > 0
      ) {
        const firstResult = state.searchResults[0];
        if (firstResult && firstResult.url) {
          openLink(firstResult.url);
        }
        return;
      }

      if (state.isSearchMode && inputValue.length > 0) {
        const url = getDefaultSearchUrl(inputValue);
        if (url) openLink(url);
      }
    }
  }

  function showOverlay() {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    if (!settings.enableKeyboardNav) {
      return;
    }
    state.isActive = true;
    createInput();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ensureFocus());
    });
    document.addEventListener("keydown", handleKeydown);

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts) {
      shortcuts.classList.add("command-mode");
    }

    state.allItems = getAllItems();
    if (!state.isSearchMode) {
      renderNumberHints();
      setupFolderListeners();
    }
  }

  function hideOverlay() {
    state.isActive = false;
    state.isSearchMode = false;
    state.isBangMode = false;
    state.currentBangSuggestions = [];
    clearSelection();
    clearNumberHints();
    state.searchPending = false;
    state.originalShortcutsContent = null;
    state.searchResults = [];
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts) {
      shortcuts.classList.remove("command-mode");
      shortcuts.classList.remove(SEARCH_MODE_CLASS);
      shortcuts.querySelectorAll("." + SELECTED_CLASS).forEach((el) => {
        el.classList.remove(SELECTED_CLASS);
      });

      if (window.renderBookmarks) {
        shortcuts.innerHTML = "";
        window.renderBookmarks();
      }
    }

    if (state.inputElement) {
      state.inputElement.remove();
      state.inputElement = null;
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
