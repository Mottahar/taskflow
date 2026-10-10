
"use strict";

/* TaskFlow | Developed by Hussein Motahar */

(() => {
  const KEYS = {
    tasks: "taskflow_tasks",
    projects: "taskflow_projects",
    theme: "taskflow_theme"
  };

  const STATUSES = ["todo", "progress", "completed"];

  const PRIORITIES = {
    high: "High",
    medium: "Medium",
    low: "Low"
  };

  const COLORS = ["#7065f0", "#2589ed", "#12a594", "#e99a35", "#e15c79"];

  const defaultProjects = [
    { id: "p1", name: "Website Redesign", color: COLORS[0] },
    { id: "p2", name: "Personal Goals", color: COLORS[2] },
    { id: "p3", name: "Learning", color: COLORS[3] }
  ];

  const defaultTasks = [
    {
      id: "t1",
      title: "Design the dashboard",
      project: "Website Redesign",
      priority: "high",
      dueDate: "",
      status: "todo",
      createdAt: Date.now()
    },
    {
      id: "t2",
      title: "Review project requirements",
      project: "Website Redesign",
      priority: "medium",
      dueDate: "",
      status: "progress",
      createdAt: Date.now()
    },
    {
      id: "t3",
      title: "Organize weekly goals",
      project: "Personal Goals",
      priority: "low",
      dueDate: "",
      status: "completed",
      createdAt: Date.now()
    }
  ];

  function loadArray(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const value = JSON.parse(saved);
        if (Array.isArray(value)) return value;
      }
    } catch (error) {
      console.error("Could not load " + key, error);
    }

    return fallback.map(item => ({ ...item }));
  }

  let tasks = loadArray(KEYS.tasks, defaultTasks);
  let projects = loadArray(KEYS.projects, defaultProjects);
  let searchText = "";
  let statusFilter = "all";
  let toastTimer;

  const $ = (selector, root = document) => root.querySelector(selector);

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  function save() {
    try {
      localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
      localStorage.setItem(KEYS.projects, JSON.stringify(projects));
    } catch (error) {
      console.error("Could not save TaskFlow data", error);
      showToast("Could not save data in this browser.");
    }
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2600);
  }

  function openModal(id) {
    const modal = $("#" + id);
    if (!modal) return;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const input = modal.querySelector("input:not([type='hidden'])");
    if (input) setTimeout(() => input.focus(), 50);
  }

  function closeModal(id) {
    const modal = $("#" + id);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".modal-backdrop.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function closeAllModals() {
    document.querySelectorAll(".modal-backdrop.is-open").forEach(modal => {
      closeModal(modal.id);
    });
  }

  function renderProjectOptions() {
    const select = $("#taskProject");
    if (!select) return;

    const previousValue = select.value;

    select.innerHTML = projects.length
      ? projects.map(project => `
          <option value="${escapeHTML(project.name)}">
            ${escapeHTML(project.name)}
          </option>
        `).join("")
      : '<option value="General">General</option>';

    if (projects.some(project => project.name === previousValue)) {
      select.value = previousValue;
    }
  }

  function renderSidebarProjects() {
    const container = $("#sidebarProjects");
    if (!container) return;

    if (!projects.length) {
      container.innerHTML = '<p class="empty-state">No projects yet.</p>';
      return;
    }

    container.innerHTML = projects.map(project => `
      <button class="sidebar-project" type="button"
              data-action="filter-project"
              data-project="${escapeHTML(project.name)}">
        <span class="project-dot"
              style="background:${escapeHTML(project.color || COLORS[0])}"></span>
        <span>${escapeHTML(project.name)}</span>
      </button>
    `).join("");
  }

  function renderProjects() {
    const container = $("#projectsList");
    if (!container) return;

    if (!projects.length) {
      container.innerHTML = `
        <div class="project-card">
          <h4>No projects yet</h4>
          <p>Create a project to organize your tasks.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(project => {
      const related = tasks.filter(task => task.project === project.name);
      const done = related.filter(task => task.status === "completed").length;
      const percentage = related.length
        ? Math.round(done / related.length * 100)
        : 0;

      return `
        <article class="project-card">
          <div class="project-card-top">
            <div class="project-color"
                 style="background:${escapeHTML(project.color || COLORS[0])}"></div>
            <button class="project-menu" type="button"
                    data-action="delete-project"
                    data-id="${escapeHTML(project.id)}"
                    aria-label="Delete project"
                    title="Delete project">⋯</button>
          </div>
          <h4>${escapeHTML(project.name)}</h4>
          <p>${related.length} ${related.length === 1 ? "task" : "tasks"}</p>
          <div class="project-progress">
            <div class="project-progress-bar" style="width:${percentage}%"></div>
          </div>
          <div class="project-meta">
            <span>${percentage}% completed</span>
            <span>${done}/${related.length}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function visibleTasks() {
    return tasks.filter(task => {
      const query = searchText.toLowerCase();

      const matchesText = [
        task.title,
        task.project,
        task.priority
      ].some(value => String(value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesText && matchesStatus;
    });
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function renderTask(task) {
    const priority = PRIORITIES[task.priority] ? task.priority : "medium";

    const nextStatus = {
      todo: "progress",
      progress: "completed",
      completed: "todo"
    }[task.status] || "todo";

    const actionLabel = {
      todo: "Start task →",
      progress: "Mark completed ✓",
      completed: "Reopen task ↻"
    }[task.status] || "Start task →";

    return `
      <article class="task-card">
        <div class="task-card-header">
          <h5>${escapeHTML(task.title)}</h5>
          <button class="task-delete" type="button"
                  data-action="delete-task"
                  data-id="${escapeHTML(task.id)}"
                  aria-label="Delete ${escapeHTML(task.title)}"
                  title="Delete task">×</button>
        </div>

        <div class="task-project">${escapeHTML(task.project || "General")}</div>

        <div class="task-footer">
          <span class="priority ${priority}">
            ${PRIORITIES[priority]}
          </span>
          ${task.dueDate
            ? `<span class="task-date">${escapeHTML(formatDate(task.dueDate))}</span>`
            : ""}
        </div>

        <button class="task-status-button" type="button"
                data-action="move-task"
                data-id="${escapeHTML(task.id)}"
                data-status="${nextStatus}">
          ${actionLabel}
        </button>
      </article>
    `;
  }

  function renderTasks() {
    const filtered = visibleTasks();

    for (const status of STATUSES) {
      const column = $("#" + ({
        todo: "todoTasks",
        progress: "progressTasks",
        completed: "completedTasks"
      })[status]);

      const count = $("#" + ({
        todo: "todoColumnCount",
        progress: "progressColumnCount",
        completed: "completedColumnCount"
      })[status]);

      const columnTasks = filtered.filter(task => task.status === status);

      if (column) {
        column.innerHTML = columnTasks.length
          ? columnTasks.map(renderTask).join("")
          : '<p class="empty-state">No tasks here yet.</p>';
      }

      if (count) count.textContent = columnTasks.length;
    }

    const emptyMessage = $("#emptySearchMessage");
    if (emptyMessage) {
      emptyMessage.hidden = !(searchText && filtered.length === 0);
    }

    renderStats();
  }

  function renderStats() {
    const total = tasks.length;
    const todo = tasks.filter(task => task.status === "todo").length;
    const progress = tasks.filter(task => task.status === "progress").length;
    const completed = tasks.filter(task => task.status === "completed").length;
    const rate = total ? Math.round(completed / total * 100) : 0;

    $("#totalTasks").textContent = total;
    $("#todoCount").textContent = todo;
    $("#progressCount").textContent = progress;
    $("#completedCount").textContent = completed;
    $("#completionRate").textContent = rate + "%";
  }

  function renderAll() {
    renderProjectOptions();
    renderSidebarProjects();
    renderProjects();
    renderTasks();
  }

  function addTask(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();

    if (!title) {
      $("#taskTitle").focus();
      showToast("Please enter a task title.");
      return;
    }

    const project = String(data.get("project") || "General");
    const priority = String(data.get("priority") || "medium");
    const status = String(data.get("status") || "todo");

    tasks.unshift({
      id: "task-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      title,
      project,
      priority: PRIORITIES[priority] ? priority : "medium",
      dueDate: String(data.get("dueDate") || ""),
      status: STATUSES.includes(status) ? status : "todo",
      createdAt: Date.now()
    });

    closeModal("taskModal");
    form.reset();
    save();
    renderAll();
    showToast("Task created successfully.");
  }

  function addProject(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();

    if (!name) {
      $("#projectName").focus();
      showToast("Please enter a project name.");
      return;
    }

    const duplicate = projects.some(project =>
      project.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      showToast("A project with this name already exists.");
      return;
    }

    projects.push({
      id: "project-" + Date.now(),
      name,
      color: String(data.get("color") || COLORS[0])
    });

    closeModal("projectModal");
    form.reset();
    save();
    renderAll();
    showToast("Project created successfully.");
  }

  function deleteTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    if (!confirm(`Delete task "${task.title}"?`)) return;

    tasks = tasks.filter(item => item.id !== id);
    save();
    renderAll();
    showToast("Task deleted.");
  }

  function moveTask(id, status) {
    const task = tasks.find(item => item.id === id);
    if (!task || !STATUSES.includes(status)) return;

    task.status = status;
    save();
    renderAll();
    showToast("Task status updated.");
  }

  function deleteProject(id) {
    const project = projects.find(item => item.id === id);
    if (!project) return;

    const relatedCount = tasks.filter(task => task.project === project.name).length;
    const message = relatedCount
      ? `Delete "${project.name}"? Its ${relatedCount} related task(s) will move to General.`
      : `Delete project "${project.name}"?`;

    if (!confirm(message)) return;

    tasks.forEach(task => {
      if (task.project === project.name) task.project = "General";
    });

    projects = projects.filter(item => item.id !== id);
    save();
    renderAll();
    showToast("Project deleted.");
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem(KEYS.theme, next);
    } catch (error) {
      console.warn("Could not save theme preference.", error);
    }

    const button = $("#themeToggle");
    if (button) {
      button.textContent = next === "dark" ? "☀" : "☾";
      button.setAttribute(
        "aria-label",
        next === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }

    const metaTheme = $('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = next === "dark" ? "#141622" : "#f5f7fb";
    }
  }

  function initializeTheme() {
    let theme = "light";

    try {
      theme = localStorage.getItem(KEYS.theme) || "light";
    } catch (error) {
      console.warn("Could not read theme preference.", error);
    }

    document.documentElement.dataset.theme = theme;

    const button = $("#themeToggle");
    if (button) button.textContent = theme === "dark" ? "☀" : "☾";
  }

  function updateTodayLabel() {
    const label = $("#todayLabel");
    if (!label) return;

    label.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(new Date()).toUpperCase();
  }

  function bindEvents() {
    // All New Task buttons.
    [
      "#addTaskBtn",
      "#headerAddTaskBtn"
    ].forEach(selector => {
      $(selector).addEventListener("click", () => {
        renderProjectOptions();
        openModal("taskModal");
      });
    });

    // All New Project buttons.
    [
      "#addProjectBtn",
      "#welcomeAddProjectBtn",
      "#sidebarAddProjectBtn"
    ].forEach(selector => {
      $(selector).addEventListener("click", () => {
        openModal("projectModal");
      });
    });

    $("#taskForm").addEventListener("submit", addTask);
    $("#projectForm").addEventListener("submit", addProject);

    $("#closeTaskModalBtn").addEventListener("click", () => closeModal("taskModal"));
    $("#cancelTaskBtn").addEventListener("click", () => closeModal("taskModal"));

    $("#closeProjectModalBtn").addEventListener("click", () => closeModal("projectModal"));
    $("#cancelProjectBtn").addEventListener("click", () => closeModal("projectModal"));

    $("#themeToggle").addEventListener("click", toggleTheme);

    $("#searchInput").addEventListener("input", event => {
      searchText = event.target.value.trim().toLowerCase();
      renderTasks();
    });

    $("#statusFilter").addEventListener("change", event => {
      statusFilter = event.target.value;
      renderTasks();
    });

    // One delegated listener handles task and project card actions.
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-action]");
      if (!button) return;

      const { action, id, status, project } = button.dataset;

      if (action === "delete-task") deleteTask(id);
      if (action === "move-task") moveTask(id, status);
      if (action === "delete-project") deleteProject(id);

      if (action === "filter-project") {
        searchText = String(project || "").toLowerCase();
        $("#searchInput").value = project || "";
        statusFilter = "all";
        $("#statusFilter").value = "all";
        renderTasks();
        $("#task-board").scrollIntoView({ behavior: "smooth" });
      }
    });

    // Clicking the dark backdrop closes the relevant dialog.
    document.querySelectorAll(".modal-backdrop").forEach(modal => {
      modal.addEventListener("click", event => {
        if (event.target === modal) closeModal(modal.id);
      });
    });

    // Escape closes open dialogs; Ctrl/Cmd+K focuses search.
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeAllModals();

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        $("#searchInput").focus();
      }
    });

    // Keep the sidebar navigation active while navigating.
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => {
          item.classList.remove("active");
        });
        link.classList.add("active");
      });
    });
  }

  function initialize() {
    try {
      bindEvents();
      initializeTheme();
      updateTodayLabel();
      renderAll();
      console.info("TaskFlow initialized successfully.");
    } catch (error) {
      console.error("TaskFlow initialization failed:", error);
      showToast("TaskFlow could not initialize. Check the browser console.");
    }
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
