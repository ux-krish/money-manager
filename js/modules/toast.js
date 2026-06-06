/**
 * Toast — Lightweight notification system
 */
class Toast {
    constructor() {
        this.container = document.getElementById('toast-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'info', duration = 3000) {
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const el = document.createElement('div');
        el.className = `toast toast--${type}`;
        el.setAttribute('role', 'status');
        el.innerHTML = `
            <div class="toast__icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
            <div class="toast__msg">${message}</div>
            <button class="toast__close" aria-label="Close">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        const close = () => {
            el.classList.add('is-leaving');
            setTimeout(() => el.remove(), 300);
        };

        el.querySelector('.toast__close').addEventListener('click', close);
        this.container.appendChild(el);

        if (duration > 0) {
            setTimeout(close, duration);
        }
        return close;
    }

    success(msg, dur) { return this.show(msg, 'success', dur); }
    error(msg, dur) { return this.show(msg, 'error', dur || 4000); }
    warning(msg, dur) { return this.show(msg, 'warning', dur); }
    info(msg, dur) { return this.show(msg, 'info', dur); }
}

export const toast = new Toast();
