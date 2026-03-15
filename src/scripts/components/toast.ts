export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

export class Toast {
    private static container: HTMLElement | null = null;
    private static activeToasts: HTMLElement[] = [];
    private static timeouts: Map<HTMLElement, number> = new Map();

    private static createContainer(): void {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    static show(options: ToastOptions): void {
        const { message, type = 'info', duration = 3000 } = options;

        this.createContainer();

        const existingToast = this.activeToasts.find(toast =>
            toast.querySelector('.toast__message')?.textContent === message
        );

        if (existingToast) {
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast_${type}`;
        toast.innerHTML = `
            <div class="toast__icon"></div>
            <div class="toast__message">${message}</div>
        `;

        this.container?.appendChild(toast);
        this.activeToasts.push(toast);

        setTimeout(() => toast.classList.add('toast_show'), 10);

        const timer = window.setTimeout(() => this.close(toast), duration);
        this.timeouts.set(toast, timer);

    }

    private static close(toast: HTMLElement): void {
        const timer = this.timeouts.get(toast);
        if (timer) {
            clearTimeout(timer);
            this.timeouts.delete(toast);
        }

        toast.classList.remove('toast_show');

        setTimeout(() => {
            toast.remove();
            this.activeToasts = this.activeToasts.filter(t => t !== toast);

            if (this.activeToasts.length === 0 && this.container) {
                this.container.remove();
                this.container = null;
            }
        }, 300);
    }

    static removeByMessage(message: string): void {
        const toastsToRemove = this.activeToasts.filter(toast =>
            toast.querySelector('.toast__message')?.textContent === message
        );

        toastsToRemove.forEach(toast => {
            this.close(toast);
        });
    }

    static clearAll(): void {
        this.timeouts.forEach((timer) => {
            clearTimeout(timer);
        });
        this.timeouts.clear();

        this.activeToasts.forEach(toast => {
            toast.remove();
        });
        this.activeToasts = [];

        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    static success(message: string, duration?: number): void {
        this.show({ message, type: 'success', duration });
    }

    static error(message: string, duration?: number): void {
        this.show({ message, type: 'error', duration });
    }

    static info(message: string, duration?: number): void {
        this.show({ message, type: 'info', duration });
    }

    static warning(message: string, duration?: number): void {
        this.show({ message, type: 'warning', duration });
    }
}