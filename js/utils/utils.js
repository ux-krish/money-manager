/**
 * Utils — Pure helper functions
 */

// ---- ID Generation ----
export const uid = () =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

// ---- Currency Formatting ----
export const formatCurrency = (amount, currency = '₹') => {
    const n = Number(amount) || 0;
    return `${currency}${n.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    })}`;
};

export const formatNumber = (n, digits = 0) =>
    (Number(n) || 0).toLocaleString('en-IN', {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits
    });

// ---- Date Helpers ----
export const today = () => {
    const d = new Date();
    return formatDate(d);
};

export const formatDate = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const formatDatePretty = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export const formatDateShort = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const daysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

export const dayOfMonth = () => new Date().getDate();

export const monthName = (idx) =>
    new Date(2000, idx, 1).toLocaleString('en-IN', { month: 'long' });

// ---- Month/Year helpers ----
export const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthKeyFromDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthRange = (monthKey) => {
    const [y, m] = monthKey.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { start: formatDate(start), end: formatDate(end) };
};

// ---- Math Helpers ----
export const sum = (arr, fn = (x) => x) =>
    arr.reduce((acc, x) => acc + (Number(fn(x)) || 0), 0);

export const groupBy = (arr, fn) =>
    arr.reduce((acc, x) => {
        const k = fn(x);
        (acc[k] = acc[k] || []).push(x);
        return acc;
    }, {});

export const sortBy = (arr, fn, dir = 'desc') => {
    const sorted = [...arr].sort((a, b) => {
        const va = fn(a), vb = fn(b);
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
    });
    return sorted;
};

// ---- Category Icons ----
export const CATEGORY_ICONS = {
    'Food': 'fa-utensils',
    'Groceries': 'fa-basket-shopping',
    'Transport': 'fa-bus',
    'Rent': 'fa-house',
    'Utilities': 'fa-bolt',
    'Entertainment': 'fa-film',
    'Shopping': 'fa-bag-shopping',
    'Health': 'fa-heart-pulse',
    'Education': 'fa-graduation-cap',
    'Bills': 'fa-file-invoice',
    'Dining': 'fa-mug-hot',
    'Travel': 'fa-plane',
    'Subscriptions': 'fa-repeat',
    'Personal Care': 'fa-pump-soap',
    'Gifts': 'fa-gift',
    'Other': 'fa-circle',
    'Salary': 'fa-money-bill-trend-up',
    'Freelance': 'fa-laptop-code',
    'Investment': 'fa-chart-line',
    'Savings': 'fa-piggy-bank',
    'Bonus': 'fa-star',
    'Refund': 'fa-rotate-left',
    'Staples': 'fa-wheat-awn',
    'Vegetables': 'fa-carrot',
    'Fruits': 'fa-apple-whole',
    'Dairy': 'fa-cow',
    'Snacks': 'fa-cookie-bite',
    'Beverages': 'fa-mug-saucer',
    'Household': 'fa-broom'
};

export const getCategoryIcon = (cat) =>
    CATEGORY_ICONS[cat] || 'fa-tag';

// ---- Debounce ----
export const debounce = (fn, wait = 250) => {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
};

// ---- Default categories ----
export const EXPENSE_CATEGORIES = [
    'Food', 'Groceries', 'Transport', 'Rent', 'Utilities',
    'Entertainment', 'Shopping', 'Health', 'Education',
    'Bills', 'Dining', 'Travel', 'Subscriptions',
    'Personal Care', 'Gifts', 'Other'
];

export const INCOME_CATEGORIES = [
    'Salary', 'Freelance', 'Investment', 'Savings', 'Bonus', 'Refund', 'Other'
];

export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

// ---- Validation ----
export const isValidAmount = (v) => {
    const n = Number(v);
    return !isNaN(n) && n >= 0 && isFinite(n);
};

export const escapeHtml = (str) =>
    String(str || '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

// ---- Download File ----
export const downloadFile = (filename, content, type = 'application/json') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ---- CSV Export ----
export const toCSV = (rows, headers) => {
    const esc = (v) => {
        if (v == null) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };
    const head = headers.join(',');
    const body = rows.map(r => r.map(esc).join(',')).join('\n');
    return `${head}\n${body}`;
};
