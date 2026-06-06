/**
 * Savings View — Goals tracking
 */
import { state } from './state.js';
import { modal } from './modal.js';
import { toast } from './toast.js';
import { formatCurrency, sum, getCurrentMonthKey, monthKeyFromDate } from '../utils/utils.js';

const GOAL_ICONS = [
    { icon: 'fa-car', label: 'Vehicle' },
    { icon: 'fa-house', label: 'Home' },
    { icon: 'fa-plane', label: 'Travel' },
    { icon: 'fa-graduation-cap', label: 'Education' },
    { icon: 'fa-ring', label: 'Wedding' },
    { icon: 'fa-stethoscope', label: 'Medical' },
    { icon: 'fa-laptop', label: 'Tech' },
    { icon: 'fa-piggy-bank', label: 'Savings' },
    { icon: 'fa-bullseye', label: 'Goal' }
];

export const Savings = {
    init() {
        document.getElementById('addGoalBtn').addEventListener('click', () => this.openForm());
        state.subscribe(() => this.render());
    },

    openForm(id = null) {
        const goal = id ? state.goals.find((g) => g.id === id) : null;
        const isEdit = !!goal;

        const iconOptions = GOAL_ICONS.map((g) =>
            `<option value="${g.icon}" ${goal && goal.icon === g.icon ? 'selected' : ''}>${g.label}</option>`
        ).join('');

        modal.open({
            title: isEdit ? 'Edit Goal' : 'Create New Goal',
            body: `
                <form id="goalForm" class="form">
                    <div class="form__row">
                        <label class="form__label">Goal Name</label>
                        <input type="text" class="input" id="goalName" required value="${goal ? this._esc(goal.name) : ''}" placeholder="e.g. Emergency Fund">
                    </div>
                    <div class="form__row">
                        <label class="form__label">Target Amount</label>
                        <input type="number" class="input" id="goalTarget" min="0" step="0.01" required value="${goal ? goal.target : ''}">
                    </div>
                    <div class="form__row">
                        <label class="form__label">Current Amount</label>
                        <input type="number" class="input" id="goalCurrent" min="0" step="0.01" value="${goal ? goal.current : 0}">
                    </div>
                    <div class="form__row">
                        <label class="form__label">Deadline (Optional)</label>
                        <input type="date" class="input" id="goalDeadline" value="${goal && goal.deadline ? goal.deadline : ''}">
                    </div>
                    <div class="form__row">
                        <label class="form__label">Icon</label>
                        <select class="select" id="goalIcon">${iconOptions}</select>
                    </div>
                    <div class="form__actions">
                        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
                        <button type="submit" class="btn btn--primary">${isEdit ? 'Update' : 'Create'} Goal</button>
                    </div>
                </form>
            `
        });

        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('goalName').value.trim(),
                target: Number(document.getElementById('goalTarget').value) || 0,
                current: Number(document.getElementById('goalCurrent').value) || 0,
                deadline: document.getElementById('goalDeadline').value || null,
                icon: document.getElementById('goalIcon').value
            };
            if (data.target <= 0) {
                toast.error('Target must be greater than 0');
                return;
            }
            if (isEdit) {
                state.updateGoal(id, data);
                toast.success('Goal updated');
            } else {
                state.addGoal(data);
                toast.success('Goal created');
            }
            modal.close();
        });
    },

    contribute(goal) {
        modal.open({
            title: 'Add Contribution',
            body: `
                <form id="contribForm" class="form">
                    <p class="muted mb-16">Adding to: <strong>${this._esc(goal.name)}</strong></p>
                    <p class="muted mb-16">Current: <strong>${formatCurrency(goal.current)}</strong> / Target: <strong>${formatCurrency(goal.target)}</strong></p>
                    <div class="form__row">
                        <label class="form__label">Amount</label>
                        <input type="number" class="input" id="contribAmount" min="0" step="0.01" required>
                    </div>
                    <div class="form__actions">
                        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
                        <button type="submit" class="btn btn--success">Add Contribution</button>
                    </div>
                </form>
            `
        });

        document.getElementById('contribForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = Number(document.getElementById('contribAmount').value);
            if (amount <= 0) {
                toast.error('Amount must be greater than 0');
                return;
            }
            state.contributeToGoal(goal.id, amount);
            toast.success(`Added ${formatCurrency(amount)} to ${goal.name}`);
            modal.close();
        });
    },

    async deleteGoal(id) {
        const goal = state.goals.find((g) => g.id === id);
        const ok = await modal.confirm({
            title: 'Delete Goal',
            message: `Are you sure you want to delete "${goal.name}"?`,
            confirmText: 'Delete',
            type: 'danger'
        });
        if (ok) {
            state.deleteGoal(id);
            toast.success('Goal deleted');
        }
    },

    render() {
        const goals = state.goals;
        const list = document.getElementById('goalsList');
        const empty = document.getElementById('goalsEmpty');

        // KPIs
        const totalSavings = sum(goals, (g) => g.current);
        const activeGoals = goals.length;
        document.getElementById('totalSavings').textContent = formatCurrency(totalSavings);
        document.getElementById('activeGoals').textContent = activeGoals;

        // Avg savings rate from last 3 months
        const now = new Date();
        const last3 = [];
        for (let i = 0; i < 3; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last3.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        let totalIncome = 0, totalExpense = 0;
        last3.forEach((key) => {
            const monthExp = state.expenses.filter((e) => monthKeyFromDate(e.date) === key);
            totalIncome += sum(monthExp.filter((e) => e.type === 'income'), (e) => e.amount);
            totalExpense += sum(monthExp.filter((e) => e.type === 'expense'), (e) => e.amount);
        });
        const rate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
        document.getElementById('savingsRate').textContent = `${Math.max(0, rate)}%`;

        if (!goals.length) {
            list.innerHTML = '';
            empty.hidden = false;
            return;
        }
        empty.hidden = true;

        list.innerHTML = goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
            const remaining = Math.max(0, goal.target - goal.current);
            let eta = 'No deadline';
            if (goal.deadline) {
                const days = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                eta = days > 0 ? `${days} days left` : 'Overdue';
            }
            return `
                <article class="card goal-card" data-id="${goal.id}">
                    <div class="goal-card__header">
                        <div class="goal-card__icon"><i class="fa-solid ${goal.icon || 'fa-bullseye'}"></i></div>
                        <button data-action="delete" class="icon-btn" style="width:32px;height:32px" title="Delete">
                            <i class="fa-solid fa-trash" style="font-size:12px"></i>
                        </button>
                    </div>
                    <div class="goal-card__name">${this._esc(goal.name)}</div>
                    <div class="goal-card__amounts">
                        <span class="goal-card__current">${formatCurrency(goal.current)}</span>
                        <span class="goal-card__target">of ${formatCurrency(goal.target)}</span>
                    </div>
                    <div class="goal-card__progress">
                        <div class="goal-card__fill" style="width:${pct}%"></div>
                    </div>
                    <div class="goal-card__meta">
                        <span>${pct.toFixed(0)}% complete</span>
                        <span>${eta}</span>
                    </div>
                    <div class="goal-card__actions">
                        <button class="btn btn--success btn--sm" data-action="contribute">
                            <i class="fa-solid fa-plus"></i> Add Money
                        </button>
                        <button class="btn btn--secondary btn--sm" data-action="edit">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        // Bind actions
        list.querySelectorAll('.goal-card').forEach((card) => {
            const id = card.dataset.id;
            const goal = state.goals.find((g) => g.id === id);
            card.querySelector('[data-action="contribute"]').addEventListener('click', () => this.contribute(goal));
            card.querySelector('[data-action="edit"]').addEventListener('click', () => this.openForm(id));
            card.querySelector('[data-action="delete"]').addEventListener('click', () => this.deleteGoal(id));
        });
    },

    _esc(s) {
        return String(s || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
};
