export type DropdownEvent = 'change' | 'open' | 'close';
export type DropdownEventHandler = (value: string | null, item?: DropdownItem | null) => void;

export class DropdownItem {
    public id: string;
    public name: string;

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

export class CustomDropdown {
    private element: HTMLElement;
    private button: HTMLButtonElement;
    private menu: HTMLElement;
    private items: DropdownItem[] = [];
    private selectedItem: DropdownItem | null = null;
    private isOpen: boolean = false;
    private eventHandlers: Map<DropdownEvent, DropdownEventHandler[]> = new Map();
    private placeholder: string;
    private className: string;

    constructor(containerId: string, options: { placeholder?: string; selectedId?: string | null; className?: string } = {}) {
        this.placeholder = options.placeholder || 'Выберите группу';
        this.className = options.className || '';

        this.element = document.getElementById(containerId) || this.createContainer(containerId);
        this.element.className = `custom-dropdown ${this.className}`;

        this.button = this.createButton();
        this.menu = this.createMenu();

        this.render();
        this.attachEvents();

        if (options.selectedId) {
            this.selectItemById(options.selectedId);
        }
    }

    private createContainer(id: string): HTMLElement {
        const container = document.createElement('div');
        container.id = id;
        return container;
    }

    private createButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'custom-dropdown__button';
        button.innerHTML = `
            <span class="custom-dropdown__text">${this.placeholder}</span>
            <span class="custom-dropdown__arrow"></span>
        `;
        return button;
    }

    private createMenu(): HTMLElement {
        const menu = document.createElement('div');
        menu.className = 'custom-dropdown__menu';
        return menu;
    }

    private render(): void {
        this.element.innerHTML = '';
        this.element.appendChild(this.button);
        this.element.appendChild(this.menu);
        this.renderMenuItems();
    }

    private renderMenuItems(): void {
        this.menu.innerHTML = '';

        if (this.items.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'custom-dropdown__empty';
            emptyMessage.textContent = 'Нет доступных групп';
            this.menu.appendChild(emptyMessage);
            return;
        }

        this.items.forEach(item => {
            const option = document.createElement('div');
            option.className = 'custom-dropdown__item';
            if (this.selectedItem?.id === item.id) {
                option.classList.add('custom-dropdown__item_selected');
            }
            option.dataset.value = item.id;
            option.textContent = item.name;
            option.addEventListener('click', () => this.handleItemClick(item));
            this.menu.appendChild(option);
        });
    }

    private handleItemClick(item: DropdownItem): void {
        this.selectItem(item);
        this.close();
        this.emit('change', item.id, item);
    }

    private attachEvents(): void {
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target as Node)) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    public bind(event: DropdownEvent, handler: DropdownEventHandler): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
    }

    public unbind(event: DropdownEvent, handler: DropdownEventHandler): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    private emit(event: DropdownEvent, value: string | null, item?: DropdownItem | null): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(value, item || null));
        }
    }

    public set dataItems(items: DropdownItem[]) {
        this.items = items;
        this.renderMenuItems();

        if (this.selectedItem && !items.some(item => item.id === this.selectedItem?.id)) {
            this.selectItem(null);
        }
    }

    public get selectedValue(): string | null {
        return this.selectedItem?.id || null;
    }

    public get selectedItemData(): DropdownItem | null {
        return this.selectedItem;
    }

    public selectItemById(id: string | null): void {
        if (!id) {
            this.selectItem(null);
            return;
        }

        const item = this.items.find(item => item.id === id);
        if (item) {
            this.selectItem(item);
        }
    }

    private selectItem(item: DropdownItem | null): void {
        this.selectedItem = item;

        const textSpan = this.button.querySelector('.custom-dropdown__text');
        if (textSpan) {
            textSpan.textContent = item?.name || this.placeholder;
        }

        const menuItems = this.menu.querySelectorAll('.custom-dropdown__item');
        menuItems.forEach(menuItem => {
            const value = (menuItem as HTMLElement).dataset.value;
            if (item && value === item.id) {
                menuItem.classList.add('custom-dropdown__item_selected');
            } else {
                menuItem.classList.remove('custom-dropdown__item_selected');
            }
        });
    }

    public toggle(): void {
        this.isOpen ? this.close() : this.open();
    }

    public open(): void {
        if (!this.isOpen && this.items.length > 0) {
            this.isOpen = true;
            this.element.classList.add('custom-dropdown_open');
            this.emit('open', this.selectedValue);
        }
    }

    public close(): void {
        if (this.isOpen) {
            this.isOpen = false;
            this.element.classList.remove('custom-dropdown_open');
            this.emit('close', this.selectedValue);
        }
    }

    public destroy(): void {
        this.close();
        this.eventHandlers.clear();
        this.element.remove();
    }
}