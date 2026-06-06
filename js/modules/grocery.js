/**
 * Grocery View — Shopping list with smart suggestions
 */
import { state } from './state.js';
import { modal } from './modal.js';
import { toast } from './toast.js';
import { formatCurrency, groupBy, sum, sortBy, formatDateShort } from '../utils/utils.js';

export const Grocery = {
    filter: 'all',

    init() {
        this._bindForm();
        this._bindControls();
        state.subscribe(() => this.render());
    },

    _bindForm() {
        const form = document.getElementById('groceryForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('groceryName').value.trim();
            if (!name) {
                toast.error('Please enter item name');
                return;
            }
            state.addGroceryItem({
                name,
                qty: Number(document.getElementById('groceryQty').value) || 1,
                unit: document.getElementById('groceryUnit').value,
                price: Number(document.getElementById('groceryPrice').value) || 0,
                category: document.getElementById('groceryCategory').value
            });
            toast.success(`Added "${name}" to list`);
            form.reset();
            document.getElementById('groceryQty').value = 1;
            document.getElementById('groceryName').focus();
        });
    },

    _bindControls() {
        document.getElementById('groceryFilter').addEventListener('change', (e) => {
            this.filter = e.target.value;
            this.render();
        });

        document.getElementById('markAllBoughtBtn').addEventListener('click', () => {
            if (!state.grocery.length) {
                toast.warning('List is empty');
                return;
            }
            state.markAllBought();
            toast.success('All items marked as bought');
        });

        document.getElementById('convertToExpenseBtn').addEventListener('click', () => {
            const bought = state.grocery.filter((g) => g.bought);
            if (!bought.length) {
                toast.warning('No bought items to convert');
                return;
            }
            const result = state.convertBoughtToExpense();
            toast.success(`Converted ${result.count} items (${formatCurrency(result.total)}) to expense`);
        });

        document.getElementById('clearGroceryBtn').addEventListener('click', async () => {
            if (!state.grocery.length) {
                toast.warning('List is already empty');
                return;
            }
            const ok = await modal.confirm({
                title: 'Clear Grocery List',
                message: 'This will remove all items from your list. Continue?',
                confirmText: 'Clear All',
                type: 'danger'
            });
            if (ok) {
                state.clearGrocery();
                toast.success('Grocery list cleared');
            }
        });
    },

    render() {
        this._renderList();
        this._renderSuggestions();
        this._renderHistory();
    },

    _filteredList() {
        const all = state.grocery;
        if (this.filter === 'pending') return all.filter((g) => !g.bought);
        if (this.filter === 'bought') return all.filter((g) => g.bought);
        return all;
    },

    _renderList() {
        const list = this._filteredList();
        const ul = document.getElementById('groceryList');
        const empty = document.getElementById('groceryEmpty');

        if (!list.length) {
            ul.innerHTML = '';
            empty.hidden = false;
        } else {
            empty.hidden = true;
            ul.innerHTML = list.map((item) => {
                const total = (item.price || 0) * (item.qty || 1);
                return `
                    <li class="grocery-item ${item.bought ? 'is-bought' : ''}" data-id="${item.id}">
                        <div class="grocery-item__check" data-action="toggle" role="checkbox" aria-checked="${item.bought}" tabindex="0">
                            <i class="fa-solid fa-check"></i>
                        </div>
                        <div class="grocery-item__main">
                            <div class="grocery-item__name">${this._esc(item.name)}</div>
                            <div class="grocery-item__meta">
                                <span>${item.qty} ${item.unit}</span>
                                <span>•</span>
                                <span>${this._esc(item.category)}</span>
                            </div>
                        </div>
                        <div class="grocery-item__price">${formatCurrency(total)}</div>
                        <div class="grocery-item__actions">
                            <button data-action="edit" title="Edit"><i class="fa-solid fa-pen"></i></button>
                            <button data-action="delete" class="delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </li>
                `;
            }).join('');

            // Bind actions
            ul.querySelectorAll('.grocery-item').forEach((li) => {
                const id = li.dataset.id;
                li.querySelector('[data-action="toggle"]').addEventListener('click', () => state.toggleGroceryItem(id));
                li.querySelector('[data-action="edit"]').addEventListener('click', () => this.openEdit(id));
                li.querySelector('[data-action="delete"]').addEventListener('click', async () => {
                    const ok = await modal.confirm({
                        title: 'Delete Item',
                        message: `Remove "${state.grocery.find((g) => g.id === id)?.name}" from your list?`,
                        confirmText: 'Delete',
                        type: 'danger'
                    });
                    if (ok) {
                        state.deleteGroceryItem(id);
                        toast.success('Item removed');
                    }
                });
            });
        }

        // Stats
        const all = state.grocery;
        const bought = all.filter((g) => g.bought).length;
        const total = all.reduce((s, g) => s + (g.price || 0) * (g.qty || 1), 0);
        document.getElementById('groceryCount').textContent = all.length;
        document.getElementById('groceryBought').textContent = bought;
        document.getElementById('groceryTotal').textContent = formatCurrency(total);
    },

    openEdit(id) {
        const item = state.grocery.find((g) => g.id === id);
        if (!item) return;

        const cats = ['Staples', 'Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Beverages', 'Household', 'Personal Care', 'Other'];
        const catOptions = cats.map((c) =>
            `<option value="${c}" ${item.category === c ? 'selected' : ''}>${c}</option>`
        ).join('');

        const units = ['pcs', 'kg', 'g', 'L', 'ml', 'pack'];
        const unitOptions = units.map((u) =>
            `<option value="${u}" ${item.unit === u ? 'selected' : ''}>${u}</option>`
        ).join('');

        modal.open({
            title: 'Edit Item',
            body: `
                <form id="editGroceryForm" class="form">
                    <div class="form__row">
                        <label class="form__label">Item Name</label>
                        <input type="text" class="input" id="editName" value="${this._esc(item.name)}" required>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                        <div class="form__row">
                            <label class="form__label">Quantity</label>
                            <input type="number" class="input" id="editQty" min="1" value="${item.qty}">
                        </div>
                        <div class="form__row">
                            <label class="form__label">Unit</label>
                            <select class="select" id="editUnit">${unitOptions}</select>
                        </div>
                    </div>
                    <div class="form__row">
                        <label class="form__label">Price per unit</label>
                        <input type="number" class="input" id="editPrice" min="0" step="0.01" value="${item.price}">
                    </div>
                    <div class="form__row">
                        <label class="form__label">Category</label>
                        <select class="select" id="editCat">${catOptions}</select>
                    </div>
                    <div class="form__actions">
                        <button type="button" class="btn btn--ghost" data-modal-close>Cancel</button>
                        <button type="submit" class="btn btn--primary">Save</button>
                    </div>
                </form>
            `
        });

        document.getElementById('editGroceryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            state.updateGroceryItem(id, {
                name: document.getElementById('editName').value.trim(),
                qty: Number(document.getElementById('editQty').value) || 1,
                unit: document.getElementById('editUnit').value,
                price: Number(document.getElementById('editPrice').value) || 0,
                category: document.getElementById('editCat').value
            });
            toast.success('Item updated');
            modal.close();
        });
    },

    _renderSuggestions() {
        const purchased = state.purchased;
        if (!purchased.length) {
            document.getElementById('suggestionList').innerHTML =
                '<li class="muted" style="padding:8px">Buy items and convert to expenses to see suggestions here.</li>';
            return;
        }

        // Group by name, count, last purchased
        const groups = groupBy(purchased, (p) => p.name.toLowerCase());
        const items = Object.entries(groups).map(([name, list]) => ({
            name: list[0].name,
            count: list.length,
            lastPurchased: Math.max(...list.map((l) => new Date(l.purchasedAt).getTime())),
            avgPrice: sum(list, (l) => l.price) / list.length
        }));

        // Items purchased 3+ times suggest re-purchase
        const frequent = sortBy(items.filter((i) => i.count >= 2), (i) => i.count, 'desc').slice(0, 5);

        if (!frequent.length) {
            document.getElementById('suggestionList').innerHTML =
                '<li class="muted" style="padding:8px">No frequent purchases detected yet.</li>';
            return;
        }

        document.getElementById('suggestionList').innerHTML = frequent.map((item) => `
            <li class="suggestion-item">
                <span class="suggestion-item__name">${this._esc(item.name)}</span>
                <span class="suggestion-item__freq">Bought ${item.count}× • ~${formatCurrency(item.avgPrice)}</span>
                <button class="suggestion-item__add" data-action="add-suggestion" data-name="${this._esc(item.name)}" title="Add to list">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </li>
        `).join('');

        document.querySelectorAll('[data-action="add-suggestion"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                state.addGroceryItem({ name: btn.dataset.name, qty: 1, unit: 'pcs' });
                toast.success(`Added "${btn.dataset.name}"`);
            });
        });
    },

    _renderHistory() {
        const hist = [...state.purchased]
            .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
            .slice(0, 10);

        const ul = document.getElementById('groceryHistory');
        if (!hist.length) {
            ul.innerHTML = '<li class="muted" style="padding:8px">No purchase history yet.</li>';
            return;
        }

        // Group by date
        const byDate = groupBy(hist, (h) => h.purchasedAt.slice(0, 10));
        const sorted = Object.keys(byDate).sort().reverse().slice(0, 5);

        ul.innerHTML = sorted.map((date) => {
            const items = byDate[date];
            const total = sum(items, (i) => i.price);
            return `
                <li class="history-item">
                    <div>
                        <div class="history-item__name">${items.length} item${items.length > 1 ? 's' : ''}</div>
                        <div class="history-item__date">${formatDateShort(date)}</div>
                    </div>
                    <div class="history-item__total">${formatCurrency(total)}</div>
                </li>
            `;
        }).join('');
    },

    _esc(s) {
        return String(s || '').replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
};
