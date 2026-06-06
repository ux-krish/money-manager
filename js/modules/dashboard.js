/**
 * Dashboard View
 */
import { state } from './state.js';
import { charts } from './charts.js';
import {
    formatCurrency, getCurrentMonthKey, monthKeyFromDate, sum,
    getMonthRange, daysInMonth, dayOfMonth, getCategoryIcon
} from '../utils/utils.js';

export const Dashboard = {
    trendRange: 7,

    init() {
        this._bindRangeButtons();
        state.subscribe(() => this.render());
    },

    _bindRangeButtons() {
        document.querySelectorAll('#trendRange .segmented__btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#trendRange .segmented__btn').forEach((b) => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                this.trendRange = Number(btn.dataset.range) || 7;
                this.render();
            });
        });
    },

    render() {
        const settings = state.settings;
        const expenses = state.expenses;
        const monthKey = getCurrentMonthKey();
        const [y, m] = monthKey.split('-').map(Number);
        const today_d = dayOfMonth();
        const totalDays = daysInMonth(y, m - 1);
        const daysLeft = Math.max(1, totalDays - today_d + 1);

        // ---- KPIs ----
        const monthExp = expenses.filter((e) => monthKeyFromDate(e.date) === monthKey);
        const spent = monthExp.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
        const income = monthExp.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const salary = settings.salary || income;
        const saved = Math.max(0, (salary || 0) - spent);
        const dailyAllow = Math.floor(saved / daysLeft);
        const spentPct = salary > 0 ? Math.round((spent / salary) * 100) : 0;

        const fmt = settings.currency || '₹';
        document.getElementById('kpiSalary').textContent = formatCurrency(salary, fmt);
        document.getElementById('kpiSalaryMeta').textContent = income > 0
            ? `+${formatCurrency(income, fmt)} extra income`
            : 'Set your salary to begin';

        document.getElementById('kpiSpent').textContent = formatCurrency(spent, fmt);
        document.getElementById('kpiSpentMeta').textContent = salary > 0
            ? `${spentPct}% of salary`
            : 'Add transactions to track';

        document.getElementById('kpiSaved').textContent = formatCurrency(saved, fmt);
        document.getElementById('kpiSavedMeta').textContent =
            `Target: ${formatCurrency((settings.budget.savings || Math.round(salary * 0.2)), fmt)}`;

        document.getElementById('kpiDaily').textContent = formatCurrency(Math.max(0, dailyAllow), fmt);
        document.getElementById('kpiDailyMeta').textContent = `${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining`;

        // ---- Charts ----
        charts.renderTrend('trendChart', expenses, this.trendRange);
        charts.renderCategory('categoryChart', expenses);
        charts.renderBudgetRule('budgetRuleChart', settings.budget);

        // ---- Recent transactions ----
        const recent = [...expenses]
            .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id))
            .slice(0, 6);

        const list = document.getElementById('recentTxList');
        if (!recent.length) {
            list.innerHTML = '<li class="empty-state">No transactions yet. Start by adding an expense.</li>';
        } else {
            list.innerHTML = recent.map((tx) => `
                <li class="tx-item">
                    <div class="tx-item__icon tx-item__icon--${tx.type}">
                        <i class="fa-solid ${getCategoryIcon(tx.category)}"></i>
                    </div>
                    <div class="tx-item__main">
                        <div class="tx-item__title">${this._escape(tx.description || tx.category)}</div>
                        <div class="tx-item__meta">${this._escape(tx.category)} • ${this._pretty(tx.date)}</div>
                    </div>
                    <div class="tx-item__amount tx-item__amount--${tx.type}">
                        ${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount, fmt)}
                    </div>
                </li>
            `).join('');
        }
    },

    _escape(s) {
        return String(s || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    },

    _pretty(date) {
        return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
};
