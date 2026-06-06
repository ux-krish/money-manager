/**
 * State — Centralized application state with observer pattern
 * Notifies subscribers on data changes.
 */
import { storage } from './storage.js';

class State {
    constructor(storage) {
        this.storage = storage;
        this.subscribers = new Set();
    }

    get settings() { return this.storage.get('settings'); }
    get expenses() { return this.storage.get('expenses') || []; }
    get grocery() { return this.storage.get('grocery') || []; }
    get goals() { return this.storage.get('goals') || []; }
    get purchased() { return this.storage.get('purchased') || []; }

    notify(event = 'change') {
        this.subscribers.forEach((fn) => {
            try { fn(event); } catch (e) { console.error('Subscriber error:', e); }
        });
    }

    subscribe(fn) {
        this.subscribers.add(fn);
        return () => this.subscribers.delete(fn);
    }

    // ---- Settings ----
    setSettings(patch) {
        const s = { ...this.settings, ...patch };
        this.storage.set('settings', s);
        this.notify('settings');
    }

    setTheme(theme) {
        this.setSettings({ theme });
    }

    setSalary(salary) {
        this.setSettings({ salary: Number(salary) || 0 });
    }

    setBudget(budget) {
        this.setSettings({ budget: { ...this.settings.budget, ...budget } });
    }

    setCategoryBudget(category, amount) {
        const cb = { ...this.settings.categoryBudgets };
        if (!amount || amount <= 0) {
            delete cb[category];
        } else {
            cb[category] = Number(amount);
        }
        this.setSettings({ categoryBudgets: cb });
    }

    // ---- Expenses ----
    addExpense(data) {
        const list = this.expenses;
        const item = {
            id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            date: data.date || new Date().toISOString().slice(0, 10),
            description: data.description || '',
            category: data.category || 'Other',
            amount: Number(data.amount) || 0,
            type: data.type || 'expense',
            note: data.note || '',
            createdAt: new Date().toISOString()
        };
        list.push(item);
        this.storage.set('expenses', list);
        this.notify('expense');
        return item;
    }

    updateExpense(id, patch) {
        const list = this.expenses.map((e) => e.id === id ? { ...e, ...patch } : e);
        this.storage.set('expenses', list);
        this.notify('expense');
    }

    deleteExpense(id) {
        const list = this.expenses.filter((e) => e.id !== id);
        this.storage.set('expenses', list);
        this.notify('expense');
    }

    // ---- Grocery ----
    addGroceryItem(data) {
        const list = this.grocery;
        const item = {
            id: `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: data.name,
            qty: Number(data.qty) || 1,
            unit: data.unit || 'pcs',
            price: Number(data.price) || 0,
            category: data.category || 'Other',
            bought: false,
            createdAt: new Date().toISOString()
        };
        list.push(item);
        this.storage.set('grocery', list);
        this.notify('grocery');
        return item;
    }

    toggleGroceryItem(id) {
        const list = this.grocery.map((g) => g.id === id ? { ...g, bought: !g.bought } : g);
        this.storage.set('grocery', list);
        this.notify('grocery');
    }

    updateGroceryItem(id, patch) {
        const list = this.grocery.map((g) => g.id === id ? { ...g, ...patch } : g);
        this.storage.set('grocery', list);
        this.notify('grocery');
    }

    deleteGroceryItem(id) {
        const list = this.grocery.filter((g) => g.id !== id);
        this.storage.set('grocery', list);
        this.notify('grocery');
    }

    clearGrocery(onlyBought = false) {
        const list = onlyBought ? this.grocery.filter((g) => !g.bought) : [];
        this.storage.set('grocery', list);
        this.notify('grocery');
    }

    markAllBought() {
        const list = this.grocery.map((g) => ({ ...g, bought: true }));
        this.storage.set('grocery', list);
        this.notify('grocery');
    }

    convertBoughtToExpense(category = 'Groceries') {
        const bought = this.grocery.filter((g) => g.bought);
        if (!bought.length) return 0;

        const total = bought.reduce((sum, item) => sum + (item.price * item.qty), 0);
        if (total > 0) {
            this.addExpense({
                date: new Date().toISOString().slice(0, 10),
                description: `Grocery: ${bought.map((b) => b.name).join(', ').slice(0, 60)}`,
                category,
                amount: total,
                type: 'expense'
            });
        }

        // Save to history
        const hist = this.purchased;
        bought.forEach((b) => {
            hist.push({
                name: b.name,
                qty: b.qty,
                unit: b.unit,
                price: b.price * b.qty,
                category: b.category,
                purchasedAt: new Date().toISOString()
            });
        });
        // Keep only last 200 entries
        this.storage.set('purchased', hist.slice(-200));

        // Remove bought items
        const list = this.grocery.filter((g) => !g.bought);
        this.storage.set('grocery', list);
        this.notify('grocery');
        return { count: bought.length, total };
    }

    // ---- Goals ----
    addGoal(data) {
        const list = this.goals;
        const item = {
            id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: data.name,
            target: Number(data.target) || 0,
            current: Number(data.current) || 0,
            deadline: data.deadline || null,
            icon: data.icon || 'fa-bullseye',
            createdAt: new Date().toISOString()
        };
        list.push(item);
        this.storage.set('goals', list);
        this.notify('goal');
        return item;
    }

    updateGoal(id, patch) {
        const list = this.goals.map((g) => g.id === id ? { ...g, ...patch } : g);
        this.storage.set('goals', list);
        this.notify('goal');
    }

    deleteGoal(id) {
        const list = this.goals.filter((g) => g.id !== id);
        this.storage.set('goals', list);
        this.notify('goal');
    }

    contributeToGoal(id, amount) {
        const goal = this.goals.find((g) => g.id === id);
        if (!goal) return;
        const newCurrent = Math.max(0, goal.current + Number(amount));
        this.updateGoal(id, { current: newCurrent });
    }
}

export const state = new State(storage);
