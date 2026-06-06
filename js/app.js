/**
 * App — Main controller, routing, init
 */
import { storage } from './modules/storage.js';
import { state } from './modules/state.js';
import { toast } from './modules/toast.js';
import { modal } from './modules/modal.js';
import { charts } from './modules/charts.js';
import { Dashboard } from './modules/dashboard.js';
import { Expenses } from './modules/expenses.js';
import { Grocery } from './modules/grocery.js';
import { Budget } from './modules/budget.js';
import { Savings } from './modules/savings.js';
import { Reports } from './modules/reports.js';
import { downloadFile } from './utils/utils.js';

class App {
    constructor() {
        this.currentView = 'dashboard';
        this.views = {
            dashboard: { title: 'Dashboard', subtitle: 'Overview of your financial health', instance: Dashboard },
            expenses: { title: 'Expenses', subtitle: 'Track and manage your transactions', instance: Expenses },
            grocery: { title: 'Grocery List', subtitle: 'Smart shopping list and tracker', instance: Grocery },
            budget: { title: 'Budget', subtitle: 'Plan your monthly budget with 50/30/20 rule', instance: Budget },
            savings: { title: 'Savings Goals', subtitle: 'Track progress towards your goals', instance: Savings },
            reports: { title: 'Reports', subtitle: 'Detailed analytics and insights', instance: Reports }
        };
    }

    init() {
        this._applyTheme();
        this._initModules();
        this._bindNavigation();
        this._bindGlobalControls();
        this._bindSearch();
        this._setupSalaryPrompt();
        state.subscribe((event) => {
            if (event === 'settings' && storage.get('settings').theme) {
                this._applyTheme();
                charts.refresh();
            }
        });
        // Initial render
        this.navigate('dashboard');
    }

    _applyTheme() {
        const theme = storage.get('settings').theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }

    _initModules() {
        Object.values(this.views).forEach((v) => v.instance.init && v.instance.init());
    }

    _bindNavigation() {
        const handleNav = (viewName) => {
            if (this.views[viewName]) {
                this.navigate(viewName);
                // Close mobile sidebar
                document.getElementById('sidebar').classList.remove('is-open');
                document.getElementById('sidebarBackdrop').classList.remove('is-visible');
            }
        };

        document.querySelectorAll('[data-view]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleNav(link.dataset.view);
            });
        });

        document.querySelectorAll('[data-view-link]').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                handleNav(link.dataset.viewLink);
            });
        });

        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('is-open');
            document.getElementById('sidebarBackdrop').classList.toggle('is-visible');
        });

        document.getElementById('sidebarBackdrop').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('is-open');
            document.getElementById('sidebarBackdrop').classList.remove('is-visible');
        });

        // Ensure mobile sidebar state doesn't persist on desktop after resize
        const normalizeSidebar = () => {
            if (window.innerWidth > 767) {
                document.getElementById('sidebar').classList.remove('is-open');
                document.getElementById('sidebarBackdrop').classList.remove('is-visible');
            }
        };

        window.addEventListener('resize', () => normalizeSidebar());
        // Run once to normalize initial state
        normalizeSidebar();

        // Hash routing
        window.addEventListener('hashchange', () => {
            const view = location.hash.slice(1) || 'dashboard';
            this.navigate(view);
        });
    }

    _bindGlobalControls() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            state.setTheme(current === 'dark' ? 'light' : 'dark');
        });

        // Quick add
        document.getElementById('quickAddBtn').addEventListener('click', () => {
            this.navigate('expenses');
            setTimeout(() => Expenses.openForm(), 100);
        });

        // Export
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            const data = storage.export();
            const date = new Date().toISOString().slice(0, 10);
            downloadFile(`uxkd_backup_${date}.json`, data);
            toast.success('Data exported successfully');
        });

        // Import
        const importInput = document.getElementById('importFileInput');
        document.getElementById('importDataBtn').addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const ok = await modal.confirm({
                title: 'Import Data',
                message: 'This will replace all current data with the imported file. Are you sure?',
                confirmText: 'Import',
                type: 'warning'
            });
            if (ok) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const success = storage.import(ev.target.result);
                    if (success) {
                        toast.success('Data imported — reloading...');
                        setTimeout(() => window.location.reload(), 800);
                    } else {
                        toast.error('Invalid file format');
                    }
                };
                reader.readAsText(file);
            }
            importInput.value = '';
        });
    }

    _bindSearch() {
        const input = document.getElementById('globalSearch');
        let timer;
        input.addEventListener('input', (e) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                const q = e.target.value.toLowerCase().trim();
                if (q.length < 2) {
                    Expenses.filters = { category: '', period: 'month', type: '' };
                    Expenses.render();
                    return;
                }
                this.navigate('expenses');
                setTimeout(() => {
                    Expenses.filters = { category: '', period: 'all', type: '' };
                    document.getElementById('filterCategory').value = '';
                    document.getElementById('filterPeriod').value = 'all';
                    document.getElementById('filterType').value = '';
                    Expenses.render();
                    // Highlight matches
                    const rows = document.querySelectorAll('#expensesTableBody tr');
                    rows.forEach((row) => {
                        const txt = row.textContent.toLowerCase();
                        row.style.display = txt.includes(q) ? '' : 'none';
                    });
                }, 50);
            }, 200);
        });
    }

    _setupSalaryPrompt() {
        if (!state.settings.salary) {
            setTimeout(() => this._openSalaryModal(), 600);
        }
    }

    _openSalaryModal() {
        modal.open({
            title: 'Welcome to UXKD!',
            body: `
                <div style="text-align:center;padding:8px 0 16px">
                    <div style="width:64px;height:64px;margin:0 auto 12px;border-radius:50%;background:var(--gradient-primary);color:white;display:flex;align-items:center;justify-content:center;font-size:24px">
                        <i class="fa-solid fa-indian-rupee-sign"></i>
                    </div>
                    <h3 style="margin-bottom:6px">Let's get started</h3>
                    <p style="color:var(--text-secondary);font-size:14px;line-height:1.5">Enter your monthly salary to unlock smart budget insights and savings tracking.</p>
                </div>
                <form id="salaryForm" class="form">
                    <div class="form__row">
                        <label class="form__label">Monthly Salary</label>
                        <input type="number" class="input" id="salaryInput" min="0" step="0.01" required placeholder="e.g. 50000" autofocus>
                    </div>
                    <div class="form__actions">
                        <button type="button" class="btn btn--ghost" data-skip>Skip for now</button>
                        <button type="submit" class="btn btn--primary">
                            <i class="fa-solid fa-rocket"></i> Get Started
                        </button>
                    </div>
                </form>
            `,
            onClose: () => {}
        });

        document.querySelector('[data-skip]').addEventListener('click', () => {
            modal.close();
            toast.info('You can set salary anytime in the Budget section');
        });

        document.getElementById('salaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const salary = Number(document.getElementById('salaryInput').value);
            if (salary > 0) {
                state.setSalary(salary);
                // Auto 50/30/20
                state.setBudget({
                    needs: Math.round(salary * 0.5),
                    wants: Math.round(salary * 0.3),
                    savings: Math.round(salary * 0.2)
                });
                toast.success('Salary set! Budget auto-distributed 50/30/20');
                modal.close();
            }
        });
    }

    navigate(viewName) {
        if (!this.views[viewName]) viewName = 'dashboard';
        this.currentView = viewName;

        // Update view sections
        document.querySelectorAll('.view').forEach((v) => v.classList.remove('is-active'));
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.add('is-active');

        // Update nav links
        document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('is-active'));
        const activeLink = document.querySelector(`.nav-link[data-view="${viewName}"]`);
        if (activeLink) activeLink.classList.add('is-active');

        // Update topbar
        const config = this.views[viewName];
        document.getElementById('viewTitle').textContent = config.title;
        document.getElementById('viewSubtitle').textContent = config.subtitle;

        // Update hash
        if (location.hash.slice(1) !== viewName) {
            history.replaceState(null, '', `#${viewName}`);
        }

        // Trigger render
        config.instance.render && config.instance.render();

        // Resize charts after view becomes visible
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
}

// Bootstrap
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
