
export function showNotification(message, duration = 2000, type = 'success', reload = false) {
    const notification = window.document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'hidden'; // Reset classes
    notification.classList.add(type);
    notification.classList.remove('hidden');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.classList.add('hidden');
            if (reload) {
                location.reload();
            }
        }, 500); // Wait for fade out before reloading
    }, duration);
}