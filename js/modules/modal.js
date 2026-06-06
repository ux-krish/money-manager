/**
 * Modal — Reusable modal dialog manager
 */

class Modal {
    constructor() {
        this.root = document.getElementById('modal-root');
        this.activeModal = null;
        this._escHandler = this._escHandler.bind(this);
    }

    open({ title, body, footer, size = 'md', onClose }) {
        this.close();
        const widthMap = { sm: '380px', md: '480px', lg: '640px' };

        const html = `
            <div class="modal-root__backdrop" data-modal-backdrop></div>
            <div class="modal-root__dialog" role="dialog" aria-modal="true" aria-labelledby="modalTitle" style="max-width:${widthMap[size] || widthMap.md}">
                <div class="modal__header">
                    <h3 id="modalTitle">${title}</h3>
                    <button class="modal__close" data-modal-close aria-label="Close">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="modal__body">${body}</div>
                ${footer ? `<div class="modal__footer">${footer}</div>` : ''}
            </div>
        `;

        this.root.innerHTML = html;
        this.root.classList.add('is-open');
        this.root.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this._escHandler);
        this.activeModal = { onClose };

        // Wire up close handlers
        this.root.querySelectorAll('[data-modal-close], [data-modal-backdrop]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || el.hasAttribute('data-modal-close')) {
                    this.close();
                }
            });
        });
    }

    _escHandler(e) {
        if (e.key === 'Escape') this.close();
    }

    close() {
        if (!this.activeModal) return;
        this.root.classList.remove('is-open');
        this.root.setAttribute('aria-hidden', 'true');
        this.root.innerHTML = '';
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this._escHandler);
        const cb = this.activeModal.onClose;
        this.activeModal = null;
        if (typeof cb === 'function') cb();
    }

    confirm({ title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'primary' }) {
        return new Promise((resolve) => {
            this.open({
                title,
                body: `<p style="color:var(--text-secondary);line-height:1.6">${message}</p>`,
                footer: `
                    <button class="btn btn--ghost" data-modal-close>${cancelText}</button>
                    <button class="btn btn--${type}" data-confirm>${confirmText}</button>
                `,
                onClose: () => resolve(false)
            });
            this.root.querySelector('[data-confirm]').addEventListener('click', () => {
                this.close();
                resolve(true);
            });
        });
    }
}

export const modal = new Modal();
