export const state = {
  inputElement: null,
  currentIndex: -1,
  currentItem: null,
  allItems: [],
  isActive: false,
  isSearchMode: false,
  originalShortcutsContent: null,
  searchResults: [],
  searchPending: false,
  debounceTimer: null,
  modifierKey: null,
  isBangMode: false,
  currentBangSuggestions: [],
};

export const INPUT_ID = "quick-command-input";
export const SELECTED_CLASS = "selected";
export const NUMBER_HINT_CLASS = "number-hint";
export const SEARCH_MODE_CLASS = "search-mode";
export const SEARCH_RESULT_CLASS = "search-result";

export function focusInput() {
  if (state.inputElement) {
    state.inputElement.focus();
  }
}

export function ensureFocus() {
  if (document.activeElement !== state.inputElement) {
    setTimeout(() => focusInput(), 10);
  }
}
