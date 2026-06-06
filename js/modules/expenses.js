/**
 * Expenses View — CRUD transactions with filters
 */
import { state } from './state.js';
import { modal } from './modal.js';
import { toast } from './toast.js';
import {
    formatCurrency, formatDatePretty, getCategoryIcon,
    EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES
} from '../utils/utils.js';

export const Expenses = {
    filters: { category: '', period: 'month', type: '' },

    init() {
        this._populateCategories();
        this._bindFilters();
        state.subscribe(() => this.render());
    },

    _populateCategories() {
        const sel = document.getElementById('filterCategory');
        ALL_CATEGORIES.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            sel.appendChild(opt);
        });
    },

    _bindFilters() {
        ['filterCategory', 'filterPeriod', 'filterType'].forEach((id) => {
            const el = document.getElementById(id);
            el.addEventListener('change', (e) => {
                const key = id.replace('filter', '').toLowerCase();
                this.filters[key] = e.target.value;
                this.render();
            });
        });

        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openForm());
    },

    _filtered() {
        const { category, period, type } = this.filters;
        const now = new Date();
        let start = null, end = null;

        if (period === 'month') {
            const m = now.getMonth(), y = now.getFullYear();
            start = new Date(y, m, 1).toISOString().slice(0, 10);
            end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
        } else if (period === 'last') {
            const m = now.getMonth() - 1, y = now.getFullYear();
            start = new Date(y, m, 1).toISOString().slice(0, 10);
            end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
        } else if (period === '7') {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            start = d.toISOString().slice(0, 10);
        } else if (period === '30') {
            const d = new Date(now);
            d.setDate(d.getDate() - 30);
            start = d.toISOString().slice(0, 10);
        }

        return state.expenses
            .filter((e) => {
                if (category && e.category !== category) return false;
                if (type && e.type !== type) return false;
                if (start && e.date < start) return false;
                if (end && e.date > end) return false;
                return true;
            })
            .sort((a, b) => b.date.localeCompare(a.date));
    },

    render() {
        const list = this._filtered();
        const tbody = document.getElementById('expensesTableBody');
        const empty = document.getElementById('expensesEmpty');
        const table = document.getElementById('expensesTable');
        const fmt = state.settings.currency || '₹';

        if (!list.length) {
            tbody.innerHTML = '';
            empty.classList.add('is-visible');
            return;
        }
        empty.classList.remove('is-visible');

        tbody.innerHTML = list.map((tx) => `
            <tr data-id="${tx.id}">
                <td>${formatDatePretty(tx.date)}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <i class="fa-solid ${getCategoryIcon(tx.category)}" style="color:var(--text-muted);width:18px;text-align:center"></i>
                        <div>
                            <div style="font-weight:500">${this._esc(tx.description || tx.category)}</div>
                            ${tx.note ? `<div style="font-size:0.75rem;color:var(--text-muted)">${this._esc(tx.note)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td><span class="badge">${this._esc(tx.category)}</span></td>
                <td>
                    <span class="badge badge--${tx.type === 'income' ? 'success' : 'danger'}">
                        ${tx.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                </td>
                <td class="ta-right" style="font-family:var(--font-mono);font-weight:600;color:${tx.type === 'income' ? 'var(--color-success)' : 'var(--text-primary)'}">
                    ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount, fmt)}
                </td>
                <td class="ta-right">
                    <div class="row-actions">
                        <button data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
                        <button data-action="delete" class="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind row actions
        tbody.querySelectorAll('button[data-action]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const tr = e.target.closest('tr');
                const id = tr.dataset.id;
                const action = btn.dataset.action;
                if (action === 'edit') this.openForm(id);
                else if (action === 'delete') this.confirmDelete(id);
            });
        });
    },

    openForm(id = null) {
        const tx = id ? state.expenses.find((e) => e.id === id) : null;
        const isEdit = !!tx;

        const cats = isEdit
            ? (tx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
            : EXPENSE_CATEGORIES;
        const catOptions = cats.map((c) =>
            `<option value="${c}" ${tx && tx.category === c ? 'selected' : ''}>${c}</option>`
        ).join('');

        const html = `
            <form id="txForm" class="form">
                <div class="form__row">
                    <label class="form__label">Type</label>
                    <div class="segmented" style="width:100%;display:grid;grid-template-columns:1fr 1fr;gap:4px">
                        <label class="segmented__btn ${!tx || tx.type === 'expense' ? 'is-active' : ''}" style="display:flex;align-items:center;justify-content:center;cursor:pointer">
                            <input type="radio" name="type" value="expense" ${!tx || tx.type === 'expense' ? 'checked' : ''} style="display:none">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Expense
                        </label>
                        <label class="segmented__btn ${tx && tx.type === 'income' ? 'is-active' : ''}" style="display:flex;align-items:center;justify-content:center;cursor:pointer">
                            <input type="radio" name="type" value="income" ${tx && tx.type === 'income' ? 'checked' : ''} style="display:none">
                            <i class="fa-solid fa-arrow-down-to-line"></i> Income
                        </label>
                    </div>
                </div>
                <div class="form__row">
                    <label class="form__label" for="txAmount">Amount</label>
                    <input type="number" class="input" id="txAmount" min="0" step="0.01" required value="${tx ? tx.amount : ''}">
                </div>
                <div class="form__row">
                    <label class="form__label" for="txDescription">Description</label>
                    <input type="text" class="input" id="txDescription" required placeholder="e.g. Lunch at office" value="${tx ? this._esc(tx.description) : ''}">
                </div>
                <div class="form__row">
                    <label class="form__label" for="txCategory">Category</label>
                    <select class="select" id="txCategory">${catOptions}</select>
                </div>
                <div class="form__row">
                    <label class="form__label" for="txDate">Date</label>
                    <input type="date" class="input" id="txDate" required value="${tx ? tx.date : new Date().toISOString().slice(0, 10)}">
                </div>
                <div class="form__row">
                    <label class="form__label" for="txNote">Note (Optional)</label>
                    <textarea class="textarea" id="txNote" placeholder="Add a note...">${tx ? this._esc(tx.note) : ''}</textarea>
                </div>
                <div class="form__actions">
                    <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
                    <button type="submit" class="btn btn--primary">${isEdit ? 'Update' : 'Add'} Transaction</button>
                </div>
            </form>
        `;

        modal.open({
            title: isEdit ? 'Edit Transaction' : 'Add Transaction',
            body: html
        });

        // Type toggle
        modal.activeModal; // ensure open
        const typeRadios = document.querySelectorAll('input[name="type"]');
        const catSelect = document.getElementById('txCategory');
        typeRadios.forEach((r) => {
            r.addEventListener('change', () => {
                document.querySelectorAll('label.segmented__btn').forEach((l) => l.classList.remove('is-active'));
                r.closest('label').classList.add('is-active');
                const newCats = r.value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                catSelect.innerHTML = newCats.map((c) => `<option value="${c}">${c}</option>`).join('');
            });
        });

        // Submit
        document.getElementById('txForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                type: document.querySelector('input[name="type"]:checked').value,
                amount: Number(document.getElementById('txAmount').value),
                description: document.getElementById('txDescription').value.trim(),
                category: document.getElementById('txCategory').value,
                date: document.getElementById('txDate').value,
                note: document.getElementById('txNote').value.trim()
            };
            if (!data.amount || data.amount <= 0) {
                toast.error('Amount must be greater than 0');
                return;
            }
            if (isEdit) {
                state.updateExpense(id, data);
                toast.success('Transaction updated');
            } else {
                state.addExpense(data);
                toast.success('Transaction added');
            }
            modal.close();
        });
    },

    async confirmDelete(id) {
        const ok = await modal.confirm({
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
            confirmText: 'Delete',
            type: 'danger'
        });
        if (ok) {
            state.deleteExpense(id);
            toast.success('Transaction deleted');
        }
    },

    _esc(s) {
        return String(s || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
};
