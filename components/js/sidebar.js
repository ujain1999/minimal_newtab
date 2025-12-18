import { renderCalendar } from '../../widgets/calendar.js';
import { renderTodo } from '../../widgets/todo.js';

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
    loadStylesheet('components/css/sidebar.css');
    const sidebar = document.getElementById('sidebar');
        sidebar.style.display = 'flex';
        sidebar.classList.add(settings.sidebarPosition || 'right');
    
        const sidebarContent = sidebar.querySelector('.sidebar-content');
        const selectedWidgets = settings.sidebarWidgets || [];
    
        const widgetRenderers = {
            calendar: renderCalendar,
            todo: renderTodo
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
                location.href = '/options.html';
            });
        }
        
        updateCustomizeVisibility(settings);
        
        const handle = sidebar.querySelector('.sidebar-handle');
        handle.addEventListener('click', () => {
            sidebar.classList.toggle('minimised');
            updateCustomizeVisibility(settings);
        });
}

export { renderSidebar };