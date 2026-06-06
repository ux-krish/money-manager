# UXKD — Smart Grocery & Expense Manager

A comprehensive, production-ready personal finance management tool built with **HTML5, SCSS, and Vanilla JavaScript (ES6 Modules)**. Track your grocery list, manage daily expenses, plan budgets using the 50/30/20 rule, and reach your savings goals — all with offline-first local storage.

## ✨ Features

### 📊 Dashboard
- Real-time KPIs: Salary, Monthly Spend, Savings, Daily Allowance
- 7/30/90-day spending trend (line chart)
- Category breakdown (donut chart)
- 50/30/20 budget allocation (donut chart)
- Recent transactions feed

### 💸 Expense Tracker
- Add income/expense transactions with categories
- Filter by category, period (this/last month, 7d, 30d, all-time), type
- Edit / delete with confirmation
- Full-text global search
- CSV export

### 🛒 Smart Grocery List
- Quick add with quantity, unit, price, category
- Mark items as bought
- Auto-calculate estimated total
- **Convert bought items → expense** (auto-creates a transaction)
- Smart suggestions based on purchase history
- Purchase history (last 5 shopping trips)

### 💰 Budget Planner
- Monthly budget setup
- **Auto 50/30/20 rule** distribution
- Per-category spending limits with progress bars
- Budget vs Actual comparison chart
- Color-coded warnings when limits are exceeded

### 🎯 Savings Goals
- Multiple goals (car, home, travel, education, etc.)
- Track current vs target with progress bars
- Deadline tracking
- Quick contribute action

### 📈 Reports
- Monthly comparison (last 6 months)
- Daily spending chart
- Top categories
- CSV export
- Print-friendly

### 🎨 UX
- **Light & Dark theme** (auto-persisted)
- **Fully responsive** (mobile, tablet, desktop)
- **Offline-first** (localStorage)
- **Export/Import** all data as JSON
- Toast notifications
- Modal system with backdrop & ESC
- Empty states everywhere
- Smooth animations

## 🏗️ Architecture

```
grocery managment tools/
├── index.html
├── css/
│   └── main.css              # Compiled from SCSS
├── scss/
│   ├── main.scss             # Entry point
│   ├── _variables.scss       # Design tokens (colors, spacing, fonts)
│   ├── _mixins.scss          # Responsive, flex, scrollbar, focus
│   ├── _base.scss            # Reset & body
│   ├── _themes.scss          # Light/Dark CSS variables
│   ├── _layout.scss          # App shell, sidebar, topbar
│   ├── _components.scss      # Buttons, cards, forms, modals, toasts
│   └── _views.scss           # Page-specific styles
├── js/
│   ├── app.js                # Main controller & router
│   ├── modules/
│   │   ├── storage.js        # LocalStorage wrapper
│   │   ├── state.js          # Centralized state (Observer)
│   │   ├── toast.js          # Notifications
│   │   ├── modal.js          # Modal manager
│   │   ├── charts.js         # Chart.js wrapper
│   │   ├── dashboard.js      # Dashboard view
│   │   ├── expenses.js       # Expenses view
│   │   ├── grocery.js        # Grocery view
│   │   ├── budget.js         # Budget view
│   │   ├── savings.js        # Savings view
│   │   └── reports.js        # Reports view
│   └── utils/
│       └── utils.js          # Pure helpers (format, date, etc.)
├── package.json
└── README.md
```

### Design Patterns Used
- **MVC** — separation of data, presentation, and control
- **Observer** — state subscribes notify all views on changes
- **Module** — ES6 modules with explicit imports/exports
- **Strategy** — chart renderers share common options, customize per chart
- **Singleton** — Storage, Toast, Modal managers
- **DRY** — shared mixins, design tokens via CSS variables

## 🚀 Getting Started

### Option 1: Direct Open
Just open `index.html` in a modern browser. (Note: ES6 modules require serving via HTTP, see below.)

### Option 2: Local Dev Server

```bash
npm install
npm run serve    # http://localhost:8080
```

### Option 3: SCSS Watch Mode

```bash
npm install
npm run watch    # auto-recompile on save
```

## 🛠️ Tech Stack

- **HTML5** — Semantic markup, accessibility (ARIA)
- **SCSS** — Modular, BEM-like, design tokens, theming
- **Vanilla JavaScript ES6+** — Modules, no frameworks
- **Chart.js 4.4** — Analytics
- **Font Awesome 6.5** — Icons
- **Inter & JetBrains Mono** — Typography
- **localStorage** — Persistence (no backend)

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## 💡 Tips for Saving Money

1. **Set a realistic salary** — your dashboard adapts to your income
2. **Use the 50/30/20 rule** — 50% needs, 30% wants, 20% savings
3. **Set category limits** for groceries, dining, entertainment
4. **Track every expense** — small purchases add up
5. **Use the grocery list** to avoid impulse buys
6. **Review weekly** — check the dashboard every Sunday
7. **Set savings goals** with deadlines for motivation
8. **Export your data monthly** as a backup

## 📝 License

MIT — Free to use, modify, and distribute.
