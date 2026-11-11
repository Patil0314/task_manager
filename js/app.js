/**
 * app.js
 * ──────
 * UI controller for TaskFlow – wires up DOM interactions,
 * delegates data work to tasks.js, and renders the view.
 *
 * Responsibilities:
 *   • Modal open / close
 *   • Form validation & submission (create + edit)
 *   • Task list rendering
 *   • Filter / search / sort state management
 *   • Sidebar navigation & view switching
 *   • Drag-and-drop reordering
 *   • Toast notifications
 *   • Stats & badge updates
 */

/* =================================================================
   STATE
   ================================================================= */
var state = {
  statusFilter:   'all',      // 'all' | 'active' | 'completed'
  categoryFilter: 'all',      // 'all' | category name
  searchQuery:    '',
  sortMode:       'newest',   // 'newest' | 'dueDate' | 'alphabetical'
  currentView:    'dashboard',// 'dashboard' | 'all' | 'today' | 'upcoming' | category
  viewOverride:   null,       // 'today' | 'upcoming' | null
  pendingDeleteId: null,
};

/* =================================================================
   DOM REFERENCES
   ================================================================= */
var $ = id => document.getElementById(id);

var els = {
  // Sidebar
  sidebar:         $('sidebar'),
  sidebarOverlay:  $('sidebarOverlay'),
  sidebarCloseBtn: $('sidebarCloseBtn'),
  hamburgerBtn:    $('hamburgerBtn'),
  clearCompleted:  $('clearCompletedBtn'),
  navItems:        document.querySelectorAll('.nav-item[data-view]'),
  categoryNavItems:document.querySelectorAll('.nav-item[data-category]'),

  // Stats
  statTotal:    $('statTotal'),
  statActive:   $('statActive'),
  statCompleted:$('statCompleted'),
  statOverdue:  $('statOverdue'),
  progressBar:  $('progressBar'),
  progressPct:  $('progressPct'),
  progressTrack:$('progressTrack'),

  // Nav badges
  navBadgeAll:     $('navBadgeAll'),
  navBadgeToday:   $('navBadgeToday'),
  navBadgeUpcoming:$('navBadgeUpcoming'),
  navCatWork:      $('navCatWork'),
  navCatPersonal:  $('navCatPersonal'),
  navCatStudy:     $('navCatStudy'),
  navCatOther:     $('navCatOther'),

  // Controls
  searchInput:    $('searchInput'),
  searchClear:    $('searchClear'),
  categoryFilter: $('categoryFilter'),
  sortSelect:     $('sortSelect'),

  // Filter tabs
  filterTabs: document.querySelectorAll('.filter-tab'),

  // Task list
  taskList:   $('taskList'),
  emptyState: $('emptyState'),
  emptyTitle: $('emptyTitle'),
  emptySubtitle: $('emptySubtitle'),

  // Add buttons
  addTaskBtnMain: $('addTaskBtnMain'),
  topAddBtn:      $('topAddBtn'),

  // Task modal
  modalBackdrop:  $('modalBackdrop'),
  taskModal:      $('taskModal'),
  modalTitle:     $('modalTitle'),
  modalCloseBtn:  $('modalCloseBtn'),
  cancelTaskBtn:  $('cancelTaskBtn'),
  taskForm:       $('taskForm'),
  editTaskId:     $('editTaskId'),
  taskTitle:      $('taskTitle'),
  taskDescription:$('taskDescription'),
  taskCategory:   $('taskCategory'),
  taskDueDate:    $('taskDueDate'),
  titleError:     $('titleError'),
  descCount:      $('descCount'),
  saveBtnText:    $('saveBtnText'),

  // Delete modal
  deleteBackdrop:  $('deleteBackdrop'),
  deleteModal:     $('deleteModal'),
  deleteTaskName:  $('deleteTaskName'),
  cancelDeleteBtn: $('cancelDeleteBtn'),
  confirmDeleteBtn:$('confirmDeleteBtn'),

  // Toast
  toastContainer: $('toastContainer'),

  // Greeting
  greetingTime:   $('greetingTime'),
};

/* =================================================================
   BOOTSTRAP
   ================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initialiseTasks();
  setGreeting();
  bindEvents();
  renderAll();
});

/* =================================================================
   GREETING
   ================================================================= */
function setGreeting() {
  const hour = new Date().getHours();
  let   part = 'Evening';
  if (hour < 12) part = 'Morning';
  else if (hour < 17) part = 'Afternoon';
  els.greetingTime.textContent = part;
}

/* =================================================================
   EVENT BINDING
   ================================================================= */
function bindEvents() {
  // ── Sidebar toggle (mobile) ──────────────────────────────────────
  els.hamburgerBtn.addEventListener('click',    openSidebar);
  els.sidebarCloseBtn.addEventListener('click', closeSidebar);
  els.sidebarOverlay.addEventListener('click',  closeSidebar);

  // ── Sidebar navigation ───────────────────────────────────────────
  els.navItems.forEach(btn => {
    btn.addEventListener('click', () => handleNavClick(btn.dataset.view));
  });

  els.categoryNavItems.forEach(btn => {
    btn.addEventListener('click', () => handleCategoryNavClick(btn.dataset.category));
  });

  // ── Add task buttons ─────────────────────────────────────────────
  els.addTaskBtnMain.addEventListener('click', () => openAddModal());
  els.topAddBtn.addEventListener('click',      () => openAddModal());

  // ── Clear completed ──────────────────────────────────────────────
  els.clearCompleted.addEventListener('click', handleClearCompleted);

  // ── Search ───────────────────────────────────────────────────────
  els.searchInput.addEventListener('input', () => {
    state.searchQuery = els.searchInput.value;
    els.searchClear.hidden = !state.searchQuery;
    renderTaskList();
  });

  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    state.searchQuery = '';
    els.searchClear.hidden = true;
    els.searchInput.focus();
    renderTaskList();
  });

  // ── Category filter select ───────────────────────────────────────
  els.categoryFilter.addEventListener('change', () => {
    state.categoryFilter = els.categoryFilter.value;
    renderTaskList();
  });

  // ── Sort select ──────────────────────────────────────────────────
  els.sortSelect.addEventListener('change', () => {
    state.sortMode = els.sortSelect.value;
    renderTaskList();
  });

  // ── Filter tabs ──────────────────────────────────────────────────
  els.filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      state.statusFilter  = tab.dataset.filter;
      state.viewOverride  = null;
      els.filterTabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      renderTaskList();
    });
  });

  // ── Task modal ───────────────────────────────────────────────────
  els.modalCloseBtn.addEventListener('click',  closeTaskModal);
  els.cancelTaskBtn.addEventListener('click',  closeTaskModal);
  els.modalBackdrop.addEventListener('click',  closeTaskModal);
  els.taskForm.addEventListener('submit',      handleTaskFormSubmit);

  // Character counter for description
  els.taskDescription.addEventListener('input', () => {
    const len = els.taskDescription.value.length;
    els.descCount.textContent = `${len} / 500`;
  });

  // ── Delete modal ─────────────────────────────────────────────────
  els.cancelDeleteBtn.addEventListener('click',  closeDeleteModal);
  els.deleteBackdrop.addEventListener('click',   closeDeleteModal);
  els.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // ── Keyboard: close modals with Escape ──────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (els.taskModal.classList.contains('open'))   closeTaskModal();
      if (els.deleteModal.classList.contains('open')) closeDeleteModal();
      if (els.sidebar.classList.contains('open'))     closeSidebar();
    }
  });
}

/* =================================================================
   SIDEBAR
   ================================================================= */
function openSidebar() {
  els.sidebar.classList.add('open');
  els.sidebarOverlay.classList.add('open');
  els.hamburgerBtn.setAttribute('aria-expanded', 'true');
  els.sidebarOverlay.removeAttribute('aria-hidden');
}

function closeSidebar() {
  els.sidebar.classList.remove('open');
  els.sidebarOverlay.classList.remove('open');
  els.hamburgerBtn.setAttribute('aria-expanded', 'false');
  els.sidebarOverlay.setAttribute('aria-hidden', 'true');
}

function handleNavClick(view) {
  // Reset category filter when navigating by view
  state.viewOverride  = null;
  state.categoryFilter = 'all';
  els.categoryFilter.value = 'all';

  if (view === 'today') {
    state.viewOverride = 'today';
  } else if (view === 'upcoming') {
    state.viewOverride = 'upcoming';
  }

  state.currentView = view;
  setActiveNavItem(view);
  closeSidebar();
  renderTaskList();
}

function handleCategoryNavClick(category) {
  state.viewOverride  = null;
  state.categoryFilter = category;
  els.categoryFilter.value = category;
  state.currentView   = category;
  setActiveNavItem(null, category);
  closeSidebar();
  renderTaskList();
}

function setActiveNavItem(view, category) {
  els.navItems.forEach(btn => {
    const isActive = view ? btn.dataset.view === view : false;
    btn.classList.toggle('active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else          btn.removeAttribute('aria-current');
  });

  els.categoryNavItems.forEach(btn => {
    const isActive = category ? btn.dataset.category === category : false;
    btn.classList.toggle('active', isActive);
    if (isActive) btn.setAttribute('aria-current', 'page');
    else          btn.removeAttribute('aria-current');
  });
}

/* =================================================================
   ADD / EDIT MODAL
   ================================================================= */
function openAddModal() {
  els.editTaskId.value     = '';
  els.taskTitle.value      = '';
  els.taskDescription.value= '';
  els.taskCategory.value   = 'Work';
  els.taskDueDate.value    = '';
  els.titleError.textContent = '';
  els.taskTitle.classList.remove('error');
  els.descCount.textContent = '0 / 500';
  els.modalTitle.textContent = 'Add New Task';
  els.saveBtnText.textContent = 'Add Task';

  openModal(els.taskModal, els.modalBackdrop);
  // Focus the title input after animation
  setTimeout(() => els.taskTitle.focus(), 50);
}

function openEditModal(task) {
  els.editTaskId.value      = task.id;
  els.taskTitle.value       = task.title;
  els.taskDescription.value = task.description;
  els.taskCategory.value    = task.category;
  els.taskDueDate.value     = task.dueDate || '';
  els.titleError.textContent = '';
  els.taskTitle.classList.remove('error');
  els.descCount.textContent = `${task.description.length} / 500`;
  els.modalTitle.textContent = 'Edit Task';
  els.saveBtnText.textContent = 'Save Changes';

  openModal(els.taskModal, els.modalBackdrop);
  setTimeout(() => els.taskTitle.focus(), 50);
}

function closeTaskModal() {
  closeModal(els.taskModal, els.modalBackdrop);
}

function openModal(modal, backdrop) {
  modal.classList.add('open');
  backdrop.classList.add('open');
  backdrop.removeAttribute('aria-hidden');
  modal.setAttribute('open', '');
  document.body.style.overflow = 'hidden';
}

function closeModal(modal, backdrop) {
  modal.classList.remove('open');
  backdrop.classList.remove('open');
  backdrop.setAttribute('aria-hidden', 'true');
  modal.removeAttribute('open');
  document.body.style.overflow = '';
}

/* =================================================================
   FORM SUBMISSION
   ================================================================= */
function handleTaskFormSubmit(e) {
  e.preventDefault();

  const title = els.taskTitle.value.trim();

  // Validation
  if (!title) {
    els.titleError.textContent = 'Task title is required.';
    els.taskTitle.classList.add('error');
    els.taskTitle.focus();
    return;
  }

  if (title.length < 2) {
    els.titleError.textContent = 'Title must be at least 2 characters.';
    els.taskTitle.classList.add('error');
    els.taskTitle.focus();
    return;
  }

  // Clear any previous error
  els.titleError.textContent = '';
  els.taskTitle.classList.remove('error');

  const data = {
    title,
    description: els.taskDescription.value.trim(),
    category:    els.taskCategory.value,
    dueDate:     els.taskDueDate.value,
  };

  const editId = els.editTaskId.value;

  if (editId) {
    // ── Update existing task ────────────────────────────────────────
    updateTask(editId, data);
    showToast('Task updated successfully', 'success');
  } else {
    // ── Create new task ─────────────────────────────────────────────
    createTask(data);
    showToast('Task added successfully', 'success');
  }

  closeTaskModal();
  renderAll();
}

/* =================================================================
   DELETE
   ================================================================= */
function openDeleteModal(task) {
  state.pendingDeleteId     = task.id;
  els.deleteTaskName.textContent = `"${task.title}"`;
  openModal(els.deleteModal, els.deleteBackdrop);
}

function closeDeleteModal() {
  state.pendingDeleteId = null;
  closeModal(els.deleteModal, els.deleteBackdrop);
}

function handleConfirmDelete() {
  if (!state.pendingDeleteId) return;

  const card = els.taskList.querySelector(`[data-id="${state.pendingDeleteId}"]`);
  if (card) {
    // Animate out
    card.style.transition = 'opacity 200ms ease, transform 200ms ease';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(20px)';
    setTimeout(() => {
      deleteTask(state.pendingDeleteId);
      closeDeleteModal();
      renderAll();
      showToast('Task deleted', 'success');
    }, 200);
  } else {
    deleteTask(state.pendingDeleteId);
    closeDeleteModal();
    renderAll();
    showToast('Task deleted', 'success');
  }
}

/* =================================================================
   CLEAR COMPLETED
   ================================================================= */
function handleClearCompleted() {
  const count = tasks.filter(t => t.completed).length;
  if (count === 0) {
    showToast('No completed tasks to clear', 'warning');
    return;
  }

  if (window.confirm(`Remove ${count} completed task${count > 1 ? 's' : ''}?`)) {
    clearCompletedTasks();
    showToast(`Cleared ${count} completed task${count > 1 ? 's' : ''}`, 'success');
    renderAll();
  }
}

/* =================================================================
   RENDER
   ================================================================= */

/** renderAll – update stats badges AND the task list */
function renderAll() {
  renderStats();
  renderTaskList();
}

/** renderStats – update stat cards, progress bar, and sidebar badges */
function renderStats() {
  const stats = getTaskStats();

  els.statTotal.textContent     = stats.total;
  els.statActive.textContent    = stats.active;
  els.statCompleted.textContent = stats.completed;
  els.statOverdue.textContent   = stats.overdue;

  // Progress bar
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  els.progressBar.style.width = `${pct}%`;
  els.progressPct.textContent = `${pct}%`;
  els.progressTrack.setAttribute('aria-valuenow', pct);

  // Sidebar badges
  els.navBadgeAll.textContent      = stats.total;
  els.navBadgeToday.textContent    = stats.today;
  els.navBadgeUpcoming.textContent = stats.upcoming;
  els.navCatWork.textContent       = stats.work;
  els.navCatPersonal.textContent   = stats.personal;
  els.navCatStudy.textContent      = stats.study;
  els.navCatOther.textContent      = stats.other;
}

/** renderTaskList – filter, sort and paint the task list */
function renderTaskList() {
  const filtered = getFilteredAndSortedTasks({
    statusFilter:   state.statusFilter,
    categoryFilter: state.categoryFilter,
    searchQuery:    state.searchQuery,
    sortMode:       state.sortMode,
    viewOverride:   state.viewOverride,
  });

  els.taskList.innerHTML = '';

  if (filtered.length === 0) {
    els.emptyState.hidden = false;
    updateEmptyMessage();
    return;
  }

  els.emptyState.hidden = true;

  filtered.forEach(task => {
    const card = createTaskCard(task);
    els.taskList.appendChild(card);
  });

  // Re-attach drag-and-drop
  attachDragDrop();
}

/** updateEmptyMessage – contextual empty state text */
function updateEmptyMessage() {
  const q = state.searchQuery.trim();

  if (q) {
    els.emptyTitle.textContent    = 'No tasks found';
    els.emptySubtitle.innerHTML   = `No tasks match "<strong>${escapeHtml(q)}</strong>". Try a different search.`;
    return;
  }

  if (state.viewOverride === 'today') {
    els.emptyTitle.textContent   = 'Nothing due today';
    els.emptySubtitle.innerHTML  = 'You\'re all caught up! Add a task with today\'s date.';
    return;
  }

  if (state.viewOverride === 'upcoming') {
    els.emptyTitle.textContent   = 'No upcoming tasks';
    els.emptySubtitle.innerHTML  = 'No future-dated tasks yet. Add one to get started.';
    return;
  }

  if (state.statusFilter === 'completed') {
    els.emptyTitle.textContent   = 'No completed tasks';
    els.emptySubtitle.innerHTML  = 'Mark a task as done to see it here.';
    return;
  }

  if (state.statusFilter === 'active') {
    els.emptyTitle.textContent   = 'All done!';
    els.emptySubtitle.innerHTML  = 'No active tasks. Add a new one or check the <strong>Completed</strong> tab.';
    return;
  }

  if (state.categoryFilter !== 'all') {
    els.emptyTitle.textContent   = `No ${state.categoryFilter} tasks`;
    els.emptySubtitle.innerHTML  = `You have no tasks in the <strong>${escapeHtml(state.categoryFilter)}</strong> category yet.`;
    return;
  }

  els.emptyTitle.textContent   = 'No tasks yet';
  els.emptySubtitle.innerHTML  = 'Click <strong>Add Task</strong> to create your first task.';
}

/* =================================================================
   TASK CARD CREATION
   ================================================================= */
function createTaskCard(task) {
  const li = document.createElement('li');
  li.className = 'task-card';
  li.dataset.id = task.id;
  li.setAttribute('draggable', 'true');
  li.setAttribute('role', 'listitem');

  const dateStatus = getDueDateStatus(task.dueDate);

  if (task.completed)              li.classList.add('completed');
  if (dateStatus === 'overdue' && !task.completed)  li.classList.add('overdue');
  if (dateStatus === 'today'   && !task.completed)  li.classList.add('due-today');

  // ── Category meta ────────────────────────────────────────────────
  const catClass = task.category.toLowerCase();
  const catEmoji = { Work:'💼', Personal:'🏠', Study:'📚', Other:'🌟' }[task.category] || '';

  // ── Due date meta ────────────────────────────────────────────────
  let dueDateHTML = '';
  if (task.dueDate) {
    const label       = formatDueDate(task.dueDate);
    const statusClass = dateStatus !== 'none' ? dateStatus : '';
    const extraBadge  = !task.completed && dateStatus === 'overdue'
      ? '<span class="overdue-badge">Overdue</span>'
      : (!task.completed && dateStatus === 'today' ? '<span class="today-badge">Today</span>' : '');

    dueDateHTML = `
      <span class="task-due ${statusClass}" aria-label="Due date: ${label}">
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M1 5h10" stroke="currentColor" stroke-width="1.3"/>
          <path d="M4 1v2M8 1v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        ${escapeHtml(label)}
      </span>
      ${extraBadge}`;
  }

  // ── Description ──────────────────────────────────────────────────
  const descHTML = task.description
    ? `<p class="task-description">${escapeHtml(task.description)}</p>`
    : '';

  li.innerHTML = `
    <div class="drag-handle" aria-hidden="true" title="Drag to reorder">
      <svg viewBox="0 0 14 14" fill="none">
        <circle cx="4.5" cy="3"  r="1" fill="currentColor"/>
        <circle cx="4.5" cy="7"  r="1" fill="currentColor"/>
        <circle cx="4.5" cy="11" r="1" fill="currentColor"/>
        <circle cx="9.5" cy="3"  r="1" fill="currentColor"/>
        <circle cx="9.5" cy="7"  r="1" fill="currentColor"/>
        <circle cx="9.5" cy="11" r="1" fill="currentColor"/>
      </svg>
    </div>

    <div class="task-checkbox-wrap">
      <input
        type="checkbox"
        class="task-checkbox"
        id="chk-${task.id}"
        aria-label="Mark task '${escapeHtml(task.title)}' as ${task.completed ? 'active' : 'complete'}"
        ${task.completed ? 'checked' : ''}
      />
    </div>

    <div class="task-body">
      <div class="task-header">
        <label class="task-title" for="chk-${task.id}">${escapeHtml(task.title)}</label>
        <div class="task-actions" role="group" aria-label="Task actions">
          <button
            class="task-action-btn edit"
            aria-label="Edit task '${escapeHtml(task.title)}'"
            title="Edit task"
          >
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M11 2l3 3L5 14H2v-3L11 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
            class="task-action-btn delete"
            aria-label="Delete task '${escapeHtml(task.title)}'"
            title="Delete task"
          >
            <svg viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V3h6v1M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      ${descHTML}

      <div class="task-meta">
        <span class="category-badge cat-${catClass}" aria-label="Category: ${escapeHtml(task.category)}">
          ${catEmoji} ${escapeHtml(task.category)}
        </span>
        ${dueDateHTML}
      </div>
    </div>
  `;

  // ── Checkbox toggle ──────────────────────────────────────────────
  const checkbox = li.querySelector('.task-checkbox');
  checkbox.addEventListener('change', () => handleToggleComplete(task.id, li));

  // ── Edit button ──────────────────────────────────────────────────
  li.querySelector('.task-action-btn.edit').addEventListener('click', () => {
    // Find the latest version of the task
    const latest = tasks.find(t => t.id === task.id);
    if (latest) openEditModal(latest);
  });

  // ── Delete button ────────────────────────────────────────────────
  li.querySelector('.task-action-btn.delete').addEventListener('click', () => {
    const latest = tasks.find(t => t.id === task.id);
    if (latest) openDeleteModal(latest);
  });

  return li;
}

/* =================================================================
   TOGGLE COMPLETE (with animation)
   ================================================================= */
function handleToggleComplete(id, cardEl) {
  cardEl.classList.add('completing');

  setTimeout(() => {
    cardEl.classList.remove('completing');
    const updated = toggleTaskComplete(id);
    if (!updated) return;

    // Animate completion state change
    if (updated.completed) {
      cardEl.classList.add('completed');
      cardEl.classList.remove('overdue', 'due-today');
      showToast('Task completed! 🎉', 'success');
    } else {
      cardEl.classList.remove('completed');
      showToast('Task marked active', 'success');
    }

    renderAll(); // re-render to update stats & potential filter changes
  }, 300);
}

/* =================================================================
   DRAG-AND-DROP REORDERING
   ================================================================= */
var dragSrcId = null;

function attachDragDrop() {
  const cards = els.taskList.querySelectorAll('.task-card');

  cards.forEach(card => {
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragend',   onDragEnd);
    card.addEventListener('dragover',  onDragOver);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop',      onDrop);
  });
}

function onDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcId);
}

function onDragEnd() {
  this.classList.remove('dragging');
  els.taskList.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this.dataset.id !== dragSrcId) {
    this.classList.add('drag-over');
  }
}

function onDragLeave() {
  this.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  const targetId = this.dataset.id;
  if (!dragSrcId || dragSrcId === targetId) return;

  // Build new order from DOM
  const cards    = [...els.taskList.querySelectorAll('.task-card')];
  const srcIndex = cards.findIndex(c => c.dataset.id === dragSrcId);
  const tgtIndex = cards.findIndex(c => c.dataset.id === targetId);

  if (srcIndex === -1 || tgtIndex === -1) return;

  // Move the dragged card in the DOM
  if (srcIndex < tgtIndex) {
    this.after(cards[srcIndex]);
  } else {
    this.before(cards[srcIndex]);
  }

  // Extract new order and persist
  const newOrder = [...els.taskList.querySelectorAll('.task-card')].map(c => c.dataset.id);
  reorderTasks(newOrder);

  dragSrcId = null;
}

/* =================================================================
   TOAST NOTIFICATIONS
   ================================================================= */
/**
 * showToast
 * Displays a brief notification that auto-dismisses after 3 s.
 *
 * @param {string} message  – Notification text.
 * @param {'success'|'error'|'warning'|'info'} type
 */
function showToast(message, type = 'success') {
  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 9l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error:   `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M9 5.5v4M9 12h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><path d="M9 2L1 16h16L9 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 7v4M9 13h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    info:    `<svg class="toast-icon" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M9 8v5M9 5.5h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className  = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML  = `${icons[type] || icons.info}${escapeHtml(message)}`;

  els.toastContainer.appendChild(toast);

  // Auto-remove
  const remove = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  const timer = setTimeout(remove, 3000);

  // Click to dismiss early
  toast.addEventListener('click', () => {
    clearTimeout(timer);
    remove();
  });
}

/* =================================================================
   UTILITY
   ================================================================= */

/**
 * escapeHtml
 * Escapes characters that could break HTML rendering or cause XSS.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

