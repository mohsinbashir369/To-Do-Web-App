let tasks = [];
let currentFilter = 'All';

// --- Local Storage Functions (The "Backend") ---
function loadFromLocalStorage() {
    const storedTasks = localStorage.getItem('todoTasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// --- Utility Function ---
function generateUniqueId() {
    return Date.now();
}

// --- Date Calculation Utility ---
function calculateOverdueTime(dueDate) {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight
    
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0); // Normalize task date to midnight

    if (taskDate < today) {
        const diffTime = Math.abs(today.getTime() - taskDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    return null; // Not overdue or is today
}


// --- Main Rendering Function ---
function renderTasks() {
    const todoListContainer = document.querySelector('#todo-column .task-list-container');
    const completedListContainer = document.querySelector('#completed-column .task-list-container');
    
    // Clear previous content
    todoListContainer.innerHTML = '';
    completedListContainer.innerHTML = '';

    const filteredTasks = tasks.filter(task => 
        currentFilter === 'All' || task.list === currentFilter
    );

    // Sort tasks: Incomplete first, then by due date, then by time (same sorting as before)
    filteredTasks.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
        }
        if (a.dueDate && b.dueDate) {
            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA.getTime() - dateB.getTime();
            }
        } else if (a.dueDate) { return -1; } else if (b.dueDate) { return 1; }
        if (a.dueTime && b.dueTime) {
            return a.dueTime.localeCompare(b.dueTime);
        } else if (a.dueTime) { return -1; } else if (b.dueTime) { return 1; }
        return 0;
    });

    let hasTodo = false;
    let hasCompleted = false;

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        
        if (task.isCompleted) {
            completedListContainer.appendChild(taskElement);
            hasCompleted = true;
        } else {
            todoListContainer.appendChild(taskElement);
            hasTodo = true;
        }
    });

    // Add empty messages
    if (!hasTodo) {
        const message = document.createElement('p');
        message.className = 'empty-message';
        message.textContent = `No active ${currentFilter === 'All' ? '' : currentFilter + ' '}tasks.`;
        todoListContainer.appendChild(message);
    }
    if (!hasCompleted) {
        const message = document.createElement('p');
        message.className = 'empty-message';
        message.textContent = `No completed ${currentFilter === 'All' ? '' : currentFilter + ' '}tasks.`;
        completedListContainer.appendChild(message);
    }
    
    // After rendering, update the tag dropdowns to include any custom tags
    updateListOptions();
}

// --- Update List/Tag Dropdown Options ---
function updateListOptions() {
    const selectElement = document.getElementById('task-list');
    const filterContainer = document.querySelector('.filter-buttons');
    
    // Clear existing dynamic options/buttons (keep static ones if any, but in this case, we clear all)
    selectElement.innerHTML = ''; 
    filterContainer.innerHTML = ''; 

    // Define the initial list and gather all unique lists from tasks
    const initialLists = ["All", "General", "Work", "Personal", "Study", "Shopping"];
    const allLists = new Set(initialLists);

    tasks.forEach(task => {
        if (task.list) allLists.add(task.list);
    });

    // --- Update Select (Dropdown) ---
    // The "Add New Tag..." option
    const addNewOption = document.createElement('option');
    addNewOption.value = '___ADD_NEW___';
    addNewOption.textContent = '➕ Add New Tag...';
    selectElement.appendChild(addNewOption);
    
    // Populate the select element with unique lists (excluding 'All')
    allLists.forEach(list => {
        if (list !== 'All') {
            const option = document.createElement('option');
            option.value = list;
            option.textContent = list;
            selectElement.appendChild(option);
        }
    });
    selectElement.value = 'General'; // Set a default value

    // --- Update Filter Buttons ---
    allLists.forEach(list => {
        const button = document.createElement('button');
        button.className = `filter-btn ${list === currentFilter ? 'active' : ''}`;
        button.dataset.list = list;
        button.textContent = list;
        button.addEventListener('click', function() {
            // Update active class
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter and re-render
            currentFilter = this.dataset.list;
            renderTasks();
        });
        filterContainer.appendChild(button);
    });
}

// --- Task Element Creation ---
function createTaskElement(task) {
    const item = document.createElement('div');
    item.className = `task-item ${task.isCompleted ? 'completed' : ''}`;
    item.dataset.id = task.id;

    // --- Date/Time Formatting and Overdue Check ---
    const formattedDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const overdueText = calculateOverdueTime(task.dueDate);
    
    // Determine the meta content: show overdue text if overdue and not completed
    let dateMetaHTML = '';
    if (task.dueDate) {
        if (overdueText && !task.isCompleted) {
            // Overdue and not completed: Red alert!
            dateMetaHTML = `<span class="overdue-tag"><i class="fas fa-exclamation-circle"></i> Overdue: ${overdueText}</span>`;
        } else {
            // Normal due date display
            dateMetaHTML = `<span><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>`;
        }
    }
    
    item.innerHTML = `
        <div class="task-details">
            <div class="task-text-display">${task.text}</div>
            <input type="text" class="edit-input" value="${task.text}" style="display:none;">
            <div class="task-meta">
                <span class="task-list-tag"><i class="fas fa-folder"></i> ${task.list}</span>
                ${dateMetaHTML}
                ${task.dueTime ? `<span><i class="fas fa-clock"></i> ${task.dueTime}</span>` : ''}
            </div>
        </div>
        <div class="task-actions">
            <button class="complete-btn" onclick="toggleComplete(${task.id})" title="${task.isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}">
                <i class="fas ${task.isCompleted ? 'fa-undo' : 'fa-check'}"></i>
            </button>
            
            <button class="edit-btn" onclick="toggleEdit(${task.id})" title="Edit Task">
                <i class="fas fa-edit"></i>
            </button>
            
            <button class="delete-btn" onclick="deleteTask(${task.id})" title="Delete Task">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    return item;
}

// --- Event Handlers (CRUD Logic) ---

// Listen for selection change to handle "Add New Tag..."
document.getElementById('task-list').addEventListener('change', function() {
    if (this.value === '___ADD_NEW___') {
        let newTag = prompt("Enter the name for your new Tag/List:");
        if (newTag && newTag.trim() !== "") {
            newTag = newTag.trim();
            // We don't need to save it yet, just update the options
            updateListOptions(); // Re-render options
            
            // Add the new option to the select (it was already added in updateListOptions, but we need to select it)
            const selectElement = document.getElementById('task-list');
            let option = selectElement.querySelector(`option[value="${newTag}"]`);
            if (!option) {
                 option = document.createElement('option');
                 option.value = newTag;
                 option.textContent = newTag;
                 selectElement.appendChild(option);
            }
            selectElement.value = newTag; // Select the newly created tag
        } else {
            this.value = 'General'; // Revert to default if cancelled or empty
        }
    }
});


// 1. CREATE
document.getElementById('task-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const textInput = document.getElementById('task-text');
    const listInput = document.getElementById('task-list');
    const dateInput = document.getElementById('task-date');
    const timeInput = document.getElementById('task-time');

    if (textInput.value.trim() === "") {
        alert("Task description cannot be empty!");
        return;
    }
    
    // Prevent adding a new tag placeholder as a task tag
    const selectedList = (listInput.value === '___ADD_NEW___') ? 'General' : listInput.value;

    const newTask = {
        id: generateUniqueId(),
        text: textInput.value.trim(),
        isCompleted: false,
        list: selectedList,
        dueDate: dateInput.value,
        dueTime: timeInput.value
    };

    tasks.push(newTask);
    saveToLocalStorage();
    renderTasks();
    
    // Clear the form
    textInput.value = '';
    dateInput.value = '';
    timeInput.value = '';
    listInput.value = 'General';
});

// 2. DELETE (No change)
function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    tasks = tasks.filter(task => task.id !== id);
    saveToLocalStorage();
    renderTasks();
}

// 3. TOGGLE COMPLETE (No change)
function toggleComplete(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex > -1) {
        tasks[taskIndex].isCompleted = !tasks[taskIndex].isCompleted;
        saveToLocalStorage();
        renderTasks();
    }
}

// 4. EDIT (No change)
function toggleEdit(id) {
    const item = document.querySelector(`.task-item[data-id="${id}"]`);
    if (!item) return;

    const textDisplay = item.querySelector('.task-text-display');
    const editInput = item.querySelector('.edit-input');
    const editButton = item.querySelector('.edit-btn');
    const actionsContainer = item.querySelector('.task-actions');

    actionsContainer.querySelectorAll('button:not(.edit-btn)').forEach(btn => btn.style.display = 'none');


    if (editButton.querySelector('i').classList.contains('fa-edit')) {
        // Enter Edit Mode
        textDisplay.style.display = 'none';
        editInput.style.display = 'block';
        editInput.focus();
        // Change icon to save
        editButton.innerHTML = '<i class="fas fa-save"></i>';
        editButton.title = 'Save Changes';
    } else {
        // Save Changes
        const newText = editInput.value.trim();
        if (newText) {
            const taskIndex = tasks.findIndex(task => task.id === id);
            if (taskIndex > -1) {
                tasks[taskIndex].text = newText;
                saveToLocalStorage();
                renderTasks();
            }
        } else {
            alert("Task description cannot be empty!");
            editInput.focus();
        }
    }
}

// --- Initial Load ---
window.onload = function() {
    loadFromLocalStorage();
    updateListOptions(); // Load options first
    
    // Set 'All' filter button as active on load
    const allFilterBtn = document.querySelector('.filter-btn[data-list="All"]');
    if (allFilterBtn) {
        allFilterBtn.classList.add('active'); 
    }
    
    renderTasks();
};