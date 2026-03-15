type ConfirmModalOptions = {
    title: string;
    message: string;
    onConfirm: () => void;
};

export class ConfirmModal {
    private overlay: HTMLDivElement;
    private onConfirm: () => void;

    constructor(options: ConfirmModalOptions) {
        this.onConfirm = options.onConfirm;
        this.overlay = this.createOverlay(options.title, options.message);
        this.attachEvents();
    }

    private createOverlay(title: string, message: string): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.className = 'confirm__overlay';
        overlay.innerHTML = `
            <div class="confirm__modal">
                <div class="confirm__header">
                    <button class="confirm__close-btn" aria-label="Закрыть"></button>
                </div>
                <div class="confirm__body">
                    <h3 class="confirm__title">${title}</h3>
                    <p class="confirm__text">${message}</p>
                </div>
                <div class="confirm__footer">
                    <button class="btn btn_blue confirm__delete-btn">Да, удалить</button>
                    <button class="btn btn_white confirm__cancel-btn">Отмена</button>
                </div>
            </div>
        `;
        return overlay;
    }

    private attachEvents(): void {
        setTimeout(() => this.overlay.classList.add('active'), 10);

        this.overlay.querySelector('.confirm__close-btn')?.addEventListener('click', () => this.close());
        this.overlay.querySelector('.confirm__cancel-btn')?.addEventListener('click', () => this.close());
        this.overlay.querySelector('.confirm__delete-btn')?.addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && document.body.contains(this.overlay)) {
                this.close();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    show(): void {
        document.body.appendChild(this.overlay);
    }

    private close(): void {
        this.overlay.classList.remove('active');
        setTimeout(() => this.overlay.remove(), 300);
    }
}