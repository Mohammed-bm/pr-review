const taskform = document.getElementById('taskform');
const taskinput = document.getElementById('task');
const tasklist = document.getElementById('tasklist');
const button = document.getElementById('button');

let tasks = [
    { text: "milk", done: false },
    { text: "bread", done: false },
    { text: "eggs", done: false }
];


function renderTasks(){
    tasklist.innerHTML = ''

    tasks.forEach((task, index) => {
        const li = document.createElement('li');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                li.style.textDecoration = 'line-through';  // Mark done
            } else {
                li.style.textDecoration = 'none';          // Mark undone
            }
        });

        // Add task text next to checkbox
        const taskText = document.createTextNode(' ' + task + ' ');

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            tasks.splice(index, 1); // Remove from array
            renderTasks();           // Re-render updated list
        });

        li.appendChild(checkbox);
        li.appendChild(taskText);
        li.appendChild(deleteButton);

        tasklist.appendChild(li);
    });
}

taskform.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevent form submission
    const newTask = taskinput.value.trim();
    if (newTask) {
        tasks.push(newTask);     // Add to array
        renderTasks();           // Re-render updated list
        taskinput.value = ""; // Clear input
    }
});