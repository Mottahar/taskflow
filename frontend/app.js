```javascript
// ==========================================
// TaskFlow
// Developed by Hussein Motahar
// ==========================================


// ==========================================
// Initial Data
// ==========================================

let tasks = JSON.parse(localStorage.getItem("taskflow_tasks")) || [
    {
        id: 1,
        title: "Design homepage",
        project: "Website Redesign",
        priority: "high",
        deadline: "2026-10-10",
        status: "todo"
    },
    {
        id: 2,
        title: "Build API endpoints",
        project: "Website Redesign",
        priority: "medium",
        deadline: "2026-10-15",
        status: "progress"
    },
    {
        id: 3,
        title: "Create documentation",
        project: "Documentation",
        priority: "low",
        deadline: "2026-10-20",
        status: "completed"
    }
];


let projects = JSON.parse(localStorage.getItem("taskflow_projects")) || [
    {
        id: 1,
        name: "Website Redesign",
        description: "Redesign the company website",
        progress: 65,
        tasks: 8
    },
    {
        id: 2,
        name: "Mobile Application",
        description: "Develop the new mobile application",
        progress: 35,
        tasks: 12
    },
    {
        id: 3,
        name: "Documentation",
        description: "Technical documentation project",
        progress: 90,
        tasks: 5
    }
];


// ==========================================
// DOM Elements
// ==========================================

const todoColumn = document.getElementById("todoColumn");
const progressColumn = document.getElementById("progressColumn");
const completedColumn = document.getElementById("completedColumn");

const totalProjects = document.getElementById("totalProjects");
const totalTasks = document.getElementById("totalTasks");
const progressTasks = document.getElementById("progressTasks");
const completedTasks = document.getElementById("completedTasks");

const todoCount = document.getElementById("todoCount");
const progressCount = document.getElementById("progressCount");
const completedCount = document.getElementById("completedCount");

const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");

const themeToggle = document.getElementById("themeToggle");

const taskModal = document.getElementById("taskModal");
const newTaskButton = document.getElementById("newTaskButton");
const closeTaskModal = document.getElementById("closeTaskModal");

const taskForm = document.getElementById("taskForm");

const taskTitle = document.getElementById("taskTitle");
const taskProject = document.getElementById("taskProject");
const taskPriority = document.getElementById("taskPriority");
const taskDeadline = document.getElementById("taskDeadline");

const projectsContainer = document.getElementById("projectsContainer");

const newProjectButton = document.getElementById("newProjectButton");


// ==========================================
// Save Data
// ==========================================

function saveTasks() {

    localStorage.setItem(
        "taskflow_tasks",
        JSON.stringify(tasks)
    );
}


function saveProjects() {

    localStorage.setItem(
        "taskflow_projects",
        JSON.stringify(projects)
    );
}


// ==========================================
// Render Tasks
// ==========================================

function renderTasks() {

    todoColumn.innerHTML = "";
    progressColumn.innerHTML = "";
    completedColumn.innerHTML = "";

    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();

    const selectedPriority =
        priorityFilter.value;


    const filteredTasks = tasks.filter(task => {

        const matchesSearch =
            task.title
                .toLowerCase()
                .includes(searchValue) ||

            task.project
                .toLowerCase()
                .includes(searchValue);


        const matchesPriority =
            selectedPriority === "all" ||
            task.priority === selectedPriority;


        return matchesSearch && matchesPriority;
    });


    filteredTasks.forEach(task => {

        const card = createTaskCard(task);

        if (task.status === "todo") {

            todoColumn.appendChild(card);

        } else if (task.status === "progress") {

            progressColumn.appendChild(card);

        } else {

            completedColumn.appendChild(card);
        }
    });


    updateTaskCounts();

    updateStatistics();
}


// ==========================================
// Create Task Card
// ==========================================

function createTaskCard(task) {

    const card = document.createElement("div");

    card.className = "task-card";

    card.dataset.id = task.id;


    const priorityText = {

        high: "HIGH",

        medium: "MEDIUM",

        low: "LOW"

    };


    card.innerHTML = `

        <h5>
            ${escapeHTML(task.title)}
        </h5>

        <div class="task-project">
            ${escapeHTML(task.project)}
        </div>

        <div class="task-footer">

            <span class="priority ${task.priority}">
                ${priorityText[task.priority]}
            </span>

            <span class="deadline">
                📅 ${formatDate(task.deadline)}
            </span>

        </div>

        <div class="task-actions">

            <button
                class="task-action-button"
                onclick="moveTask(${task.id})"
            >
                Move
            </button>

            <button
                class="task-action-button delete"
                onclick="deleteTask(${task.id})"
            >
                Delete
            </button>

        </div>

    `;


    return card;
}


// ==========================================
// Update Task Counts
// ==========================================

function updateTaskCounts() {

    const todoTasks =
        tasks.filter(task => task.status === "todo").length;

    const progress =
        tasks.filter(task => task.status === "progress").length;

    const completed =
        tasks.filter(task => task.status === "completed").length;


    todoCount.textContent =
        `${todoTasks} task${todoTasks !== 1 ? "s" : ""}`;


    progressCount.textContent =
        `${progress} task${progress !== 1 ? "s" : ""}`;


    completedCount.textContent =
        `${completed} task${completed !== 1 ? "s" : ""}`;
}


// ==========================================
// Statistics
// ==========================================

function updateStatistics() {

    totalProjects.textContent =
        projects.length;

    totalTasks.textContent =
        tasks.length;

    progressTasks.textContent =
        tasks.filter(task =>
            task.status === "progress"
        ).length;

    completedTasks.textContent =
        tasks.filter(task =>
            task.status === "completed"
        ).length;
}


// ==========================================
// Render Projects
// ==========================================

function renderProjects() {

    projectsContainer.innerHTML = "";


    projects.forEach(project => {

        const card =
            document.createElement("div");

        card.className =
            "project-card";


        card.innerHTML = `

            <h4>
                ${escapeHTML(project.name)}
            </h4>

            <p>
                ${escapeHTML(project.description)}
            </p>

            <div class="project-progress">

                <div
                    class="project-progress-bar"
                    style="width: ${project.progress}%"
                ></div>

            </div>

            <div class="project-footer">

                <span>
                    ${project.progress}% complete
                </span>

                <span>
                    ${project.tasks} tasks
                </span>

            </div>

        `;


        projectsContainer.appendChild(card);
    });
}


// ==========================================
// New Task Modal
// ==========================================

newTaskButton.addEventListener(
    "click",
    () => {

        taskModal.classList.remove("hidden");

        taskTitle.focus();
    }
);


closeTaskModal.addEventListener(
    "click",
    closeModal
);


taskModal.addEventListener(
    "click",
    event => {

        if (event.target === taskModal) {

            closeModal();
        }
    }
);


function closeModal() {

    taskModal.classList.add("hidden");

    taskForm.reset();
}


// ==========================================
// Create Task
// ==========================================

taskForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const title =
            taskTitle.value.trim();

        const project =
            taskProject.value.trim();

        const priority =
            taskPriority.value;

        const deadline =
            taskDeadline.value;


        if (!title || !project) {

            alert("Please enter task title and project.");

            return;
        }


        const newTask = {

            id: Date.now(),

            title,

            project,

            priority,

            deadline: deadline || "No deadline",

            status: "todo"

        };


        tasks.push(newTask);

        saveTasks();

        renderTasks();

        closeModal();
    }
);


// ==========================================
// Delete Task
// ==========================================

function deleteTask(id) {

    const confirmed =
        confirm("Are you sure you want to delete this task?");


    if (!confirmed) {

        return;
    }


    tasks =
        tasks.filter(task =>
            task.id !== id
        );


    saveTasks();

    renderTasks();
}


// ==========================================
// Move Task
// ==========================================

function moveTask(id) {

    const task =
        tasks.find(item =>
            item.id === id
        );


    if (!task) {

        return;
    }


    if (task.status === "todo") {

        task.status = "progress";

    } else if (task.status === "progress") {

        task.status = "completed";

    } else {

        task.status = "todo";
    }


    saveTasks();

    renderTasks();
}


// ==========================================
// Search
// ==========================================

searchInput.addEventListener(
    "input",
    renderTasks
);


// ==========================================
// Priority Filter
// ==========================================

priorityFilter.addEventListener(
    "change",
    renderTasks
);


// ==========================================
// Dark Mode
// ==========================================

function loadTheme() {

    const savedTheme =
        localStorage.getItem("taskflow_theme");


    if (savedTheme === "dark") {

        document.body.classList.add("dark");

        themeToggle.textContent = "☀️";

    } else {

        themeToggle.textContent = "🌙";
    }
}


themeToggle.addEventListener(
    "click",
    () => {

        document.body.classList.toggle("dark");


        const darkMode =
            document.body.classList.contains("dark");


        localStorage.setItem(
            "taskflow_theme",
            darkMode ? "dark" : "light"
        );


        themeToggle.textContent =
            darkMode ? "☀️" : "🌙";
    }
);


// ==========================================
// New Project
// ==========================================

newProjectButton.addEventListener(
    "click",
    () => {

        const name =
            prompt("Enter project name:");


        if (!name || !name.trim()) {

            return;
        }


        const description =
            prompt("Enter project description:");


        const newProject = {

            id: Date.now(),

            name: name.trim(),

            description:
                description?.trim() ||
                "New TaskFlow project",

            progress: 0,

            tasks: 0
        };


        projects.push(newProject);

        saveProjects();

        renderProjects();

        updateStatistics();
    }
);


// ==========================================
// Format Date
// ==========================================

function formatDate(date) {

    if (!date || date === "No deadline") {

        return "No deadline";
    }


    const parsedDate =
        new Date(date);


    if (Number.isNaN(parsedDate.getTime())) {

        return "No deadline";
    }


    return parsedDate.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// ==========================================
// HTML Security Helper
// ==========================================

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}


// ==========================================
// Initialize Application
// ==========================================

function initializeApp() {

    loadTheme();

    renderProjects();

    renderTasks();
}


initializeApp();
```
