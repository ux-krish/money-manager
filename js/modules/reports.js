/**
 * Reports View — Monthly analytics and exports
 */
import { state } from './state.js';
import { charts } from './charts.js';
import { toast } from './toast.js';
import {
    formatCurrency, sum, getCurrentMonthKey, monthKeyFromDate, monthName, toCSV, downloadFile
} from '../utils/utils.js';

export const Reports = {
    currentMonth: getCurrentMonthKey(),

    init() {
        this._populateMonths();
        document.getElementById('reportMonth').addEventListener('change', (e) => {
            this.currentMonth = e.target.value;
            this.render();
        });
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('printReportBtn').addEventListener('click', () => window.print());
        state.subscribe(() => this.render());
    },

    _populateMonths() {
        const sel = document.getElementById('reportMonth');
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `${monthName(d.getMonth())} ${d.getFullYear()}`;
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = label;
            if (key === this.currentMonth) opt.selected = true;
            sel.appendChild(opt);
        }
    },

    _monthExpenses() {
        return state.expenses.filter((e) => monthKeyFromDate(e.date) === this.currentMonth);
    },

    render() {
        const monthExp = this._monthExpenses();
        const income = sum(monthExp.filter((e) => e.type === 'income'), (e) => e.amount);
        const expense = sum(monthExp.filter((e) => e.type === 'expense'), (e) => e.amount);
        const net = income - expense;

        document.getElementById('reportIncome').textContent = formatCurrency(income);
        document.getElementById('reportExpense').textContent = formatCurrency(expense);
        document.getElementById('reportNet').textContent = formatCurrency(net);

        charts.renderDailySpend('dailySpendChart', state.expenses, this.currentMonth);
        charts.renderTopCategories('topCatChart', state.expenses, this.currentMonth);
        charts.renderMonthlyCompare('monthlyCompareChart', state.expenses);
    },

    exportCSV() {
        const monthExp = this._monthExpenses();
        if (!monthExp.length) {
            toast.warning('No data to export for this month');
            return;
        }
        const rows = monthExp
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((tx) => [
                tx.date,
                tx.description,
                tx.category,
                tx.type,
                tx.amount,
                tx.note || ''
            ]);

        const csv = toCSV(rows, ['Date', 'Description', 'Category', 'Type', 'Amount', 'Note']);
        downloadFile(`transactions_${this.currentMonth}.csv`, csv, 'text/csv');
        toast.success('CSV exported');
    }
};
