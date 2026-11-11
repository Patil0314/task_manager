/**
 * storage.js
 * ──────────
 * Handles all localStorage interactions for TaskFlow.
 * Provides safe read / write helpers with error handling.
 */

const STORAGE_KEY = 'taskflow_tasks';
const ORDER_KEY   = 'taskflow_order';

/**
 * saveToLocalStorage
 * Serialises the tasks array to JSON and writes it to localStorage.
 * Silently fails if localStorage is unavailable (private mode / quota exceeded).
 *
 * @param {Array} tasks – Array of task objects to persist.
 */
function saveToLocalStorage(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('[TaskFlow] Could not save to localStorage:', err.message);
  }
}

/**
 * loadFromLocalStorage
 * Reads and parses the tasks array from localStorage.
 * Returns an empty array if the data is missing, corrupted, or not an array.
 *
 * @returns {Array} Parsed tasks array (may be empty).
 */
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    // Safety: ensure the stored value really is an array of objects
    if (!Array.isArray(parsed)) return [];

    // Sanitise each record – add any missing fields introduced in later versions
    return parsed.map(sanitiseTask);
  } catch (err) {
    console.warn('[TaskFlow] Could not load from localStorage:', err.message);
    return [];
  }
}

/**
 * saveOrderToLocalStorage
 * Persists the current display order (array of task IDs) separately,
 * so drag-and-drop reordering survives a page refresh.
 *
 * @param {string[]} order – Ordered list of task IDs.
 */
function saveOrderToLocalStorage(order) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch (err) {
    console.warn('[TaskFlow] Could not save order:', err.message);
  }
}

/**
 * loadOrderFromLocalStorage
 * Retrieves the persisted task order.
 *
 * @returns {string[]} Ordered list of task IDs (may be empty).
 */
function loadOrderFromLocalStorage() {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

/**
 * sanitiseTask
 * Ensures a stored task object has all required fields.
 * Adds safe defaults for any missing properties.
 *
 * @param {Object} task – Raw task object from localStorage.
 * @returns {Object} Task object with guaranteed fields.
 */
function sanitiseTask(task) {
  if (typeof task !== 'object' || task === null) return null;

  return {
    id:          typeof task.id          === 'string' ? task.id          : generateId(),
    title:       typeof task.title       === 'string' ? task.title.trim(): 'Untitled Task',
    description: typeof task.description === 'string' ? task.description : '',
    category:    ['Work','Personal','Study','Other'].includes(task.category)
                   ? task.category : 'Other',
    dueDate:     typeof task.dueDate     === 'string' ? task.dueDate     : '',
    completed:   typeof task.completed   === 'boolean'? task.completed   : false,
    createdAt:   typeof task.createdAt   === 'string' ? task.createdAt   : new Date().toISOString(),
  };
}

/**
 * generateId
 * Creates a unique string ID combining timestamp and random characters.
 *
 * @returns {string} Unique task ID.
 */
function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

