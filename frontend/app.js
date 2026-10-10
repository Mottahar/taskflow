
/* =========================================================
   TaskFlow
   Developed by Hussein Motahar
   Task and Project Management Dashboard
   ========================================================= */

"use strict";

const TaskFlow = (() => {
    const STORAGE = {
        tasks: "taskflow_tasks",
        projects: "taskflow_projects",
        theme: "taskflow_theme"
    };

    const STATUS = {
        TODO: "todo",
        PROGRESS: "progress",
        COMPLETED: "completed"
    };

    const PRIORITY_LABELS = {
        high: "High",
        medium: "Medium",
        low: "Low"
    };

    const DEFAULT_PROJECTS = [
        { id: "project-1", name: "Website Redesign", color: "#6366f1" },
        { id: "project-2", name: "Personal Goals", color: "#14b8a6" },
        { id: "project-3", name: "Learning", color: "#f59e0b" }
    ];

    const DEFAULT_TASKS = [
        {
            id: "task-1",
            title: "Design the dashboard",
            project: "Website Redesign",
            priority: "high",
            dueDate: "",
            status: "todo",
            createdAt: Date.now()
        },
        {
            id: "task-2",
            title: "Review project requirements",
            project: "Website Redesign",
            priority: "medium",
            dueDate: "",
            status: "progress",
            createdAt: Date.now()
        },
        {
            id: "task-3",
            title: "Organize weekly goals",
            project: "Personal Goals",
            priority: "low",
            dueDate: "",
            status: "completed",
            createdAt: Date.now()
        }
    ];

    let tasks = loadData(STORAGE.tasks, DEFAULT_TASKS);
    let projects = loadData(STORAGE.projects, DEFAULT_PROJECTS);

    let searchTerm = "";
    let statusFilter = "all";

    function loadData(key, fallback) {
        try {
            const saved = localStorage.getItem(key);

            if (saved !== null) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (error) {
            console.warn("TaskFlow could not read saved data:", error);
        }

        return fallback.map(item => ({ ...item }));
    }

    function saveData() {
        try {
            localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
            localStorage.setItem(STORAGE.projects, JSON.stringify(projects));
        } catch (error) {
            console.error("TaskFlow could not save data:", error);
        }
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function findElement(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    function getTaskColumn(status) {
        const selectors = {
            todo: [
                "#todoTasks", "#todoList", "#todo-tasks",
                "#todo-list", '[data-status="todo"]',
                ".todo-tasks", ".todo-list", ".tasks-todo"
            ],
            progress: [
                "#progressTasks", "#progressList",
                "#inProgressTasks", "#in-progress-tasks",
                '[data-status="progress"]',
                ".progress-tasks", ".in-progress-tasks",
                ".tasks-progress"
            ],
            completed: [
                "#completedTasks", "#completedList",
                "#doneTasks", "#completed-tasks",
                '[data-status="completed"]',
                ".completed-tasks", ".completed-list",
                ".tasks-completed"
            ]
        };

        const found = findElement(selectors[status]);
        if (found) return found;

        // Fallback: find a board column by its heading.
        const headings = [...document.querySelectorAll("h2, h3, h4, h5")];
        const words = {
            todo: ["to do", "todo", "to-do"],
            progress: ["in progress", "in-progress", "progress"],
            completed: ["completed", "done"]
        };

        const heading = headings.find(item =>
            words[status].some(word =>
                item.textContent.trim().toLowerCase().includes(word)
            )
        );

        if (heading) {
            const column = heading.closest(
                ".board-column, .kanban-column, .task-column, .column"
            );

            if (column) {
                return column.querySelector(
                    ".task-list, .tasks-list, .task-container, .tasks, [data-task-list]"
                );
            }
        }

        return null;
    }

    function getVisibleTasks() {
        return tasks.filter(task => {
            const matchesSearch = [
                task.title,
                task.project,
                task.priority
            ].some(value =>
                String(value || "").toLowerCase().includes(searchTerm)
            );

            const matchesStatus =
                statusFilter === "all" || task.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }

    function formatDate(dateString) {
        if (!dateString) return "";

        const date = new Date(dateString + "T00:00:00");
        if (Number.isNaN(date.getTime())) return escapeHTML(dateString);

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function renderTask(task) {
        const priority = PRIORITY_LABELS[task.priority]
            ? task.priority
            : "medium";

        const nextStatus = {
            todo: "progress",
            progress: "completed",
            completed: "todo"
        }[task.status] || "todo";

        const nextLabel = {
            todo: "Start",
            progress: "Complete",
            completed: "Reopen"
        }[task.status] || "Start";

        return `
            <article class="task-card" data-task-id="${escapeHTML(task.id)}">
                <div class="task-card-header">
                    <h5>${escapeHTML(task.title)}</h5>
                    <button
                        type="button"
                        class="task-delete"
                        data-action="delete"
                        data-id="${escapeHTML(task.id)}"
                        aria-label="Delete task"
                        title="Delete task"
                    >&#215;</button>
                </div>

                <div class="task-project">
                    ${escapeHTML(task.project || "General")}
                </div>

                <div class="task-footer">
                    <span class="priority ${priority}">
                        ${PRIORITY_LABELS[priority]}
                    </span>

                    ${task.dueDate ? `
                        <span class="task-date">
                            ${escapeHTML(formatDate(task.dueDate))}
                        </span>
                    ` : ""}
                </div>

                <button
                    type="button"
                    class="task-status-button"
                    data-action="move"
                    data-id="${escapeHTML(task.id)}"
                    data-status="${nextStatus}"
                >${nextLabel}</button>
            </article>
        `;
    }

    function renderTasks() {
        const visibleTasks = getVisibleTasks();

        const columns = {
            todo: getTaskColumn("todo"),
            progress: getTaskColumn("progress"),
            completed: getTaskColumn("completed")
        };

        Object.entries(columns).forEach(([status, column]) => {
            if (!column) return;

            const columnTasks = visibleTasks.filter(
                task => task.status === status
            );

            column.innerHTML = columnTasks.length
                ? columnTasks.map(renderTask).join("")
                : '<p class="empty-state">No tasks here yet.</p>';
        });

        renderStats();
    }

    function setStat(selectors, value) {
        const element = findElement(selectors);
        if (element) element.textContent = String(value);
    }

    function renderStats() {
        const total = tasks.length;
        const todo = tasks.filter(t => t.status === "todo").length;
        const progress = tasks.filter(t => t.status === "progress").length;
        const completed = tasks.filter(t => t.status === "completed").length;

        setStat(
            ["#totalTasks", "#total-tasks", "[data-stat='total']"],
            total
        );

        setStat(
            ["#todoCount", "#todo-count", "[data-stat='todo']"],
            todo
        );

        setStat(
            ["#progressCount", "#progress-count", "#inProgressCount",
             "[data-stat='progress']"],
            progress
        );

        setStat(
            ["#completedCount", "#completed-count", "[data-stat='completed']"],
            completed
        );

        setStat(
            ["#completionRate", "#completion-rate", "[data-stat='rate']"],
            total ? Math.round(completed / total * 100) + "%" : "0%"
        );
    }

    function renderProjects() {
        const container = findElement([
            "#projectsList",
            "#projectList",
            "#projectsContainer",
            ".projects-list",
            "[data-project-list]"
        ]);

        if (!container) return;

        container.innerHTML = projects.map(project => {
            const projectTasks = tasks.filter(
                task => task.project === project.name
            );

            const completed = projectTasks.filter(
                task => task.status === "completed"
            ).length;

            const percentage = projectTasks.length
                ? Math.round(completed / projectTasks.length * 100)
                : 0;

            return `
                <article class="project-card">
                    <div class="project-color"
                         style="background:${escapeHTML(project.color || "#6366f1")}">
                    </div>
                    <h4>${escapeHTML(project.name)}</h4>
                    <p>${projectTasks.length} tasks</p>
                    <div class="project-progress">
                        <div class="project-progress-bar"
                             style="width:${percentage}%"></div>
                    </div>
                    <small>${percentage}% completed</small>
                </article>
            `;
        }).join("");
    }

    function render() {
        renderTasks();
        renderProjects();
        saveData();
    }

    function addTask(form) {
        const formData = new FormData(form);

        const titleInput = form.querySelector(
            '[name="title"], #taskTitle, #taskName'
        );

        const projectInput = form.querySelector(
            '[name="project"], #taskProject'
        );

        const priorityInput = form.querySelector(
            '[name="priority"], #taskPriority'
        );

        const dueDateInput = form.querySelector(
            '[name="dueDate"], [name="due"], #taskDueDate, #taskDeadline'
        );

        const title = String(
            titleInput?.value || formData.get("title") || ""
        ).trim();

        if (!title) {
            if (titleInput) {
                titleInput.focus();
                titleInput.setCustomValidity("Please enter a task title.");
                titleInput.reportValidity();
            } else {
                alert("Please enter a task title.");
            }
            return;
        }

        if (titleInput) titleInput.setCustomValidity("");

        const project = String(
            projectInput?.value || formData.get("project") || "General"
        ).trim();

        const priorityValue = String(
            priorityInput?.value || formData.get("priority") || "medium"
        ).toLowerCase();

        const priority = PRIORITY_LABELS[priorityValue]
            ? priorityValue
            : "medium";

        const dueDate = String(
            dueDateInput?.value ||
            formData.get("dueDate") ||
            formData.get("due") ||
            ""
        );

        const statusInput = form.querySelector(
            '[name="status"], #taskStatus'
        );

        const requestedStatus = String(
            statusInput?.value || "todo"
        ).toLowerCase();

        const status = ["todo", "progress", "completed"].includes(requestedStatus)
            ? requestedStatus
            : "todo";

        tasks.unshift({
            id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
            title,
            project: project || "General",
            priority,
            dueDate,
            status,
            createdAt: Date.now()
        });

        if (project && !projects.some(p => p.name === project)) {
            projects.push({
                id: "project-" + Date.now(),
                name: project,
                color: "#6366f1"
            });
        }

        form.reset();
        closeModal();
        render();
    }

    function deleteTask(id) {
        const task = tasks.find(item => item.id === id);
        if (!task) return;

        if (!confirm(`Delete "${task.title}"?`)) return;

        tasks = tasks.filter(item => item.id !== id);
        render();
    }

    function moveTask(id, newStatus) {
        const task = tasks.find(item => item.id === id);
        if (!task) return;

        if (!["todo", "progress", "completed"].includes(newStatus)) {
            return;
        }

        task.status = newStatus;
        render();
    }

    function openModal() {
        const modal = findElement([
            "#taskModal",
            "#newTaskModal",
            ".task-modal",
            "[data-task-modal]"
        ]);

        if (!modal) {
            const form = findElement(["#taskForm", "[data-task-form]"]);
            if (form) {
                const title = form.querySelector(
                    '[name="title"], #taskTitle, #taskName'
                );
                title?.focus();
            }
            return;
        }

        modal.classList.add("active", "open", "show");
        modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        const modal = findElement([
            "#taskModal",
            "#newTaskModal",
            ".task-modal",
            "[data-task-modal]"
        ]);

        if (!modal) return;

        modal.classList.remove("active", "open", "show");
        modal.setAttribute("aria-hidden", "true");
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute("data-theme")
            || localStorage.getItem(STORAGE.theme)
            || "light";

        const next = current === "dark" ? "light" : "dark";

        document.documentElement.setAttribute("data-theme", next);
        document.body.classList.toggle("dark-mode", next === "dark");
        document.body.classList.toggle("dark", next === "dark");

        localStorage.setItem(STORAGE.theme, next);
    }

    function initializeTheme() {
        let theme = "light";

        try {
            theme = localStorage.getItem(STORAGE.theme) || "light";
        } catch (error) {
            console.warn("TaskFlow could not load theme:", error);
        }

        document.documentElement.setAttribute("data-theme", theme);
        document.body.classList.toggle("dark-mode", theme === "dark");
        document.body.classList.toggle("dark", theme === "dark");
    }

    function addProject() {
        const name = prompt("Enter the new project name:");
        if (!name || !name.trim()) return;

        const cleanName = name.trim();

        if (projects.some(p =>
            p.name.toLowerCase() === cleanName.toLowerCase()
        )) {
            alert("This project already exists.");
            return;
        }

        projects.push({
            id: "project-" + Date.now(),
            name: cleanName,
            color: "#6366f1"
        });

        renderProjects();
        saveData();
    }

    function initialize() {
        initializeTheme();

        const search = findElement([
            "#searchInput",
            "#taskSearch",
            "#searchTasks",
            'input[type="search"]',
            '[name="search"]'
        ]);

        if (search) {
            search.addEventListener("input", () => {
                searchTerm = search.value.trim().toLowerCase();
                renderTasks();
            });
        }

        const filter = findElement([
            "#statusFilter",
            "#taskFilter",
            "#filterStatus",
            '[name="statusFilter"]'
        ]);

        if (filter) {
            filter.addEventListener("change", () => {
                statusFilter = filter.value || "all";
                renderTasks();
            });
        }

        const form = findElement([
            "#taskForm",
            "#newTaskForm",
            "[data-task-form]"
        ]);

        if (form) {
            form.addEventListener("submit", event => {
                event.preventDefault();
                addTask(form);
            });
        }

        // Delegated events for task actions and common buttons.
        document.addEventListener("click", event => {
            const target = event.target.closest("button, [data-action]");
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (action === "delete" && id) {
                deleteTask(id);
                return;
            }

            if (action === "move" && id) {
                moveTask(id, target.dataset.status);
                return;
            }

            if (
                target.matches("#addTaskBtn, #newTaskBtn, [data-open-task-modal]")
            ) {
                openModal();
                return;
            }

            if (
                target.matches("#closeModal, #cancelTask, [data-close-modal]")
            ) {
                closeModal();
                return;
            }

            if (
                target.matches("#themeToggle, #darkModeToggle, [data-theme-toggle]")
            ) {
                toggleTheme();
                return;
            }

            if (
                target.matches("#addProjectBtn, #newProjectBtn, [data-add-project]")
            ) {
                addProject();
            }
        });

        // Support modal close buttons and clicks on the backdrop.
        document.addEventListener("click", event => {
            const modal = event.target.closest(
                "#taskModal, #newTaskModal, .task-modal, [data-task-modal]"
            );

            if (modal && event.target === modal) {
                closeModal();
            }
        });

        render();
        console.info("TaskFlow initialized successfully.");
    }

    return {
        initialize,
        render,
        addTask,
        deleteTask,
        moveTask,
        openModal,
        closeModal,
        toggleTheme
    };
})();

document.addEventListener("DOMContentLoaded", TaskFlow.initialize);
