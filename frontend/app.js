
"use strict";

/* TaskFlow | Developed by Hussein Motahar */

(() => {
  const KEYS = {
    tasks: "taskflow_tasks",
    projects: "taskflow_projects",
    theme: "taskflow_theme"
  };

  const STATUSES = ["todo", "in-progress", "completed"];

  const PRIORITIES = {
    high: "High",
    medium: "Medium",
    low: "Low"
  };

  const COLORS = [
    "#7065f0",
    "#2589ed",
    "#12a594",
    "#e99a35",
    "#e15c79"
  ];

  const defaultProjects = [
    { id: "p1", name: "Website Redesign", color: COLORS[0] },
    { id: "p2", name: "Personal Goals", color: COLORS[2] },
    { id: "p3", name: "Learning", color: COLORS[3] }
  ];

  const defaultTasks = [
    {
      id: "t1",
      title: "Design the dashboard",
      description: "",
      project: "Website Redesign",
      priority: "high",
      dueDate: "",
      status: "todo",
      createdAt: Date.now()
    },
    {
      id: "t2",
      title: "Review project requirements",
      description: "",
      project: "Website Redesign",
      priority: "medium",
      dueDate: "",
      status: "in-progress",
      createdAt: Date.now()
    },
    {
      id: "t3",
      title: "Organize weekly goals",
      description: "",
      project: "Personal Goals",
      priority: "low",
      dueDate: "",
      status: "completed",
      createdAt: Date.now()
    }
  ];

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

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

  let tasks = loadArray(KEYS.tasks, defaultTasks).map(task => ({
    ...task,
    description: task.description || "",
    project: task.project || "",
    priority: PRIORITIES[task.priority] ? task.priority : "medium",
    dueDate: task.dueDate || "",
    status: task.status === "progress"
      ? "in-progress"
      : STATUSES.includes(task.status)
        ? task.status
        : "todo",
    createdAt: task.createdAt || Date.now()
  }));

  let projects = loadArray(KEYS.projects, defaultProjects);

  let searchText = "";
  let statusFilter = "all";
  let activeView = "all";
  let activeProject = "";
  let toastTimer;

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

    const input = modal.querySelector(
      "input:not([type='hidden']), textarea"
    );

    if (input) {
      setTimeout(() => input.focus(), 50);
    }
  }

  function closeModal(id) {
    const modal = $("#" + id);
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    if (!$(".modal.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function closeAllModals() {
    $$(".modal.is-open").forEach(modal => closeModal(modal.id));
  }

  function renderProjectOptions(selected = "") {
    const select = $("#taskProject");
    if (!select) return;

    select.innerHTML = [
      '<option value="">No Project</option>',
      ...projects.map(project =>
        `<option value="${escapeHTML(project.name)}">${
          escapeHTML(project.name)
        }</option>`
      )
    ].join("");

    select.value = selected;
  }

  function renderSidebarProjects() {
    const container = $("#projectList");
    if (!container) return;

    if (!projects.length) {
      container.innerHTML =
        '<p class="empty-projects">No projects yet.</p>';
      return;
    }

    container.innerHTML = projects.map(project => `
      <button
        class="project-nav-item"
        type="button"
        data-action="filter-project"
        data-project="${escapeHTML(project.name)}"
      >
        <span class="project-dot"
          style="background:${escapeHTML(project.color || COLORS[0])}">
        </span>
        <span>${escapeHTML(project.name)}</span>
        <span class="project-nav-count">${
          tasks.filter(task => task.project === project.name).length
        }</span>
      </button>
    `).join("");
  }

  function getVisibleTasks() {
    const query = searchText.toLowerCase();

    return tasks.filter(task => {
      const matchesSearch = [
        task.title,
        task.description,
        task.project,
        task.priority
      ].some(value =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      const matchesProject =
        !activeProject || task.project === activeProject;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = task.dueDate
        ? new Date(task.dueDate + "T00:00:00")
        : null;

      const matchesView =
        activeView === "all" ||
        (activeView === "today" &&
          due && due.getTime() === today.getTime()) ||
        (activeView === "upcoming" &&
          due && due.getTime() > today.getTime() &&
          task.status !== "completed") ||
        (activeView === "completed" &&
          task.status === "completed");

      return matchesSearch &&
        matchesStatus &&
        matchesProject &&
        matchesView;
    });
  }

  function sortTasks(list) {
    const mode = $("#sortSelect")?.value || "created";
    const result = [...list];

    if (mode === "due") {
      result.sort((a, b) =>
        (a.dueDate || "9999-12-31")
          .localeCompare(b.dueDate || "9999-12-31")
      );
    } else if (mode === "priority") {
      const rank = { high: 0, medium: 1, low: 2 };
      result.sort((a, b) =>
        rank[a.priority] - rank[b.priority]
      );
    } else if (mode === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    return result;
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value + "T00:00:00");
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function isOverdue(task) {
    if (!task.dueDate || task.status === "completed") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return new Date(task.dueDate + "T00:00:00") < today;
  }

  function renderTask(task) {
    const priority = PRIORITIES[task.priority]
      ? task.priority
      : "medium";

    const nextStatus = {
      todo: "in-progress",
      "in-progress": "completed",
      completed: "todo"
    }[task.status];

    const actionLabel = {
      todo: "Start task →",
      "in-progress": "Mark completed ✓",
      completed: "Reopen task ↻"
    }[task.status];

    return `
      <article class="task-card" data-task-id="${escapeHTML(task.id)}">
        <div class="task-card-header">
          <h5>${escapeHTML(task.title)}</h5>
          <div class="task-card-actions">
            <button
              class="task-edit"
              type="button"
              data-action="edit-task"
              data-id="${escapeHTML(task.id)}"
              aria-label="Edit task"
              title="Edit task"
            >✎</button>
            <button
              class="task-delete"
              type="button"
              data-action="delete-task"
              data-id="${escapeHTML(task.id)}"
              aria-label="Delete task"
              title="Delete task"
            >×</button>
          </div>
        </div>

        ${task.description
          ? `<p class="task-description">${
              escapeHTML(task.description)
            }</p>`
          : ""}

        <div class="task-project">
          ${escapeHTML(task.project || "No Project")}
        </div>

        <div class="task-footer">
          <span class="priority ${priority}">
            ${PRIORITIES[priority]}
          </span>
          ${task.dueDate
            ? `<span class="task-date ${
                isOverdue(task) ? "overdue" : ""
              }">${escapeHTML(formatDate(task.dueDate))}${
                isOverdue(task) ? " · Overdue" : ""
              }</span>`
            : ""}
        </div>

        <button
          class="task-status-button"
          type="button"
          data-action="move-task"
          data-id="${escapeHTML(task.id)}"
          data-status="${nextStatus}"
        >${actionLabel}</button>
      </article>
    `;
  }

  function renderTasks() {
    const filtered = sortTasks(getVisibleTasks());

    const columns = {
      todo: {
        list: "#todoList",
        count: "#todoCount"
      },
      "in-progress": {
        list: "#inProgressList",
        count: "#inProgressCount"
      },
      completed: {
        list: "#completedList",
        count: "#completedCount"
      }
    };

    for (const [status, config] of Object.entries(columns)) {
      const columnTasks = filtered.filter(
        task => task.status === status
      );

      const list = $(config.list);
      const count = $(config.count);

      if (list) {
        list.innerHTML = columnTasks.length
          ? columnTasks.map(renderTask).join("")
          : '<p class="empty-column">No tasks here yet.</p>';
      }

      if (count) count.textContent = columnTasks.length;
    }

    const emptyState = $("#emptyState");
    if (emptyState) {
      emptyState.hidden = filtered.length > 0;
    }

    renderStats();
  }

  function renderStats() {
    const total = tasks.length;
    const inProgress = tasks.filter(
      task => task.status === "in-progress"
    ).length;
    const completed = tasks.filter(
      task => task.status === "completed"
    ).length;
    const overdue = tasks.filter(isOverdue).length;
    const todo = tasks.filter(task => task.status === "todo").length;

    if ($("#totalTasks")) $("#totalTasks").textContent = total;
    if ($("#inProgressTasks")) {
      $("#inProgressTasks").textContent = inProgress;
    }
    if ($("#completedTasks")) {
      $("#completedTasks").textContent = completed;
    }
    if ($("#overdueTasks")) $("#overdueTasks").textContent = overdue;
    if ($("#todoCount")) $("#todoCount").textContent =
      tasks.filter(task => task.status === "todo").length;
    if ($("#allTasksNavCount")) {
      $("#allTasksNavCount").textContent = total;
    }

    // Keep the To Do count correct even when a filter is active.
    const todoCount = $("#todoCount");
    if (todoCount) todoCount.textContent = todo;
  }

  function renderAll() {
    renderProjectOptions($("#taskProject")?.value || "");
    renderSidebarProjects();
    renderTasks();
  }

  function resetTaskForm() {
    $("#taskForm")?.reset();
    if ($("#taskId")) $("#taskId").value = "";
    if ($("#taskModalTitle")) {
      $("#taskModalTitle").textContent = "Create a New Task";
    }
    if ($("#saveTaskBtn")) {
      $("#saveTaskBtn").textContent = "Save Task";
    }
    renderProjectOptions();
  }

  function openNewTask() {
    resetTaskForm();
    openModal("taskModal");
  }

  function editTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    const form = $("#taskForm");
    if (!form) return;

    $("#taskId").value = task.id;
    $("#taskTitle").value = task.title;
    $("#taskDescription").value = task.description || "";
    $("#taskStatus").value = task.status;
    $("#taskPriority").value = task.priority;
    $("#taskDueDate").value = task.dueDate || "";

    renderProjectOptions(task.project || "");

    if ($("#taskModalTitle")) {
      $("#taskModalTitle").textContent = "Edit Task";
    }
    if ($("#saveTaskBtn")) {
      $("#saveTaskBtn").textContent = "Save Changes";
    }

    openModal("taskModal");
  }

  function saveTask(event) {
    event.preventDefault();

    const title = $("#taskTitle").value.trim();

    if (!title) {
      $("#taskTitle").focus();
      showToast("Please enter a task title.");
      return;
    }

    const id = $("#taskId").value;
    const existing = tasks.find(task => task.id === id);

    const taskData = {
      title,
      description: $("#taskDescription").value.trim(),
      project: $("#taskProject").value,
      priority: $("#taskPriority").value,
      dueDate: $("#taskDueDate").value,
      status: $("#taskStatus").value
    };

    if (!STATUSES.includes(taskData.status)) {
      taskData.status = "todo";
    }

    if (!PRIORITIES[taskData.priority]) {
      taskData.priority = "medium";
    }

    if (existing) {
      Object.assign(existing, taskData);
      showToast("Task updated successfully.");
    } else {
      tasks.unshift({
        id: "task-" + Date.now() + "-" +
          Math.random().toString(36).slice(2, 7),
        ...taskData,
        createdAt: Date.now()
      });
      showToast("Task created successfully.");
    }

    closeModal("taskModal");
    resetTaskForm();
    save();
    renderAll();
  }

  function saveProject(event) {
    event.preventDefault();

    const name = $("#projectName").value.trim();
    if (!name) {
      $("#projectName").focus();
      showToast("Please enter a project name.");
      return;
    }

    if (projects.some(project =>
      project.name.toLowerCase() === name.toLowerCase()
    )) {
      showToast("A project with this name already exists.");
      return;
    }

    projects.push({
      id: "project-" + Date.now(),
      name,
      color: $("#projectColor").value || COLORS[0]
    });

    closeModal("projectModal");
    $("#projectForm").reset();
    save();
    renderAll();
    showToast("Project created successfully.");
  }

  function deleteTask(id) {
    const task = tasks.find(item => item.id === id);
    if (!task) return;

    if (!confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
      return;
    }

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

    const relatedCount = tasks.filter(
      task => task.project === project.name
    ).length;

    const message = relatedCount
      ? `Delete "${project.name}"? Its ${relatedCount} task(s) will become unassigned.`
      : `Delete project "${project.name}"?`;

    if (!confirm(message)) return;

    tasks.forEach(task => {
      if (task.project === project.name) task.project = "";
    });

    projects = projects.filter(item => item.id !== id);

    if (activeProject === project.name) {
      activeProject = "";
      activeView = "all";
    }

    save();
    renderAll();
    showToast("Project deleted.");
  }

  function setView(view, project = "") {
    activeView = view;
    activeProject = project;
    statusFilter = "all";

    if ($("#statusFilter")) $("#statusFilter").value = "all";

    $$(".nav-item").forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.filter === view &&
          !project
      );
    });

    const title = project || ({
      all: "All Tasks",
      today: "Today",
      upcoming: "Upcoming",
      completed: "Completed"
    }[view] || "All Tasks");

    if ($("#currentViewTitle")) {
      $("#currentViewTitle").textContent = title;
    }
    if ($("#pageTitle")) {
      $("#pageTitle").textContent = project
        ? project
        : view === "all"
          ? "Manage your tasks"
          : title;
    }
    if ($("#taskSectionTitle")) {
      $("#taskSectionTitle").textContent = project
        ? project + " Tasks"
        : view === "all"
          ? "My Tasks"
          : title + " Tasks";
    }

    renderTasks();
  }

  function toggleTheme() {
    const current =
      document.documentElement.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem(KEYS.theme, next);
    } catch (error) {
      console.warn("Could not save theme preference.", error);
    }

    const button = $("#themeToggle");
    if (button) {
      button.textContent = next === "dark" ? "☀" : "◐";
    }

    const meta = $('meta[name="theme-color"]');
    if (meta) {
      meta.content = next === "dark" ? "#141622" : "#f6f7fb";
    }
  }

  function initializeTheme() {
    let theme = "light";

    try {
      theme = localStorage.getItem(KEYS.theme) || "light";
    } catch (error) {
      console.warn("Could not read theme preference.", error);
    }

    document.documentElement.dataset.theme =
      theme === "dark" ? "dark" : "light";

    const button = $("#themeToggle");
    if (button) {
      button.textContent = theme === "dark" ? "☀" : "◐";
    }
  }

  function bindEvents() {
    $("#addTaskBtn")?.addEventListener("click", openNewTask);
    $("#headerAddTaskBtn")?.addEventListener("click", openNewTask);

    [
      "#addProjectBtn",
      "#sidebarAddProjectBtn",
      "#welcomeAddProjectBtn"
    ].forEach(selector => {
      $(selector)?.addEventListener("click", () => {
        $("#projectForm")?.reset();
        openModal("projectModal");
      });
    });

    $("#taskForm")?.addEventListener("submit", saveTask);
    $("#projectForm")?.addEventListener("submit", saveProject);
    $("#themeToggle")?.addEventListener("click", toggleTheme);

    $("#searchInput")?.addEventListener("input", event => {
      searchText = event.target.value.trim().toLowerCase();
      renderTasks();
    });

    $("#statusFilter")?.addEventListener("change", event => {
      statusFilter = event.target.value;
      renderTasks();
    });

    $("#sortSelect")?.addEventListener("change", renderTasks);

    $$(".nav-item[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        setView(button.dataset.filter);
      });
    });

    document.addEventListener("click", event => {
      const closeButton = event.target.closest("[data-close-modal]");
      if (closeButton) {
        closeModal(closeButton.dataset.closeModal);
        return;
      }

      const button = event.target.closest("[data-action]");
      if (!button) return;

      const { action, id, status, project } = button.dataset;

      if (action === "edit-task") editTask(id);
      if (action === "delete-task") deleteTask(id);
      if (action === "move-task") moveTask(id, status);
      if (action === "delete-project") deleteProject(id);

      if (action === "filter-project") {
        setView("all", project || "");
      }
    });

    document.addEventListener("click", event => {
      const backdrop = event.target.closest(".modal-backdrop");
      if (backdrop && event.target === backdrop) {
        const modal = backdrop.closest(".modal");
        if (modal) closeModal(modal.id);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeAllModals();

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        $("#searchInput")?.focus();
      }
    });
  }

  function initialize() {
    bindEvents();
    initializeTheme();
    renderAll();
    console.info("TaskFlow initialized successfully.");
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
