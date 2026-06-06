import { state, focusInput } from "../overlay/overlay-state.js";

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem("settings") || "{}");
  } catch {
    return {};
  }
}

export function getEffectiveBangs() {
  const settings = getSettings();
  const selectedTriggers = settings.selectedBangs;
  const customBangs = settings.customBangs || [];
  const editedBangs = settings.editedBangs || {};

  const builtin = Array.isArray(selectedTriggers)
    ? BANGS.filter((b) => selectedTriggers.includes(b.trigger))
    : [...BANGS];

  const result = builtin.map((b) => {
    const edits = editedBangs[b.trigger];
    return edits ? { ...b, ...edits } : b;
  });

  return [...result, ...customBangs];
}

export const BANGS = [
  { trigger: "g", name: "Google", domain: "google.com", searchUrl: "https://www.google.com/search?q={query}", homeUrl: "https://www.google.com" },
  { trigger: "yt", name: "YouTube", domain: "youtube.com", searchUrl: "https://www.youtube.com/results?search_query={query}", homeUrl: "https://www.youtube.com" },
  { trigger: "w", name: "Wikipedia", domain: "en.wikipedia.org", searchUrl: "https://en.wikipedia.org/w/index.php?search={query}", homeUrl: "https://en.wikipedia.org" },
  { trigger: "gh", name: "GitHub", domain: "github.com", searchUrl: "https://github.com/search?q={query}", homeUrl: "https://github.com" },
  { trigger: "r", name: "Reddit", domain: "reddit.com", searchUrl: "https://www.reddit.com/search/?q={query}", homeUrl: "https://www.reddit.com" },
  { trigger: "tw", name: "X / Twitter", domain: "x.com", searchUrl: "https://x.com/search?q={query}", homeUrl: "https://x.com" },
  { trigger: "a", name: "Amazon", domain: "amazon.com", searchUrl: "https://www.amazon.com/s?k={query}", homeUrl: "https://www.amazon.com" },
  { trigger: "so", name: "Stack Overflow", domain: "stackoverflow.com", searchUrl: "https://stackoverflow.com/search?q={query}", homeUrl: "https://stackoverflow.com" },
  { trigger: "mdn", name: "MDN Web Docs", domain: "developer.mozilla.org", searchUrl: "https://developer.mozilla.org/en-US/search?q={query}", homeUrl: "https://developer.mozilla.org" },
  { trigger: "npm", name: "npm", domain: "npmjs.com", searchUrl: "https://www.npmjs.com/search?q={query}", homeUrl: "https://www.npmjs.com" },
  { trigger: "pypi", name: "PyPI", domain: "pypi.org", searchUrl: "https://pypi.org/search/?q={query}", homeUrl: "https://pypi.org" },
  { trigger: "maps", name: "Google Maps", domain: "google.com/maps", searchUrl: "https://www.google.com/maps?q={query}", homeUrl: "https://www.google.com/maps" },
  { trigger: "imdb", name: "IMDb", domain: "imdb.com", searchUrl: "https://www.imdb.com/find?q={query}", homeUrl: "https://www.imdb.com" },
  { trigger: "duck", name: "DuckDuckGo", domain: "duckduckgo.com", searchUrl: "https://duckduckgo.com/?q={query}", homeUrl: "https://duckduckgo.com" },
  { trigger: "b", name: "Bing", domain: "bing.com", searchUrl: "https://www.bing.com/search?q={query}", homeUrl: "https://www.bing.com" },
];

export const DEFAULT_SEARCH_ENGINES = {
  google: { name: "Google", searchUrl: "https://www.google.com/search?q={query}" },
  duckduckgo: { name: "DuckDuckGo", searchUrl: "https://duckduckgo.com/?q={query}" },
  bing: { name: "Bing", searchUrl: "https://www.bing.com/search?q={query}" },
  brave: { name: "Brave Search", searchUrl: "https://search.brave.com/search?q={query}" },
  startpage: { name: "Startpage", searchUrl: "https://www.startpage.com/do/dsearch?query={query}" },
};

export function parseBangInput(value) {
  const effectiveBangs = getEffectiveBangs();

  if (value.startsWith("!")) {
    const spaceIndex = value.indexOf(" ");
    let trigger, query, hasSpace, bang;

    if (spaceIndex === -1) {
      trigger = value.slice(1);
      query = "";
      hasSpace = false;
    } else {
      trigger = value.slice(1, spaceIndex);
      query = value.slice(spaceIndex + 1);
      hasSpace = true;
    }

    if (trigger) {
      bang = effectiveBangs.find((b) => b.trigger === trigger) || null;
    } else {
      bang = null;
    }

    return { bang, trigger, query: query.trim(), hasSpace };
  }

  const trimmed = value.trimEnd();
  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  if (lastSpaceIndex !== -1) {
    const lastToken = trimmed.slice(lastSpaceIndex + 1);
    if (lastToken.startsWith("!")) {
      const trigger = lastToken.slice(1);
      if (trigger) {
        const bang = effectiveBangs.find((b) => b.trigger === trigger) || null;
        const query = trimmed.slice(0, lastSpaceIndex);
        return { bang, trigger, query: query.trim(), hasSpace: true };
      }
    }
  }

  return null;
}

export function getBangSearchUrl(bang, query) {
  if (!bang) return null;
  return query
    ? bang.searchUrl.replace("{query}", encodeURIComponent(query))
    : bang.homeUrl;
}

export function getDefaultSearchUrl(query) {
  if (!query) return null;
  const settings = JSON.parse(localStorage.getItem("settings") || "{}");
  const engineId = settings.defaultSearchEngine || "google";
  const engine = DEFAULT_SEARCH_ENGINES[engineId] || DEFAULT_SEARCH_ENGINES.google;
  return engine.searchUrl.replace("{query}", encodeURIComponent(query));
}

export function insertBangAndFocus(trigger) {
  if (!state.inputElement || !trigger) return;
  state.inputElement.value = "!" + trigger + " ";
  state.inputElement.selectionStart = state.inputElement.selectionEnd = state.inputElement.value.length;
  state.inputElement.dispatchEvent(new Event("input"));
  requestAnimationFrame(() => focusInput());
}

export function renderBangSuggestions(trigger) {
  const resultsContainer = document.getElementById("search-results-container");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = "";

  const effectiveBangs = getEffectiveBangs();

  const matchingBangs = trigger
    ? effectiveBangs.filter(
        (b) =>
          b.trigger.includes(trigger) ||
          b.name.toLowerCase().includes(trigger),
      )
    : effectiveBangs;

  if (matchingBangs.length === 0) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.textContent = `No bang matches "!${trigger}"`;
    resultsContainer.appendChild(noResults);
    state.currentBangSuggestions = [];
    requestAnimationFrame(() => focusInput());
    return;
  }

  state.currentBangSuggestions = matchingBangs.map((bang) => {
    const el = document.createElement("div");
    el.className = "bang-suggestion";
    el.dataset.bangTrigger = bang.trigger;

    const triggerSpan = document.createElement("span");
    triggerSpan.className = "bang-trigger";
    triggerSpan.textContent = `!${bang.trigger}`;

    const nameSpan = document.createElement("span");
    nameSpan.className = "bang-name";
    nameSpan.textContent = bang.name;

    const domainSpan = document.createElement("span");
    domainSpan.className = "bang-domain";
    domainSpan.textContent = bang.domain;

    el.appendChild(triggerSpan);
    el.appendChild(nameSpan);
    el.appendChild(domainSpan);
    resultsContainer.appendChild(el);
    return el;
  });

  requestAnimationFrame(() => focusInput());
}
