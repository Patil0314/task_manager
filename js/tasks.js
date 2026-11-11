/**
 * tasks.js
 * ────────
 * Pure business-logic layer for TaskFlow.
 * No DOM manipulation here – only task data operations.
 */

/* ── In-memory task store ── */
var tasks = [];

/* ── Active drag-and-drop order (array of IDs) ── */
var taskOrder = [];

/* =================================================================
   INITIALISATION
   ================================================================= */

/**
 * initialiseTasks
 * Loads tasks from localStorage and applies the persisted order.
 */
function initialiseTasks() {
  const loaded = loadFromLocalStorage().filter(Boolean); // remove null sentinel values
  const order  = loadOrderFromLocalStorage();

  if (order.length > 0) {
    // Reorder tasks to match saved order; append any that are not in the order list
    const orderMap = new Map(order.map((id, idx) => [id, idx]));
    loaded.sort((a, b) => {
      const ia = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
      const ib = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
      return ia - ib;
    });
  }

  tasks     = loaded;
  taskOrder = tasks.map(t => t.id);
}

/* =================================================================
   CRUD OPERATIONS
   ================================================================= */

/**
 * createTask
 * Creates a new task object, adds it to the store, and persists.
 *
 * @param {Object} data – { title, description, category, dueDate }
 * @returns {Object} The newly created task.
 */
function createTask({ title, description = '', category = 'Other', dueDate = '' }) {
  const task = {
    id:          generateId(),
    title:       title.trim(),
    description: description.trim(),
    category,
    dueDate,
    completed:   false,
    createdAt:   new Date().toISOString(),
  };

  tasks.push(task);
  taskOrder.push(task.id);
  persistAll();
  return task;
}

/**
 * updateTask
 * Merges the supplied fields into the matching task and persists.
 *
 * @param {string} id     – ID of the task to update.
 * @param {Object} fields – Partial task data to merge.
 * @returns {Object|null} Updated task, or null if not found.
 */
function updateTask(id, fields) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  tasks[index] = {
    ...tasks[index],
    ...fields,
    id:        tasks[index].id,        // ID is immutable
    createdAt: tasks[index].createdAt, // createdAt is immutable
  };

  persistAll();
  return tasks[index];
}

/**
 * deleteTask
 * Removes a task by ID from the store and persists.
 *
 * @param {string} id – ID of the task to delete.
 * @returns {boolean} True if the task was found and deleted.
 */
function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  taskOrder = taskOrder.filter(tid => tid !== id);
  persistAll();
  return true;
}

/**
 * toggleTaskComplete
 * Flips the completed state of a task and persists.
 *
 * @param {string} id – Task ID.
 * @returns {Object|null} Updated task, or null if not found.
 */
function toggleTaskComplete(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return null;
  return updateTask(id, { completed: !task.completed });
}

/**
 * clearCompletedTasks
 * Removes all completed tasks from the store and persists.
 *
 * @returns {number} Count of deleted tasks.
 */
function clearCompletedTasks() {
  const before = tasks.length;
  tasks     = tasks.filter(t => !t.completed);
  taskOrder = taskOrder.filter(id => tasks.some(t => t.id === id));
  persistAll();
  return before - tasks.length;
}

/**
 * reorderTasks
 * Updates the display order after drag-and-drop and persists.
 *
 * @param {string[]} newOrder – Array of task IDs in the desired order.
 */
function reorderTasks(newOrder) {
  taskOrder = newOrder;
  // Re-sort the tasks array to match
  const idxMap = new Map(newOrder.map((id, i) => [id, i]));
  tasks.sort((a, b) => {
    const ia = idxMap.has(a.id) ? idxMap.get(a.id) : tasks.length;
    const ib = idxMap.has(b.id) ? idxMap.get(b.id) : tasks.length;
    return ia - ib;
  });
  persistAll();
}

/* =================================================================
   QUERY / FILTER / SORT
   ================================================================= */

/**
 * getFilteredAndSortedTasks
 * Returns a filtered + sorted subset of tasks based on the current
 * UI state (status filter, category filter, search query, sort mode,
 * and optional view override).
 *
 * @param {Object} options
 * @param {string} options.statusFilter   – 'all' | 'active' | 'completed'
 * @param {string} options.categoryFilter – 'all' | 'Work' | 'Personal' | 'Study' | 'Other'
 * @param {string} options.searchQuery    – Free-text search string
 * @param {string} options.sortMode       – 'newest' | 'dueDate' | 'alphabetical'
 * @param {string} [options.viewOverride] – 'today' | 'upcoming' (overrides status filter)
 * @returns {Object[]} Filtered & sorted task array.
 */
function getFilteredAndSortedTasks({ statusFilter, categoryFilter, searchQuery, sortMode, viewOverride }) {
  const today    = getTodayString();
  let   filtered = [...tasks];

  // ── View override (sidebar navigation) ──────────────────────────
  if (viewOverride === 'today') {
    filtered = filtered.filter(t => t.dueDate === today);
  } else if (viewOverride === 'upcoming') {
    filtered = filtered.filter(t => t.dueDate && t.dueDate > today && !t.completed);
  } else {
    // ── Status filter ──────────────────────────────────────────────
    if (statusFilter === 'active') {
      filtered = filtered.filter(t => !t.completed);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }
  }

  // ── Category filter ──────────────────────────────────────────────
  if (categoryFilter && categoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === categoryFilter);
  }

  // ── Search ───────────────────────────────────────────────────────
  const q = (searchQuery || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }

  // ── Sort ─────────────────────────────────────────────────────────
  switch (sortMode) {
    case 'dueDate':
      filtered.sort((a, b) => {
        // Tasks without a due date go to the end
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      break;

    case 'alphabetical':
      filtered.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
      break;

    case 'newest':
    default:
      // Respect the user-defined drag-and-drop order first;
      // fall back to creation date descending for unordered tasks
      filtered.sort((a, b) => {
        const ia = taskOrder.indexOf(a.id);
        const ib = taskOrder.indexOf(b.id);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      break;
  }

  return filtered;
}

/* =================================================================
   STATISTICS
   ================================================================= */

/**
 * getTaskStats
 * Computes totals used by the stats cards and sidebar badges.
 *
 * @returns {Object} { total, active, completed, overdue, today, upcoming, work, personal, study, other }
 */
function getTaskStats() {
  const today = getTodayString();

  return {
    total:     tasks.length,
    active:    tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t =>  t.completed).length,
    overdue:   tasks.filter(t => !t.completed && t.dueDate && t.dueDate < today).length,
    today:     tasks.filter(t => t.dueDate === today).length,
    upcoming:  tasks.filter(t => !t.completed && t.dueDate && t.dueDate > today).length,
    work:      tasks.filter(t => t.category === 'Work').length,
    personal:  tasks.filter(t => t.category === 'Personal').length,
    study:     tasks.filter(t => t.category === 'Study').length,
    other:     tasks.filter(t => t.category === 'Other').length,
  };
}

/* =================================================================
   DATE UTILITIES
   ================================================================= */

/**
 * getTodayString
 * @returns {string} Today's date in 'YYYY-MM-DD' format (local time).
 */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * getDueDateStatus
 * Classifies a due date relative to today.
 *
 * @param {string} dueDate – 'YYYY-MM-DD' or empty string.
 * @returns {'overdue'|'today'|'upcoming'|'none'}
 */
function getDueDateStatus(dueDate) {
  if (!dueDate) return 'none';
  const today = getTodayString();
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'upcoming';
}

/**
 * formatDueDate
 * Returns a human-readable due date string.
 *
 * @param {string} dueDate – 'YYYY-MM-DD'
 * @returns {string}
 */
function formatDueDate(dueDate) {
  if (!dueDate) return '';
  const [y, m, d]  = dueDate.split('-').map(Number);
  const date        = new Date(y, m - 1, d);
  const today       = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow    = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime())    return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* =================================================================
   INTERNAL HELPERS
   ================================================================= */

/**
 * persistAll
 * Writes both the tasks array and the order array to localStorage.
 */
function persistAll() {
  saveToLocalStorage(tasks);
  saveOrderToLocalStorage(taskOrder);
}

