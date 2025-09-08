const TODO_STORAGE_KEY = 'sidebar-todo-list';

function getTodos() {
    return JSON.parse(localStorage.getItem(TODO_STORAGE_KEY)) || [];
}

function saveTodos(todos) {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

export function renderTodo() {
    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'todo-widget';

    const title = document.createElement('h3');
    title.textContent = 'Todo List';

    const todoList = document.createElement('ul');
    todoList.className = 'todo-list';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add a new todo...';
    input.className = 'todo-input';

    const renderItems = () => {
        const todos = getTodos();
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            const label = document.createElement('label');
            label.className = 'checkbox-label';

            li.className = todo.completed ? 'completed' : '';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.addEventListener('change', () => {
                todos[index].completed = checkbox.checked;
                saveTodos(todos);
                renderItems();
            });

            const customCheckbox = document.createElement('span');
            customCheckbox.className = 'custom-checkbox';

            const text = document.createElement('span');
            text.className = 'todo-text';
            text.textContent = todo.text;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', () => {
                todos.splice(index, 1);
                saveTodos(todos);
                renderItems();
            });

            label.appendChild(checkbox);
            label.appendChild(customCheckbox);
            label.appendChild(text);

            li.appendChild(label);
            li.appendChild(deleteBtn);
            todoList.appendChild(li);
        });
    };

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim() !== '') {
            const todos = getTodos();
            todos.push({ text: input.value.trim(), completed: false });
            saveTodos(todos);
            input.value = '';
            renderItems();
        }
    });

    widgetWrapper.appendChild(title);
    widgetWrapper.appendChild(todoList);
    widgetWrapper.appendChild(input);

    renderItems();

    return widgetWrapper;
}