export function renderTabGroups() {
    const container = document.getElementById('tab-groups');
    if (!container) return;

    if (!chrome.tabGroups || !chrome.tabGroups.query) {
        console.warn("Tab Groups API not available.");
        return;
    }

    chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }, (groups) => {
        if (!groups || groups.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = '';
        container.style.display = 'flex';
        
        const listRoot = document.createElement('ul');
        listRoot.className = 'tab-group-list';

        groups.forEach(group => {
            const listItem = document.createElement('li');
            listItem.className = 'tab-group-item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = `tab-group-btn tab-group-color-${group.color}`;
            // If the group has no title, maybe it's named 'Group' natively.
            button.textContent = group.title || 'Group';

            button.addEventListener('click', () => {
                chrome.tabs.query({ groupId: group.id }, (tabs) => {
                    if (tabs && tabs.length > 0) {
                        // Focus the first tab of the group
                        chrome.tabs.update(tabs[0].id, { active: true });
                    }
                });
            });

            listItem.appendChild(button);
            listRoot.appendChild(listItem);
        });

        container.appendChild(listRoot);
    });
}
