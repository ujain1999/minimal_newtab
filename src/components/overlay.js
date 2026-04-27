(function () {
  "use strict";

  const INPUT_ID = "quick-command-input";
  const SELECTED_CLASS = "selected";
  const NUMBER_HINT_CLASS = "number-hint";
  const SEARCH_MODE_CLASS = "search-mode";
  const SEARCH_RESULT_CLASS = "search-result";

  let inputElement = null;
  let currentIndex = -1;
  let currentItem = null;
  let allItems = [];
  let numberBuffer = "";
  let isActive = false;
  let isSearchMode = false;
  let originalShortcutsContent = null;
  let searchResults = [];
  let searchPending = false;
  let debounceTimer = null;

  function fuzzyMatch(text, query) {
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

  function flattenBookmarks(nodes, path = []) {
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

  function getAllItems() {
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

  function getNavigationItems() {
    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return [];

    if (isSearchMode) {
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

  function updateSelection() {
    const navItems = getNavigationItems();
    navItems.forEach((item, index) => {
      const shortcut = item.classList.contains(SEARCH_RESULT_CLASS)
        ? item.querySelector(".shortcut")
        : item;

      if (index === currentIndex) {
        if (shortcut) shortcut.classList.add(SELECTED_CLASS);
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        currentItem = navItems[currentIndex];
      } else {
        if (shortcut) shortcut.classList.remove(SELECTED_CLASS);
      }
    });
  }

  function clearSelection() {
    currentIndex = -1;
    currentItem = null;
    document
      .querySelectorAll("." + SELECTED_CLASS)
      .forEach((el) => el.classList.remove(SELECTED_CLASS));
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

  function clearNumberHints() {
    document
      .querySelectorAll(`.${NUMBER_HINT_CLASS}`)
      .forEach((el) => el.remove());
  }

  function renderSearchResults(query) {
    if (!query || query.length === 0) return;

    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return;

    const resultsContainer = document.getElementById(
      "search-results-container",
    );
    if (!resultsContainer) return;

    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    const bookmarkFolder = settings.bookmarkFolder?.trim();

    searchPending = true;

    chrome.bookmarks.getTree((tree) => {
      if (!searchPending) return;

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

      searchResults = flattened.filter(
        (item) =>
          fuzzyMatch(item.title, query) || fuzzyMatch(item.path || "", query),
      );

      resultsContainer.innerHTML = "";

      if (searchResults.length === 0) {
        const noResults = document.createElement("div");
        noResults.className = "no-results";
        noResults.textContent = "No results found";
        resultsContainer.appendChild(noResults);
        requestAnimationFrame(() => focusInput());
        return;
      }

      const list = document.createElement("ul");
      list.className = "bookmark-list search-results-list";

      searchResults.slice(0, 10).forEach((result, index) => {
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

  function enterSearchMode() {
    if (isSearchMode) return;
    isSearchMode = true;

    const shortcuts = document.getElementById("shortcuts");
    if (shortcuts && !originalShortcutsContent) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = shortcuts.innerHTML;
      const inputInDom = tempDiv.querySelector("#" + INPUT_ID);
      if (inputInDom) {
        inputInDom.remove();
      }
      originalShortcutsContent = tempDiv.innerHTML;
      shortcuts.classList.add(SEARCH_MODE_CLASS);
      shortcuts.innerHTML = "";

      if (inputElement) {
        shortcuts.appendChild(inputElement);
      }

      const resultsContainer = document.createElement("div");
      resultsContainer.className = "search-results-container";
      resultsContainer.id = "search-results-container";
      shortcuts.appendChild(resultsContainer);
    }
  }

  function exitSearchMode() {
    if (!isSearchMode) return;
    isSearchMode = false;
    searchResults = [];
    clearTimeout(debounceTimer);

    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) {
      originalShortcutsContent = null;
      return;
    }

    shortcuts.classList.remove(SEARCH_MODE_CLASS);

    if (window.renderBookmarks) {
      window.renderBookmarks();
    }

    // renderBookmarks is async — wait for it to finish
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
      allItems = getAllItems();
      renderNumberHints();
      focusInput();
    }, 50);

    originalShortcutsContent = null;
  }

  function renderBookmarks() {
    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return;

    shortcuts.innerHTML = "";

    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    const bookmarkFolder = settings.bookmarkFolder?.trim();

    chrome.bookmarks.getTree((tree) => {
      let bookmarkNodes = tree[0].children;

      if (bookmarkFolder) {
        const folder = tree[0].children.find(
          (f) => f.title.toLowerCase() === bookmarkFolder.toLowerCase(),
        );
        if (folder) {
          bookmarkNodes = folder.children;
        }
      }

      const listRoot = document.createElement("ul");
      listRoot.className = "bookmark-list";

      function processBookmarks(nodes, container, path = []) {
        nodes.forEach((node) => {
          if (node.children && node.children.length > 0) {
            const listItem = document.createElement("li");
            listItem.className = "bookmark-folder-item";

            const folderButton = document.createElement("button");
            folderButton.type = "button";
            folderButton.className = "bookmark-folder";
            const chevron = document.createElement("span");
            chevron.className = "chevron";
            chevron.textContent = "▶";

            const title = document.createElement("span");
            title.textContent = ` ${node.title || "Untitled folder"}`;

            folderButton.appendChild(chevron);
            folderButton.appendChild(title);

            const childrenList = document.createElement("ul");
            childrenList.className = "bookmark-children";

            const newPath = [...path, node.title || "Untitled"];
            const isOpen = localStorage.getItem(newPath.join("/")) === "true";

            if (isOpen) {
              chevron.textContent = "▼";
            } else {
              childrenList.classList.add("collapsed");
            }

            folderButton.addEventListener("click", () => {
              const isCollapsed = childrenList.classList.contains("collapsed");
              if (isCollapsed) {
                childrenList.classList.remove("collapsed");
                chevron.textContent = "▼";
                localStorage.setItem(newPath.join("/"), "true");
              } else {
                childrenList.classList.add("collapsed");
                chevron.textContent = "▶";
                localStorage.setItem(newPath.join("/"), "false");
              }
              if (isActive) {
                allItems = getAllItems();
                renderNumberHints();
              }
            });

            listItem.appendChild(folderButton);
            listItem.appendChild(childrenList);
            container.appendChild(listItem);

            processBookmarks(node.children, childrenList, newPath);
          } else if (node.url) {
            const listItem = document.createElement("li");
            listItem.className = "bookmark-link-item";

            const a = document.createElement("a");
            a.href = node.url;
            a.className = "shortcut";
            const text = document.createElement("span");
            text.textContent = node.title || node.url;
            a.appendChild(text);

            listItem.appendChild(a);
            container.appendChild(listItem);
          }
        });
      }

      processBookmarks(bookmarkNodes, listRoot);
      shortcuts.appendChild(listRoot);

      if (inputElement && !shortcuts.contains(inputElement)) {
        shortcuts.insertBefore(inputElement, shortcuts.firstChild);
      }

      if (isActive) {
        setupFolderListeners();
        allItems = getAllItems();
        renderNumberHints();
        requestAnimationFrame(() => focusInput());
      }
    });
  }

  function setupFolderListeners() {
    const shortcuts = document.getElementById("shortcuts");
    if (!shortcuts) return;

    shortcuts.querySelectorAll("button.bookmark-folder").forEach((folder) => {
      folder.addEventListener("click", () => {
        setTimeout(() => {
          if (isActive && !isSearchMode) {
            renderNumberHints();
          }
          if (currentItem) {
            currentItem.classList.add(SELECTED_CLASS);
            currentItem.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
        }, 10);
      });
    });
  }

  function navigateByNumber(num) {
    const index = num === "0" ? 9 : parseInt(num, 10) - 1;
    if (isSearchMode) {
      if (index >= 0 && index < searchResults.length) {
        window.location.href = searchResults[index].url;
      }
    } else {
      if (index >= 0 && index < allItems.length && allItems[index]) {
        allItems[index].click();
      }
    }
  }

  function focusInput() {
    if (inputElement) {
      inputElement.focus();
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

    inputElement.addEventListener("input", (e) => {
      const query = e.target.value;
      numberBuffer = "";

      if (query.length > 0) {
        enterSearchMode();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderSearchResults(query);
        }, 100);
        currentIndex = -1;
        currentItem = null;
      } else {
        clearTimeout(debounceTimer);
        exitSearchMode();
        currentIndex = -1;
        currentItem = null;
      }
    });

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
      exitSearchMode();
    } else if (e.key === "Enter" && currentIndex >= 0) {
      const navItems = getNavigationItems();
      e.preventDefault();
      const item = navItems[currentIndex];
      if (item) {
        if (isSearchMode) {
          const link = item.querySelector("a");
          if (link) {
            window.location.href = link.href;
          }
        } else {
          item.click();
        }
      }
    } else if (
      e.key === "Enter" &&
      isSearchMode &&
      inputElement &&
      inputElement.value.length > 0 &&
      searchResults.length > 0
    ) {
      e.preventDefault();
      const firstResult = searchResults[0];
      if (firstResult && firstResult.url) {
        window.location.href = firstResult.url;
      }
    } else if (
      e.key >= "0" &&
      e.key <= "9" &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey
    ) {
      if (document.activeElement === inputElement) {
        const query = inputElement.value;
        if (query.length > 0) {
          e.preventDefault();
          numberBuffer += e.key;
          navigateByNumber(numberBuffer);
          numberBuffer = "";
          if (inputElement) inputElement.value = "";
          exitSearchMode();
        } else {
          e.preventDefault();
          numberBuffer += e.key;
          if (inputElement) inputElement.value = numberBuffer;
        }
      }
    }
  }

  function moveSelection(direction) {
    const navItems = getNavigationItems();

    if (navItems.length === 0) return;

    if (isSearchMode && currentItem) {
      const currentLi =
        currentItem.closest(`.${SEARCH_RESULT_CLASS}`) || currentItem;
      if (navItems.includes(currentLi)) {
        currentIndex = navItems.indexOf(currentLi);
      }
    } else if (!isSearchMode && currentItem) {
      if (navItems.includes(currentItem)) {
        currentIndex = navItems.indexOf(currentItem);
      }
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
    if (!isSearchMode) {
      renderNumberHints();
      setupFolderListeners();
    }
  }

  function hideOverlay() {
    isActive = false;
    isSearchMode = false;
    clearSelection();
    clearNumberHints();
    numberBuffer = "";
    searchPending = false;
    originalShortcutsContent = null;
    searchResults = [];
    clearTimeout(debounceTimer);
    debounceTimer = null;

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
