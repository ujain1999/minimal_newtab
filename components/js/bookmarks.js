function processBookmarks(settings, nodes, container, level = 0, path = "") {
    nodes.forEach(node => {
        const currentPath = `${path}/${node.title || "Untitled"}`;

        if (node.children && node.children.length > 0) {
            const listItem = document.createElement('li');
            listItem.className = 'bookmark-folder-item';

            const folderButton = document.createElement('button');
            folderButton.type = 'button';
            folderButton.className = 'bookmark-folder';
            const chevron = document.createElement('span');
            chevron.className = 'chevron';
            chevron.textContent = '▶';

            const title = document.createElement('span');
            title.textContent = ` ${node.title || "Untitled folder"}`;

            folderButton.appendChild(chevron);
            folderButton.appendChild(title);

            const childrenList = document.createElement('ul');
            childrenList.className = 'bookmark-children';

            const isOpen = settings.expandBookmarks ? true : localStorage.getItem(currentPath) === "true";
            if (isOpen) {
                chevron.textContent = '▼';
            } else {
                childrenList.classList.add('collapsed');
            }

            folderButton.addEventListener('click', () => {
                const isCollapsed = childrenList.classList.contains('collapsed');
                if (isCollapsed) {
                    childrenList.classList.remove('collapsed');
                    chevron.textContent = '▼';
                    localStorage.setItem(currentPath, "true");
                } else {
                    childrenList.classList.add('collapsed');
                    chevron.textContent = '▶';
                    localStorage.setItem(currentPath, "false");
                }
            });

            listItem.appendChild(folderButton);
            listItem.appendChild(childrenList);
            container.appendChild(listItem);

            processBookmarks(settings, node.children, childrenList, level + 1, currentPath);
        } else if (node.url) {
            const listItem = document.createElement('li');
            listItem.className = 'bookmark-link-item';

            const a = document.createElement('a');
            a.href = node.url;
            a.className = 'shortcut';
            a.textContent = node.title || node.url;

            listItem.appendChild(a);
            container.appendChild(listItem);
        }
    });
}

function renderBookmarks(settings) {
    loadStylesheet('components/css/bookmarks.css');
    chrome.bookmarks.getTree(tree => {
        const shortcuts = document.getElementById('shortcuts');
        let bookmarksBar = settings.bookmarkFolder?.trim()
            ? tree[0].children.find(f => f.title.toLowerCase() === settings.bookmarkFolder.toLowerCase())
            : tree[0].children[0];

        if (settings.bookmarkFolder?.trim() && !bookmarksBar) {
            shortcuts.textContent = "Bookmark folder not found.";
            return;
        }

        const listRoot = document.createElement('ul');
        listRoot.className = 'bookmark-list';
        shortcuts.innerHTML = '';

        processBookmarks(
            settings,
            settings.bookmarkFolder?.trim() ? bookmarksBar.children : tree[0].children,
            listRoot
        );

        shortcuts.appendChild(listRoot);
    });
}

export { renderBookmarks };