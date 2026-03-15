import { Group } from '../models/group';
import { generateId } from '../utils/helpers';
import { ConfirmModal } from './confirmModal';
import { Toast } from './toast';

export class GroupsModal {
    private modal: HTMLElement;
    private overlay: HTMLElement | null;
    private bodyContainer: HTMLElement | null;
    private groups: Group[] = [];
    private newGroupInput: HTMLInputElement | null = null;
    private editingGroupId: string | null = null;
    private onGroupsChange: (groups: Group[]) => void;

    constructor(modalId: string, options: { onGroupsChange: (groups: Group[]) => void }) {
        this.modal = document.getElementById(modalId)!;
        this.overlay = this.modal.querySelector('.modal__overlay');
        this.bodyContainer = document.querySelector('.modal__body-container');
        this.onGroupsChange = options.onGroupsChange;

        this.attachEvents();
    }

    private attachEvents(): void {
        document.getElementById('closeModal')?.addEventListener('click', () => this.close());
        document.getElementById('addGroupBtn')?.addEventListener('click', () => this.addNewGroup());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveNewGroup());

        this.modal.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('modal__overlay')) {
                Toast.clearAll();
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
                Toast.clearAll();
                this.close();
            }
        });
    }

    setGroups(groups: Group[]): void {
        this.groups = groups;
    }

    open(): void {
        if (!this.overlay) return;

        Toast.clearAll();
        this.editingGroupId = null;
        this.newGroupInput = null;
        this.render();
        this.overlay.classList.add('active');
    }

    close(): void {
        if (!this.overlay) return;

        this.editingGroupId = null;
        this.newGroupInput = null;

        if (this.bodyContainer) {
            this.bodyContainer.innerHTML = '';
        }

        Toast.clearAll();
        this.overlay.classList.remove('active');
    }

    private addNewGroup(): void {
        if (this.editingGroupId) this.editingGroupId = null;

        if (!this.newGroupInput && this.bodyContainer) {
            const newInputContainer = this.createNewGroupInput();
            this.bodyContainer.appendChild(newInputContainer);
            this.render();
        }
    }

    private saveNewGroup(): void {
        if (this.newGroupInput) {
            const name = this.newGroupInput.value.trim();

            if (!name) {
                Toast.removeByMessage('Введите название группы');
                Toast.error('Введите название группы');
                return;
            }

            if (this.isGroupNameExists(name)) {
                const errorMessage = `Группа "${name}" уже существует`;
                Toast.removeByMessage(errorMessage);
                Toast.error(errorMessage);
                return;
            }

            const newGroup = new Group(generateId(), name);
            this.groups.push(newGroup);
            this.onGroupsChange(this.groups);
            Toast.success(`Группа "${name}" создана`);

            this.newGroupInput = null;
            this.render();
        }
    }

    private render(): void {
        if (!this.bodyContainer) return;

        this.bodyContainer.innerHTML = '';

        if (this.groups.length === 0 && !this.editingGroupId && !this.newGroupInput) {
            const empty = document.createElement('p');
            empty.className = 'group-empty';
            empty.textContent = 'Нет созданных групп';
            this.bodyContainer.appendChild(empty);
            return;
        }

        this.groups.forEach(group => {
            if (this.editingGroupId === group.id) {
                this.bodyContainer!.appendChild(this.createEditGroupInput(group));
            } else {
                this.bodyContainer!.appendChild(this.createGroupItem(group));
            }
        });

        if (this.newGroupInput) {
            const container = this.newGroupInput.closest('.new-group-container');
            if (container) {
                this.bodyContainer.appendChild(container);
            }
        }
    }

    private createGroupItem(group: Group): HTMLElement {
        const item = document.createElement('div');
        item.className = 'group-item';

        const span = document.createElement('span');
        span.className = 'group-item__name';
        span.textContent = group.name;
        span.addEventListener('click', () => {
            Toast.clearAll();
            this.editingGroupId = group.id;
            this.render();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'group-item__delete';
        deleteBtn.setAttribute('aria-label', 'Удалить группу');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            Toast.clearAll();
            this.showDeleteConfirmation(group.id);
        });

        item.append(span, deleteBtn);
        return item;
    }

    private createEditGroupInput(group: Group): HTMLElement {
        const container = document.createElement('div');
        container.className = 'edit-group';

        const inputContainer = document.createElement('div');
        inputContainer.className = 'new-group-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'new-group-input';
        input.value = group.name;
        input.placeholder = 'Введите название';

        let isSaving = false;
        let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
        const oldName = group.name;

        const cleanup = () => {
            if (outsideClickHandler) {
                document.removeEventListener('mousedown', outsideClickHandler);
                outsideClickHandler = null;
            }
        };

        const saveEdit = (value: string) => {
            if (isSaving) return;

            const trimmedValue = value.trim();

            if (!trimmedValue) {
                Toast.removeByMessage('Название группы не может быть пустым');
                Toast.error('Название группы не может быть пустым');
                return;
            }

            if (trimmedValue !== oldName && this.isGroupNameExists(trimmedValue, group.id)) {
                const errorMessage = `Группа "${trimmedValue}" уже существует`;
                Toast.removeByMessage(errorMessage);
                Toast.error(errorMessage);
                return;
            }

            if (trimmedValue !== oldName) {
                isSaving = true;
                const index = this.groups.findIndex(g => g.id === group.id);
                if (index !== -1) {
                    this.groups[index].name = trimmedValue;
                    this.onGroupsChange(this.groups);
                    Toast.info(`Группа переименована из "${oldName}" в "${trimmedValue}"`);
                }
            }

            cleanup();
            this.editingGroupId = null;
            this.render();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                saveEdit(input.value.trim());
            }
        });

        outsideClickHandler = (e: MouseEvent) => {
            if (!input.contains(e.target as Node) && !container.contains(e.target as Node)) {
                if (!isSaving) {
                    const isOverlay = (e.target as HTMLElement).classList.contains('modal__overlay');

                    if (isOverlay) {
                        Toast.clearAll();
                        cleanup();
                        this.editingGroupId = null;
                        this.render();
                        this.close();
                    } else if (input.value.trim()) {
                        saveEdit(input.value);
                    } else {
                        Toast.clearAll();
                        cleanup();
                        this.editingGroupId = null;
                        this.render();
                    }
                }
            }
        };

        setTimeout(() => {
            if (!isSaving) {
                document.addEventListener('mousedown', outsideClickHandler!);
            }
        }, 100);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'new-group__delete-btn';
        cancelBtn.setAttribute('aria-label', 'Отменить');
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Toast.clearAll();
            cleanup();
            this.editingGroupId = null;
            this.render();
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn_blue edit-group__save-btn';
        saveBtn.textContent = 'Сохранить';
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveEdit(input.value.trim());
        });

        inputContainer.append(input, cancelBtn);
        container.append(inputContainer, saveBtn);

        setTimeout(() => input.focus(), 100);
        return container;
    }

    private createNewGroupInput(): HTMLElement {
        if (this.newGroupInput) {
            const existingContainer = this.newGroupInput.closest('.new-group-container');
            if (existingContainer) {
                return existingContainer as HTMLElement;
            }
        }

        const container = document.createElement('div');
        container.className = 'new-group-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'new-group-input';
        input.placeholder = 'Введите название группы';

        let isSaving = false;
        let outsideClickHandler: ((e: MouseEvent) => void) | null = null;

        const cleanup = () => {
            if (outsideClickHandler) {
                document.removeEventListener('mousedown', outsideClickHandler);
                outsideClickHandler = null;
            }
        };

        const saveNew = () => {
            if (isSaving) return;

            const name = input.value.trim();

            if (!name) {
                Toast.removeByMessage('Введите название группы');
                Toast.error('Введите название группы');
                return;
            }

            if (this.isGroupNameExists(name)) {
                const errorMessage = `Группа "${name}" уже существует`;
                Toast.removeByMessage(errorMessage);
                Toast.error(errorMessage);
                return;
            }

            isSaving = true;
            const newGroup = new Group(generateId(), name);
            this.groups.push(newGroup);
            this.onGroupsChange(this.groups);
            Toast.success(`Группа "${name}" создана`);

            cleanup();
            this.newGroupInput = null;
            this.render();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                saveNew();
            }
        });

        outsideClickHandler = (e: MouseEvent) => {
            if (!input.contains(e.target as Node) && !container.contains(e.target as Node)) {
                if (!isSaving) {
                    const isOverlay = (e.target as HTMLElement).classList.contains('modal__overlay');

                    if (isOverlay) {
                        Toast.clearAll();
                        cleanup();
                        this.newGroupInput = null;
                        this.render();
                        this.close();
                    } else if (input.value.trim()) {
                        saveNew();
                    } else {
                        Toast.clearAll();
                        cleanup();
                        this.newGroupInput = null;
                        this.render();
                    }
                }
            }
        };

        setTimeout(() => {
            if (!isSaving) {
                document.addEventListener('mousedown', outsideClickHandler!);
            }
        }, 100);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'new-group__delete-btn';
        cancelBtn.setAttribute('aria-label', 'Отменить');
        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            Toast.clearAll();
            cleanup();
            this.newGroupInput = null;
            this.render();
        });

        container.append(input, cancelBtn);
        this.newGroupInput = input;

        setTimeout(() => input.focus(), 100);
        return container;
    }

    private isGroupNameExists(name: string, excludeGroupId?: string): boolean {
        return this.groups.some(group =>
            group.name.toLowerCase() === name.toLowerCase() &&
            group.id !== excludeGroupId
        );
    }

    private showDeleteConfirmation(groupId: string): void {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        new ConfirmModal({
            title: 'Удалить группу?',
            message: `Удаление группы "${group.name}" повлечет за собой удаление всех контактов в этой группе`,
            onConfirm: () => {
                this.groups = this.groups.filter(g => g.id !== groupId);
                this.onGroupsChange(this.groups);
                Toast.error(`Группа "${group.name}" удалена`);

                if (this.editingGroupId === groupId) {
                    this.editingGroupId = null;
                }
                this.render();
            }
        }).show();
    }
}