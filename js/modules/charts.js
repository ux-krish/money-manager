/**
 * Charts — Chart.js wrapper for dashboard, expenses, reports
 */
import {
    formatDateShort, sum, groupBy, getCurrentMonthKey, monthKeyFromDate,
    getMonthRange, monthName, formatCurrency
} from '../utils/utils.js';

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#10b981',
            secondary: '#6366f1',
            accent: '#f59e0b',
            danger: '#ef4444',
            info: '#3b82f6',
            pink: '#ec4899',
            teal: '#14b8a6',
            purple: '#a855f7',
            orange: '#fb923c',
            gray: '#64748b'
        };
    }

    getPalette() {
        return [
            this.colors.primary, this.colors.secondary, this.colors.accent,
            this.colors.danger, this.colors.info, this.colors.pink,
            this.colors.teal, this.colors.purple, this.colors.orange
        ];
    }

    isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    gridColor() {
        return this.isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    }

    textColor() {
        return this.isDark() ? '#94a3b8' : '#475569';
    }

    commonOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: this.textColor(),
                        font: { family: 'Inter', size: 12, weight: '500' },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: this.isDark() ? '#1a2438' : '#ffffff',
                    titleColor: this.isDark() ? '#e2e8f0' : '#0f172a',
                    bodyColor: this.isDark() ? '#cbd5e1' : '#475569',
                    borderColor: this.isDark() ? '#334155' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' },
                    displayColors: true,
                    boxPadding: 4
                }
            }
        };
    }

    upsert(id, config) {
        const canvas = document.getElementById(id);
        if (!canvas) return;

        if (this.charts.has(id)) {
            const existing = this.charts.get(id);
            existing.data = config.data;
            existing.options = config.options;
            existing.update();
            return;
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, config);
        this.charts.set(id, chart);
    }

    destroy(id) {
        if (this.charts.has(id)) {
            this.charts.get(id).destroy();
            this.charts.delete(id);
        }
    }

    destroyAll() {
        this.charts.forEach((c) => c.destroy());
        this.charts.clear();
    }

    refresh() {
        this.charts.forEach((c) => {
            c.options.plugins.legend.labels.color = this.textColor();
            c.options.plugins.tooltip.backgroundColor = this.isDark() ? '#1a2438' : '#ffffff';
            c.options.plugins.tooltip.titleColor = this.isDark() ? '#e2e8f0' : '#0f172a';
            c.options.plugins.tooltip.bodyColor = this.isDark() ? '#cbd5e1' : '#475569';
            c.update();
        });
    }

    // ---- Trend (line) ----
    renderTrend(canvasId, expenses, days = 30) {
        const now = new Date();
        const labels = [];
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            labels.push(formatDateShort(d));
            const total = expenses
                .filter((e) => e.date === key && e.type === 'expense')
                .reduce((s, e) => s + e.amount, 0);
            data.push(total);
        }

        const gradient = this._gradient(canvasId, [
            { stop: 0, color: 'rgba(16, 185, 129, 0.35)' },
            { stop: 1, color: 'rgba(16, 185, 129, 0)' }
        ]);

        this.upsert(canvasId, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Spending',
                    data,
                    borderColor: this.colors.primary,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                ...this.commonOptions(),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: this.textColor(),
                            font: { family: 'Inter', size: 11 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 7
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor() },
                        ticks: {
                            color: this.textColor(),
                            font: { family: 'Inter', size: 11 },
                            callback: (v) => '₹' + v
                        }
                    }
                },
                plugins: {
                    ...this.commonOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    }

    // ---- Category Donut ----
    renderCategory(canvasId, expenses) {
        const monthKey = getCurrentMonthKey();
        const monthExpenses = expenses.filter((e) => {
            return e.type === 'expense' && monthKeyFromDate(e.date) === monthKey;
        });

        const grouped = groupBy(monthExpenses, (e) => e.category);
        const labels = Object.keys(grouped);
        const data = labels.map((k) => sum(grouped[k], (x) => x.amount));

        if (!labels.length) {
            this.destroy(canvasId);
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const parent = canvas.parentElement;
                parent.innerHTML = `<div class="empty-state" style="height:200px;display:flex;flex-direction:column;justify-content:center"><i class="fa-solid fa-chart-pie"></i><p>No spending data this month</p></div>`;
            }
            return;
        }

        this.upsert(canvasId, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: this.getPalette(),
                    borderColor: this.isDark() ? '#131c2e' : '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                ...this.commonOptions(),
                cutout: '65%',
                plugins: {
                    ...this.commonOptions().plugins,
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: this.textColor(),
                            font: { family: 'Inter', size: 11 },
                            padding: 10,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            boxWidth: 8
                        }
                    }
                }
            }
        });
    }

    // ---- Budget 50/30/20 (radial) ----
    renderBudgetRule(canvasId, budget) {
        const needs = budget.needs || 0;
        const wants = budget.wants || 0;
        const savings = budget.savings || 0;
        const total = needs + wants + savings;

        if (total === 0) {
            this.destroy(canvasId);
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const parent = canvas.parentElement;
                parent.innerHTML = `<div class="empty-state" style="height:200px;display:flex;flex-direction:column;justify-content:center"><i class="fa-solid fa-scale-balanced"></i><p>Set up your budget to see allocation</p></div>`;
            }
            return;
        }

        this.upsert(canvasId, {
            type: 'doughnut',
            data: {
                labels: ['Needs (50%)', 'Wants (30%)', 'Savings (20%)'],
                datasets: [{
                    data: [needs, wants, savings],
                    backgroundColor: [this.colors.primary, this.colors.accent, this.colors.secondary],
                    borderColor: this.isDark() ? '#131c2e' : '#ffffff',
                    borderWidth: 3
                }]
            },
            options: {
                ...this.commonOptions(),
                cutout: '60%',
                plugins: {
                    ...this.commonOptions().plugins,
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // ---- Budget vs Actual (bar) ----
    renderBudgetVsActual(canvasId, expenses, budget) {
        const monthKey = getCurrentMonthKey();
        const monthExpenses = expenses.filter((e) => {
            return e.type === 'expense' && monthKeyFromDate(e.date) === monthKey;
        });

        const actualNeeds = monthExpenses
            .filter((e) => ['Rent', 'Utilities', 'Bills', 'Groceries', 'Health'].includes(e.category))
            .reduce((s, e) => s + e.amount, 0);
        const actualWants = monthExpenses
            .filter((e) => ['Entertainment', 'Dining', 'Shopping', 'Travel', 'Subscriptions'].includes(e.category))
            .reduce((s, e) => s + e.amount, 0);
        const actualSavings = monthExpenses
            .filter((e) => ['Savings', 'Investment'].includes(e.category))
            .reduce((s, e) => s + e.amount, 0);

        this.upsert(canvasId, {
            type: 'bar',
            data: {
                labels: ['Needs', 'Wants', 'Savings'],
                datasets: [
                    {
                        label: 'Budget',
                        data: [budget.needs || 0, budget.wants || 0, budget.savings || 0],
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        borderColor: this.colors.primary,
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Actual',
                        data: [actualNeeds, actualWants, actualSavings],
                        backgroundColor: [this.colors.primary, this.colors.accent, this.colors.secondary],
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...this.commonOptions(),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 12, weight: '500' } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor() },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 11 }, callback: (v) => '₹' + v }
                    }
                }
            }
        });
    }

    // ---- Daily Spending (bar) ----
    renderDailySpend(canvasId, expenses, monthKey) {
        const { start, end } = getMonthRange(monthKey);
        const [y, m] = monthKey.split('-').map(Number);
        const daysInM = new Date(y, m, 0).getDate();
        const labels = [];
        const data = [];

        for (let day = 1; day <= daysInM; day++) {
            const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
            labels.push(day);
            const total = expenses
                .filter((e) => e.date === dateStr && e.type === 'expense')
                .reduce((s, e) => s + e.amount, 0);
            data.push(total);
        }

        this.upsert(canvasId, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Daily Spend',
                    data,
                    backgroundColor: this.colors.secondary,
                    borderRadius: 4
                }]
            },
            options: {
                ...this.commonOptions(),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor() },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 11 }, callback: (v) => '₹' + v }
                    }
                },
                plugins: {
                    ...this.commonOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    }

    // ---- Top Categories Horizontal Bar ----
    renderTopCategories(canvasId, expenses, monthKey) {
        const monthExpenses = expenses.filter((e) => {
            return e.type === 'expense' && monthKeyFromDate(e.date) === monthKey;
        });

        const grouped = groupBy(monthExpenses, (e) => e.category);
        const sorted = Object.entries(grouped)
            .map(([k, v]) => ({ name: k, total: sum(v, (x) => x.amount) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);

        if (!sorted.length) {
            this.destroy(canvasId);
            const canvas = document.getElementById(canvasId);
            if (canvas) {
                const parent = canvas.parentElement;
                parent.innerHTML = `<div class="empty-state" style="height:200px;display:flex;flex-direction:column;justify-content:center"><i class="fa-solid fa-chart-bar"></i><p>No data available</p></div>`;
            }
            return;
        }

        this.upsert(canvasId, {
            type: 'bar',
            data: {
                labels: sorted.map((s) => s.name),
                datasets: [{
                    label: 'Amount',
                    data: sorted.map((s) => s.total),
                    backgroundColor: this.getPalette().slice(0, sorted.length),
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                ...this.commonOptions(),
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: this.gridColor() },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 11 }, callback: (v) => '₹' + v }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 12, weight: '500' } }
                    }
                },
                plugins: {
                    ...this.commonOptions().plugins,
                    legend: { display: false }
                }
            }
        });
    }

    // ---- Monthly Comparison (last 6 months) ----
    renderMonthlyCompare(canvasId, expenses) {
        const months = [];
        const incomeData = [];
        const expenseData = [];
        const savingsData = [];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = monthName(d.getMonth()).slice(0, 3) + " '" + String(d.getFullYear()).slice(2);
            months.push(label);

            const monthExp = expenses.filter((e) => monthKeyFromDate(e.date) === key);
            const inc = monthExp.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
            const exp = monthExp.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

            incomeData.push(inc);
            expenseData.push(exp);
            savingsData.push(Math.max(0, inc - exp));
        }

        this.upsert(canvasId, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: this.colors.primary,
                        borderRadius: 6
                    },
                    {
                        label: 'Expense',
                        data: expenseData,
                        backgroundColor: this.colors.danger,
                        borderRadius: 6
                    },
                    {
                        label: 'Savings',
                        data: savingsData,
                        backgroundColor: this.colors.secondary,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                ...this.commonOptions(),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: this.gridColor() },
                        ticks: { color: this.textColor(), font: { family: 'Inter', size: 11 }, callback: (v) => '₹' + v }
                    }
                }
            }
        });
    }

    // Helper for gradients
    _gradient(canvasId, stops) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return 'rgba(16, 185, 129, 0.2)';
        const ctx = canvas.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 0, canvas.height || 280);
        stops.forEach((s) => g.addColorStop(s.stop, s.color));
        return g;
    }
}

export const charts = new ChartManager();
