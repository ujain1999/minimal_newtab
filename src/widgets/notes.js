const NOTES_STORAGE_KEY = 'sidebar-notes';

function getNotes() {
    return localStorage.getItem(NOTES_STORAGE_KEY) || '';
}

function saveNotes(text) {
    localStorage.setItem(NOTES_STORAGE_KEY, text);
}

export function renderNotes() {
    const wrapper = document.createElement('div');
    wrapper.className = 'notes-widget';

    const title = document.createElement('h3');
    title.textContent = 'Notes';

    const textarea = document.createElement('textarea');
    textarea.className = 'notes-textarea';
    textarea.placeholder = 'Write your notes here...';
    textarea.spellcheck = false;
    textarea.value = getNotes();

    textarea.addEventListener('input', () => {
        saveNotes(textarea.value);
    });

    wrapper.appendChild(title);
    wrapper.appendChild(textarea);

    return wrapper;
}
