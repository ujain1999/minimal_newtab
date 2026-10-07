import { renderCalendar } from '../../widgets/calendar.js';
import { renderTodo } from '../../widgets/todo.js';
import { renderNotes } from '../../widgets/notes.js';

const SIDEBAR_WIDTH_KEY = 'sidebarWidth';
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 700;
const DEFAULT_SIDEBAR_WIDTH = 280;

function getSavedSidebarWidth() {
    const raw = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
    if (!raw || Number.isNaN(raw)) return DEFAULT_SIDEBAR_WIDTH;
    return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, raw));
}

function persistSidebarWidth(width) {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(Math.round(width)));
}

function setupResize(sidebar) {
    const handle = document.createElement('div');
    handle.className = 'sidebar-resize-handle';
    sidebar.appendChild(handle);

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = sidebar.offsetWidth;
        const isLeft = sidebar.classList.contains('left');

        const onMouseMove = (ev) => {
            const dx = ev.clientX - startX;
            const newWidth = isLeft ? startWidth + dx : startWidth - dx;
            sidebar.style.width = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth)) + 'px';
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.classList.remove('sidebar-resizing');
            persistSidebarWidth(sidebar.offsetWidth);
        };

        document.body.classList.add('sidebar-resizing');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}

const updateCustomizeVisibility = (settings) => {
    const customizeBtn = document.getElementById('customize');
    const themeToggle = document.querySelector('.theme-toggle');
    const isLeft = settings.sidebarPosition === 'left';
    const isRight = settings.sidebarPosition === 'right' || !settings.sidebarPosition;
    const isExpanded = !sidebar.classList.contains('minimised');
    
    // Hide customize button when sidebar is on left and expanded
    if (isLeft && isExpanded) {
        customizeBtn.style.opacity = '0';
        customizeBtn.style.pointerEvents = 'none';
    } else {
        customizeBtn.style.opacity = '1';
        customizeBtn.style.pointerEvents = 'auto';
    }
    
    // Hide theme toggle when sidebar is on right and expanded
    if (isRight && isExpanded) {
        themeToggle.style.opacity = '0';
        themeToggle.style.pointerEvents = 'none';
    } else {
        themeToggle.style.opacity = '1';
        themeToggle.style.pointerEvents = 'auto';
    }
};

function renderSidebar(settings) {
    const sidebar = document.getElementById('sidebar');
    const resizable = settings.sidebarResizable === true;
    sidebar.style.display = 'flex';
    sidebar.style.width = (resizable ? getSavedSidebarWidth() : DEFAULT_SIDEBAR_WIDTH) + 'px';
    sidebar.classList.add(settings.sidebarPosition || 'right');

    const sidebarHandle = document.createElement('div');
    sidebarHandle.className = 'sidebar-handle';
    sidebarHandle.innerHTML = '<span class="sidebar-caret"></span>';
    sidebar.appendChild(sidebarHandle);

    const sidebarContent = document.createElement('div');
    sidebarContent.className = 'sidebar-content';
    sidebar.appendChild(sidebarContent);

    const selectedWidgets = settings.sidebarWidgets || [];

    const widgetRenderers = {
        calendar: renderCalendar,
        todo: renderTodo,
        notes: renderNotes
    };

    if (selectedWidgets.length > 0) {
        selectedWidgets.forEach(widgetId => {
            if (widgetRenderers[widgetId]) {
                const widgetContainer = document.createElement('div');
                widgetContainer.classList.add('widget');
                widgetContainer.id = `widget-${widgetId}`;

                const widgetContent = widgetRenderers[widgetId];
                widgetContainer.append(widgetContent());
                sidebarContent.appendChild(widgetContainer);
            }
        });
    } else {
        sidebarContent.innerHTML = '<p style="text-align: center; margin-top: 50px;">No widgets selected. You can add widgets from the Customize menu.</p>';
    }

    if (settings.sidebarExpanded) {
        sidebar.classList.remove('minimised');
    }

    if (settings.sidebarShowCustomize || settings.sidebarExpanded) {
        const sidebarFooter = document.createElement('div');
        sidebarFooter.className = 'sidebar-footer';
        sidebarFooter.innerHTML = `<button id="sidebar-customize" class="sidebar-customize-btn" title="Customize">Customize</button>`;
        sidebar.appendChild(sidebarFooter);

        document.getElementById('sidebar-customize').addEventListener('click', () => {
            location.href = '../options/options.html';
        });
    }

    updateCustomizeVisibility(settings);

    const handle = sidebar.querySelector('.sidebar-handle');
    handle.addEventListener('click', () => {
        sidebar.classList.toggle('minimised');
        updateCustomizeVisibility(settings);
    });

    if (resizable) {
        setupResize(sidebar);
    }
}

function toggleSidebarVisibility() {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    if (!settings.enableKeyboardNav) return;
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || sidebar.style.display === 'none') return;
    sidebar.classList.toggle('minimised');
    updateCustomizeVisibility(settings);
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'toggleSidebar') {
        toggleSidebarVisibility();
    }
});

export { renderSidebar };