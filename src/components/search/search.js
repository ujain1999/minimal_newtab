import { state, INPUT_ID, SEARCH_MODE_CLASS, SEARCH_RESULT_CLASS, NUMBER_HINT_CLASS, focusInput } from "../overlay/overlay-state.js";
import { BANGS, parseBangInput, getDefaultSearchUrl, DEFAULT_SEARCH_ENGINES } from "../bangs/bangs.js";
import { setupFolderListeners, getAllItems, renderNumberHints } from "../navigation/navigation.js";

export function fuzzyMatch(text, query) {
  text = text.toLowerCase();
  query = query.toLowerCase();

  if (query === "") return true;

  let queryIndex = 0;
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      queryIndex++;
    }
  }
  return queryIndex === query.length;
}

export function flattenBookmarks(nodes, path = []) {
  const results = [];

  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      const newPath = [...path, node.title || "Untitled"];
      results.push(...flattenBookmarks(node.children, newPath));
    } else if (node.url) {
      const fullPath = path.length > 0 ? path.join(" > ") : null;
      results.push({
        title: node.title || node.url,
        url: node.url,
        path: fullPath,
      });
    }
  });

  return results;
}

export function renderSearchResults(query, bangInfo) {
  if (!query || query.length === 0) return;

  const shortcuts = document.getElementById("shortcuts");
  if (!shortcuts) return;

  const resultsContainer = document.getElementById("search-results-container");
  if (!resultsContainer) return;

  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const bookmarkFolder = settings.bookmarkFolder?.trim();
  const enableBangs = settings.enableBangs !== false;

  const hasBang = enableBangs && bangInfo && bangInfo.bang && bangInfo.hasSpace;

  if (hasBang) {
    resultsContainer.innerHTML = "";

    const bangEl = document.createElement("li");
    bangEl.className = `bookmark-link-item ${SEARCH_RESULT_CLASS} bang-search-result`;

    const a = document.createElement("a");
    a.className = "shortcut";
    a.href = bangInfo.bang.searchUrl.replace(
      "{query}",
      encodeURIComponent(bangInfo.query),
    );

    const contentSpan = document.createElement("span");
    contentSpan.className = "content";
    const titleSpan = document.createElement("span");
    titleSpan.className = "title";
    titleSpan.textContent = bangInfo.query
      ? `Search ${bangInfo.bang.name} for "${bangInfo.query}"`
      : `Go to ${bangInfo.bang.domain}`;
    contentSpan.appendChild(titleSpan);
    a.appendChild(contentSpan);
    bangEl.appendChild(a);
    resultsContainer.appendChild(bangEl);

    requestAnimationFrame(() => focusInput());
    return;
  }

  state.searchPending = true;

  chrome.bookmarks.getTree((tree) => {
    if (!state.searchPending) return;

    let bookmarkNodes = tree[0].children;

    if (bookmarkFolder) {
      const folder = tree[0].children.find(
        (f) => f.title.toLowerCase() === bookmarkFolder.toLowerCase(),
      );
      if (folder) {
        bookmarkNodes = folder.children;
      }
    }

    const flattened = flattenBookmarks(bookmarkNodes);

    state.searchResults = flattened.filter(
      (item) =>
        fuzzyMatch(item.title, query) || fuzzyMatch(item.path || "", query),
    );

    resultsContainer.innerHTML = "";

    if (state.searchResults.length === 0) {
      const defaultUrl = getDefaultSearchUrl(query);
      if (defaultUrl) {
        const settings = JSON.parse(localStorage.getItem("settings") || "{}");
        const engineId = settings.defaultSearchEngine || "google";
        const engine = DEFAULT_SEARCH_ENGINES[engineId] || DEFAULT_SEARCH_ENGINES.google;

        const el = document.createElement("li");
        el.className = `bookmark-link-item ${SEARCH_RESULT_CLASS} default-search-result`;

        const a = document.createElement("a");
        a.className = "shortcut";
        a.href = defaultUrl;

        const contentSpan = document.createElement("span");
        contentSpan.className = "content";
        const titleSpan = document.createElement("span");
        titleSpan.className = "title";
        titleSpan.textContent = `Search ${engine.name} for "${query}"`;
        contentSpan.appendChild(titleSpan);
        a.appendChild(contentSpan);
        el.appendChild(a);
        resultsContainer.appendChild(el);
      } else {
        const noResults = document.createElement("div");
        noResults.className = "no-results";
        noResults.textContent = "No results found";
        resultsContainer.appendChild(noResults);
      }
      requestAnimationFrame(() => focusInput());
      return;
    }

    const list = document.createElement("ul");
    list.className = "bookmark-list search-results-list";

    state.searchResults.slice(0, 10).forEach((result, index) => {
      const li = document.createElement("li");
      li.className = `bookmark-link-item ${SEARCH_RESULT_CLASS}`;

      const a = document.createElement("a");
      a.href = result.url;
      a.className = "shortcut";

      const contentSpan = document.createElement("span");
      contentSpan.className = "content";

      if (result.path) {
        const pathSpan = document.createElement("span");
        pathSpan.className = "path";
        pathSpan.textContent = result.path + " ";
        contentSpan.appendChild(pathSpan);

        const arrowSpan = document.createElement("span");
        arrowSpan.className = "arrow";
        arrowSpan.textContent = " > ";
        contentSpan.appendChild(arrowSpan);
      }

      const titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = result.title;
      contentSpan.appendChild(titleSpan);
      a.appendChild(contentSpan);

      const hint = document.createElement("span");
      hint.className = NUMBER_HINT_CLASS;
      hint.textContent = index === 9 ? "0" : (index + 1).toString();
      a.appendChild(hint);

      li.appendChild(a);
      list.appendChild(li);
    });

    resultsContainer.appendChild(list);
    requestAnimationFrame(() => focusInput());
  });
}

export function enterSearchMode() {
  if (state.isSearchMode) return;
  state.isSearchMode = true;

  const shortcuts = document.getElementById("shortcuts");
  if (shortcuts) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = shortcuts.innerHTML;
    const inputInDom = tempDiv.querySelector("#" + INPUT_ID);
    if (inputInDom) {
      inputInDom.remove();
    }
    state.originalShortcutsContent = tempDiv.innerHTML;
    shortcuts.classList.add(SEARCH_MODE_CLASS);
    shortcuts.innerHTML = "";

    if (state.inputElement) {
      shortcuts.appendChild(state.inputElement);
    }

    const resultsContainer = document.createElement("div");
    resultsContainer.className = "search-results-container";
    resultsContainer.id = "search-results-container";
    shortcuts.appendChild(resultsContainer);
  }
}

export function exitSearchMode() {
  if (!state.isSearchMode) return;
  state.isSearchMode = false;
  state.isBangMode = false;
  state.currentBangSuggestions = [];
  state.searchResults = [];
  clearTimeout(state.debounceTimer);

  const shortcuts = document.getElementById("shortcuts");
  if (!shortcuts) {
    state.originalShortcutsContent = null;
    return;
  }

  shortcuts.classList.remove(SEARCH_MODE_CLASS);

  if (window.renderBookmarks) {
    window.renderBookmarks();
  }

  setTimeout(() => {
    const bookmarkList = shortcuts.querySelector(".bookmark-list");
    if (bookmarkList) {
      bookmarkList.style.opacity = "0";
      requestAnimationFrame(() => {
        bookmarkList.style.transition = "opacity 0.15s ease";
        bookmarkList.style.opacity = "1";
        bookmarkList.addEventListener(
          "transitionend",
          () => {
            bookmarkList.style.transition = "";
            bookmarkList.style.opacity = "";
          },
          { once: true },
        );
      });
    }

    setupFolderListeners();
    state.allItems = getAllItems();
    renderNumberHints();
    focusInput();
  }, 50);

  state.originalShortcutsContent = null;
}
