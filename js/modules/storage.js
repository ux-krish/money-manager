/**
 * Storage — Persistence layer with LocalStorage
 * Provides a safe, namespaced, JSON-serializable wrapper.
 */
const STORAGE_KEY = 'uxkd_v1';
const NAMESPACE = 'fg';

class Storage {
    constructor() {
        this.cache = this._load();
    }

    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : this._defaults();
        } catch (e) {
            console.error('Storage load failed:', e);
            return this._defaults();
        }
    }

    _defaults() {
        return {
            settings: {
                currency: '₹',
                theme: 'light',
                salary: 0,
                budget: { needs: 0, wants: 0, savings: 0 },
                categoryBudgets: {}
            },
            expenses: [],
            grocery: [],
            goals: [],
            purchased: [] // history of bought grocery items
        };
    }

    _save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
            return true;
        } catch (e) {
            console.error('Storage save failed:', e);
            return false;
        }
    }

    get(key) {
        return key ? this.cache[key] : this.cache;
    }

    set(key, value) {
        this.cache[key] = value;
        this._save();
    }

    update(patch) {
        this.cache = { ...this.cache, ...patch };
        this._save();
    }

    reset() {
        this.cache = this._defaults();
        this._save();
    }

    export() {
        return JSON.stringify(this.cache, null, 2);
    }

    import(json) {
        try {
            const data = JSON.parse(json);
            if (typeof data !== 'object' || data === null) throw new Error('Invalid data');
            this.cache = { ...this._defaults(), ...data };
            this._save();
            return true;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }
}

export const storage = new Storage();
export const NAMESPACE_NAME = NAMESPACE;
