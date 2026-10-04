import { state, SELECTED_CLASS, NUMBER_HINT_CLASS, SEARCH_RESULT_CLASS } from "../overlay/overlay-state.js";
import { insertBangAndFocus } from "../bangs/bangs.js";

export function getAllItems() {
  const shortcuts = document.getElementById("shortcuts");
  if (!shortcuts) return [];
  return Array.from(shortcuts.querySelectorAll("a.shortcut")).filter(
    (item) => {
      let parent = item.parentElement;
      while (parent && parent !== shortcuts) {
        if (parent.classList.contains("collapsed")) {
          return false;
        }
        parent = parent.parentElement;
      }
      return true;
    },
  );
}

export function getNavigationItems() {
  const shortcuts = document.getElementById("shortcuts");
  if (!shortcuts) return [];

  if (state.isSearchMode && state.isBangMode && state.currentBangSuggestions.length > 0) {
    return state.currentBangSuggestions;
  }

  if (state.isSearchMode) {
    return Array.from(shortcuts.querySelectorAll(`.${SEARCH_RESULT_CLASS}`));
  }

  const items = [];
  const seen = new Set();

  function walk(node) {
    if (!node) return;
    if (node.classList?.contains("collapsed")) return;

    if (
      node.tagName === "BUTTON" &&
      node.classList.contains("bookmark-folder")
    ) {
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

export function updateSelection() {
  const navItems = getNavigationItems();
  navItems.forEach((item, index) => {
    if (index === state.currentIndex) {
      if (state.isBangMode) {
        item.classList.add(SELECTED_CLASS);
      } else {
        const shortcut = item.classList.contains(SEARCH_RESULT_CLASS)
          ? item.querySelector(".shortcut")
          : item;
        if (shortcut) shortcut.classList.add(SELECTED_CLASS);
      }
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      state.currentItem = navItems[state.currentIndex];
    } else {
      if (state.isBangMode) {
        item.classList.remove(SELECTED_CLASS);
      } else {
        const shortcut = item.classList.contains(SEARCH_RESULT_CLASS)
          ? item.querySelector(".shortcut")
          : item;
        if (shortcut) shortcut.classList.remove(SELECTED_CLASS);
      }
    }
  });
}

export function clearSelection() {
  state.currentIndex = -1;
  state.currentItem = null;
  document
    .querySelectorAll("." + SELECTED_CLASS)
    .forEach((el) => el.classList.remove(SELECTED_CLASS));
}

export function renderNumberHints() {
  clearNumberHints();
  state.allItems = getAllItems();
  state.allItems.slice(0, 10).forEach((item, index) => {
    const hint = document.createElement("span");
    hint.className = NUMBER_HINT_CLASS;
    hint.textContent = index === 9 ? "0" : (index + 1).toString();
    item.appendChild(hint);
  });
}

export function clearNumberHints() {
  document
    .querySelectorAll(`.${NUMBER_HINT_CLASS}`)
    .forEach((el) => el.remove());
}

export function moveSelection(direction) {
  const navItems = getNavigationItems();

  if (navItems.length === 0) return;

  if (state.isSearchMode && state.currentItem) {
    const currentLi =
      state.currentItem.closest(`.${SEARCH_RESULT_CLASS}`) || state.currentItem;
    if (navItems.includes(currentLi)) {
      state.currentIndex = navItems.indexOf(currentLi);
    }
  } else if (!state.isSearchMode && state.currentItem) {
    if (navItems.includes(state.currentItem)) {
      state.currentIndex = navItems.indexOf(state.currentItem);
    }
  }

  if (state.currentIndex === -1) {
    state.currentIndex = direction === 1 ? 0 : navItems.length - 1;
  } else {
    state.currentIndex = state.currentIndex + direction;
    if (state.currentIndex < 0) {
      state.currentIndex = navItems.length - 1;
    } else if (state.currentIndex >= navItems.length) {
      state.currentIndex = 0;
    }
  }
  state.currentItem = navItems[state.currentIndex];
  updateSelection();
}

export function navigateByNumber(num, openLink) {
  const index = num === "0" ? 9 : parseInt(num, 10) - 1;

  if (state.isSearchMode && state.isBangMode && state.currentBangSuggestions.length > 0) {
    if (index >= 0 && index < state.currentBangSuggestions.length) {
      const trigger = state.currentBangSuggestions[index].dataset.bangTrigger;
      if (trigger) insertBangAndFocus(trigger);
    }
    return;
  }

  if (state.isSearchMode) {
    const navItems = getNavigationItems();
    if (index >= 0 && index < navItems.length) {
      const link = navItems[index].querySelector("a.shortcut");
      if (link) openLink(link.href);
    }
    return;
  }

  if (index >= 0 && index < state.allItems.length && state.allItems[index]) {
    const link = state.allItems[index].querySelector("a") || state.allItems[index];
    if (link.href) {
      openLink(link.href);
    } else {
      state.allItems[index].click();
    }
  }
}

export function setupFolderListeners() {
  const shortcuts = document.getElementById("shortcuts");
  if (!shortcuts) return;

  shortcuts.querySelectorAll("button.bookmark-folder").forEach((folder) => {
    folder.addEventListener("click", () => {
      setTimeout(() => {
        if (state.isActive && !state.isSearchMode) {
          renderNumberHints();
        }
        if (state.currentItem) {
          state.currentItem.classList.add(SELECTED_CLASS);
          state.currentItem.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }, 10);
    });
  });
}
