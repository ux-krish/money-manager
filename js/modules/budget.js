/**
 * Budget View — Monthly budget setup & category limits
 */
import { state } from './state.js';
import { modal } from './modal.js';
import { toast } from './toast.js';
import { charts } from './charts.js';
import {
    formatCurrency, getCurrentMonthKey, monthKeyFromDate, sum, groupBy, ALL_CATEGORIES
} from '../utils/utils.js';

export const Budget = {
    init() {
        this._bindForm();
        this._bindControls();
        state.subscribe(() => this.render());
    },

    _bindForm() {
        const form = document.getElementById('budgetForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const salary = Number(document.getElementById('budgetSalary').value) || 0;
            const needs = Number(document.getElementById('budgetNeeds').value) || 0;
            const wants = Number(document.getElementById('budgetWants').value) || 0;
            const savings = Number(document.getElementById('budgetSavings').value) || 0;

            state.setSalary(salary);
            state.setBudget({ needs, wants, savings });
            toast.success('Budget saved successfully');
        });

        document.getElementById('autoDistributeBtn').addEventListener('click', () => {
            const salary = Number(document.getElementById('budgetSalary').value) || 0;
            if (!salary) {
                toast.warning('Enter your monthly salary first');
                return;
            }
            document.getElementById('budgetNeeds').value = Math.round(salary * 0.5);
            document.getElementById('budgetWants').value = Math.round(salary * 0.3);
            document.getElementById('budgetSavings').value = Math.round(salary * 0.2);
            toast.info('Auto-distributed using 50/30/20 rule');
        });
    },

    _bindControls() {
        document.getElementById('addCategoryBudgetBtn').addEventListener('click', () => this.openAddCategory());
    },

    openAddCategory() {
        const used = Object.keys(state.settings.categoryBudgets);
        const available = ALL_CATEGORIES.filter((c) => !used.includes(c));

        const options = available.map((c) => `<option value="${c}">${c}</option>`).join('');

        modal.open({
            title: 'Add Category Limit',
            body: `
                <form id="catForm" class="form">
                    <div class="form__row">
                        <label class="form__label">Category</label>
                        <select class="select" id="catName" required>${options}</select>
                    </div>
                    <div class="form__row">
                        <label class="form__label">Monthly Limit</label>
                        <input type="number" class="input" id="catLimit" min="0" step="0.01" required>
                    </div>
                    <div class="form__actions">
                        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
                        <button type="submit" class="btn btn--primary">Add Limit</button>
                    </div>
                </form>
            `
        });

        document.getElementById('catForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('catName').value;
            const limit = Number(document.getElementById('catLimit').value);
            if (!limit || limit <= 0) {
                toast.error('Limit must be greater than 0');
                return;
            }
            state.setCategoryBudget(name, limit);
            toast.success(`Limit set for ${name}`);
            modal.close();
        });
    },

    render() {
        const s = state.settings;
        document.getElementById('budgetSalary').value = s.salary || '';
        document.getElementById('budgetNeeds').value = s.budget.needs || '';
        document.getElementById('budgetWants').value = s.budget.wants || '';
        document.getElementById('budgetSavings').value = s.budget.savings || '';

        this._renderCategoryBudgets();
        charts.renderBudgetVsActual('budgetVsActualChart', state.expenses, s.budget);
    },

    _renderCategoryBudgets() {
        const list = document.getElementById('categoryBudgetList');
        const monthKey = getCurrentMonthKey();
        const monthExp = state.expenses.filter((e) =>
            e.type === 'expense' && monthKeyFromDate(e.date) === monthKey
        );
        const grouped = groupBy(monthExp, (e) => e.category);
        const catBudgets = state.settings.categoryBudgets;

        const entries = Object.entries(catBudgets);

        if (!entries.length) {
            list.innerHTML = '<p class="muted" style="padding:16px;text-align:center">No category limits set. Click "Add Category Limit" to create one.</p>';
            return;
        }

        list.innerHTML = entries.map(([cat, limit]) => {
            const spent = sum(grouped[cat] || [], (e) => e.amount);
            const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const tone = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';
            return `
                <div class="category-budget" data-cat="${cat}">
                    <div class="category-budget__header">
                        <span class="category-budget__name">${this._esc(cat)}</span>
                        <span class="category-budget__values">
                            ${formatCurrency(spent)} / ${formatCurrency(limit)}
                            <button data-action="remove" style="margin-left:8px;color:var(--text-muted)" title="Remove limit">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </span>
                    </div>
                    <div class="category-budget__bar">
                        <div class="category-budget__fill ${tone ? 'category-budget__fill--' + tone : ''}" style="width:${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('[data-action="remove"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const cat = btn.closest('.category-budget').dataset.cat;
                state.setCategoryBudget(cat, 0);
                toast.success(`Removed limit for ${cat}`);
            });
        });
    },

    _esc(s) {
        return String(s || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
};
