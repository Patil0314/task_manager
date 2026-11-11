# TaskFlow – Productivity Task Manager

> A modern, feature-complete task management web application built with pure HTML5, CSS3, and Vanilla JavaScript (ES6+). No frameworks, no backend, no dependencies.

---

## 📋 Project Overview

TaskFlow is a SaaS-style productivity dashboard that lets you create, organise, and track your daily tasks entirely in the browser. All data is persisted in `localStorage`, so your tasks survive page refreshes with zero server setup.

This project was built as a complete internship assignment demonstrating mastery of core web technologies.

---

## ✨ Features

### Core Task Management (CRUD)
- ✅ **Create** tasks with title, description, category, and due date
- ✅ **Edit** existing tasks via an inline modal
- ✅ **Delete** tasks with a confirmation dialog to prevent accidental loss
- ✅ **Toggle** tasks between active and completed states
- ✅ Prevents empty or too-short task submissions with inline validation

### Task Categories
| Category | Colour |
|----------|--------|
| 💼 Work | Indigo |
| 🏠 Personal | Green |
| 📚 Study | Amber |
| 🌟 Other | Purple |

Each category renders with a colour-coded badge on every task card.

### Due Dates
- Optional date picker on task creation / edit
- **Overdue** tasks highlighted with a red left border and badge
- **Today** tasks highlighted with an amber left border and badge
- Human-readable labels: "Today", "Tomorrow", or formatted date

### Filtering & Search
- **Status tabs**: All · Active · Completed
- **Category filter** dropdown (works in combination with status)
- **Quick search** by title or description (live, no submit needed)
- **Sort** by: Newest First · By Due Date · A → Z
- All filters compose correctly with each other

### Sidebar Navigation
- Dashboard (default)
- All Tasks
- Today (tasks due today)
- Upcoming (future-dated, incomplete tasks)
- Categories (Work / Personal / Study / Other)
- Live badge counts on every link

### localStorage Persistence
- Tasks auto-save on every change (create, edit, delete, toggle, reorder)
- Drag-and-drop order is persisted separately
- Safe fallback for missing or corrupted data
- Unique IDs and ISO 8601 creation timestamps stored per task

### Additional Features
- **Drag-and-drop reordering** (HTML5 native DnD API)
- **Animated completion** transition on checkbox toggle
- **Clear Completed** button in sidebar footer
- **Statistics cards**: Total · Active · Completed · Overdue
- **Progress bar** showing overall completion percentage
- **Empty-state messages** that are contextual to the active filter
- **Toast notifications** for every user action (success / error / warning)
- **Responsive layout** – full mobile experience with slide-in sidebar
- **Keyboard accessible** – Escape closes modals, focus management, ARIA labels

---

## 🛠️ Technologies Used

| Technology | Usage |
|------------|-------|
| **HTML5** | Semantic markup, `<dialog>`, `<nav>`, `<main>`, `<aside>`, `role` attributes |
| **CSS3** | Flexbox, Grid, CSS custom properties (variables), keyframe animations, transitions, media queries |
| **Vanilla JavaScript ES6+** | Modules, arrow functions, destructuring, template literals, Array methods, `const`/`let` |
| **DOM API** | `querySelector`, event delegation, `innerHTML`, `classList` |
| **localStorage API** | `getItem`, `setItem`, JSON serialisation |
| **HTML5 Drag and Drop API** | `draggable`, `dragstart`, `dragover`, `drop` events |
| **Google Fonts** | Inter (self-host fallback included) |

---

## 📁 Folder Structure

```
task_manager/
├── index.html              # App shell – semantic HTML structure
├── css/
│   └── style.css           # All styles (variables, layout, components, responsive)
├── js/
│   ├── storage.js          # localStorage helpers (save / load / sanitise)
│   ├── tasks.js            # Business logic (CRUD, filters, sorting, stats)
│   └── app.js              # UI controller (render, events, modals, DnD, toasts)
└── README.md               # This file
```

> Scripts are loaded in dependency order: `storage.js` → `tasks.js` → `app.js`

---

## 🚀 Installation & Running

TaskFlow requires **no build step, no npm, no server**.

### Option 1 – Open directly
```
Double-click index.html
```

### Option 2 – Local dev server (recommended for full DnD support)
```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using VS Code
Install the "Live Server" extension → right-click index.html → Open with Live Server
```

Then visit `http://localhost:8080` in your browser.

---

## 💾 How localStorage Works

```
localStorage
├── taskflow_tasks   → JSON array of task objects
└── taskflow_order   → JSON array of task IDs (drag-and-drop order)
```

### Task Object Shape
```json
{
  "id":          "task_1700000000000_abc1234",
  "title":       "Complete internship project",
  "description": "Build a full task manager in Vanilla JS",
  "category":    "Work",
  "dueDate":     "2024-12-01",
  "completed":   false,
  "createdAt":   "2024-11-15T08:30:00.000Z"
}
```

### Safety Mechanisms
- `try / catch` blocks around every `localStorage` call
- Schema validation (`sanitiseTask`) on every record loaded
- Graceful fallback to `[]` for any parse error
- Missing fields auto-filled with safe defaults

---

## 🖥️ Screenshots

> Replace the placeholders below with actual screenshots before submission.

| View | Screenshot |
|------|-----------|
| Dashboard (desktop) | _(screenshot placeholder)_ |
| Task modal | _(screenshot placeholder)_ |
| Mobile sidebar | _(screenshot placeholder)_ |
| Overdue tasks | _(screenshot placeholder)_ |
| Empty state | _(screenshot placeholder)_ |

---

## ✅ Testing Checklist

| # | Test | Status |
|---|------|--------|
| 1 | Create multiple tasks | ✅ |
| 2 | Edit a task and verify updated data | ✅ |
| 3 | Delete a task | ✅ |
| 4 | Mark a task completed and active | ✅ |
| 5 | Filter All / Active / Completed | ✅ |
| 6 | Filter by category | ✅ |
| 7 | Search for tasks | ✅ |
| 8 | Add tasks with and without due dates | ✅ |
| 9 | Verify overdue task highlighting | ✅ |
| 10 | Refresh browser and verify persistence | ✅ |
| 11 | Drag-and-drop reordering | ✅ |
| 12 | Mobile responsive layout | ✅ |
| 13 | No JavaScript console errors | ✅ |

---

## 🔮 Future Improvements

- **Sub-tasks** – nested checklists within a task
- **Priority levels** – High / Medium / Low with visual indicators
- **Recurring tasks** – daily / weekly / monthly recurrence
- **Dark mode** – system-preference-aware colour scheme toggle
- **Notifications** – browser Push API reminders for due dates
- **Export / Import** – download tasks as JSON or CSV
- **Cloud sync** – optional Firebase / Supabase backend for multi-device access
- **Keyboard shortcuts** – `N` to add, `E` to edit focused task, etc.
- **Tags** – freeform tagging in addition to categories
- **Pomodoro timer** – built-in focus timer per task

---

## 👨‍💻 Author

Built as a complete internship submission project demonstrating professional frontend development practices.

---

*Last updated: November 2026*

