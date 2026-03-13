import '../styles/main.scss'

interface Group {
    id: string;
    name: string;
}

const STORAGE_KEY = 'contact_groups';

const elements = {
    groupsBtn: document.getElementById('group-btn'),
    modal: document.getElementById('groupsModal'),
    closeBtn: document.getElementById('closeModal'),
    saveBtn: document.getElementById('saveBtn'),
    addGroupBtn: document.getElementById('addGroupBtn'),
    modalBody: document.querySelector('.modal-body')
} as const;

let groups: Group[] = [];
let newGroupInput: HTMLInputElement | null = null;
let editingGroupId: string | null = null;


const generateId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

const saveGroups = (): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch (error) {
        console.error('Ошибка сохранения групп:', error);
    }
};

const loadGroups = (): void => {
    try {
        const savedGroups = localStorage.getItem(STORAGE_KEY);
        groups = savedGroups ? JSON.parse(savedGroups) : [];
    } catch (error) {
        console.error('Ошибка загрузки групп:', error);
        groups = [];
    }
};

const modalHandlers = {
    open: () => {
        if (elements.modal) {
            editingGroupId = null;
            newGroupInput = null;
            renderGroups();
            elements.modal.classList.add('active');
        }
    },
    close: () => {
        if (elements.modal) {
            editingGroupId = null;
            newGroupInput = null;
            elements.modal.classList.remove('active');
        }
    }
};

const renderers = {
    groupItem(group: Group): HTMLElement {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.dataset.id = group.id;

        const span = document.createElement('span');
        span.textContent = group.name;
        span.addEventListener('click', () => {
            editingGroupId = group.id;
            renderGroups();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-icon';
        deleteBtn.setAttribute('aria-label', 'Удалить группу');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(group.id);
        });

        item.append(span, deleteBtn);
        return item;
    },

    editGroupInput(group: Group): HTMLElement {
        const container = document.createElement('div');
        container.className = 'edit-group-container';
        container.dataset.id = group.id;

        const inputContainer = document.createElement('div');
        inputContainer.className = 'new-group-input-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'new-group-input';
        input.value = group.name;
        input.placeholder = 'Введите название';

        const saveEdit = (value: string) => {
            if (value.trim()) {
                const index = groups.findIndex(g => g.id === group.id);
                if (index !== -1) {
                    groups[index].name = value.trim();
                    saveGroups();
                }
            }
            editingGroupId = null;
            renderGroups();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit(input.value.trim());
            }
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-icon';
        cancelBtn.setAttribute('aria-label', 'Отменить');
        cancelBtn.addEventListener('click', () => {
            editingGroupId = null;
            renderGroups();
        });

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-blue';
        saveBtn.textContent = 'Сохранить';
        saveBtn.style.padding = '10px 14px';
        saveBtn.addEventListener('click', () => saveEdit(input.value.trim()));

        inputContainer.append(input, cancelBtn);
        container.append(inputContainer, saveBtn);

        setTimeout(() => input.focus(), 100);
        return container;
    },

    newGroupInput(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'new-group-input-container';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'new-group-input';
        input.placeholder = 'Введите название';

        const saveNew = () => {
            const name = input.value.trim();
            if (name) {
                groups.push({ id: generateId(), name });
                saveGroups();
            }
            newGroupInput = null;
            renderGroups();
        };

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveNew();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (!document.activeElement?.closest('.modal-footer')) {
                    saveNew();
                }
            }, 200);
        });

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'delete-icon';
        cancelBtn.setAttribute('aria-label', 'Отменить');
        cancelBtn.addEventListener('click', () => {
            newGroupInput = null;
            renderGroups();
        });

        container.append(input, cancelBtn);
        newGroupInput = input;

        setTimeout(() => input.focus(), 100);
        return container;
    }
};

function renderGroups(): void {
    if (!elements.modalBody) return;

    elements.modalBody.innerHTML = '';

    if (groups.length === 0 && !editingGroupId && !newGroupInput) {
        const empty = document.createElement('p');
        empty.className = 'groups-empty';
        empty.textContent = 'Нет созданных групп';
        elements.modalBody.appendChild(empty);
        return;
    }

    groups.forEach(group => {
        if (editingGroupId === group.id) {
            elements.modalBody!.appendChild(renderers.editGroupInput(group));
        } else {
            elements.modalBody!.appendChild(renderers.groupItem(group));
        }
    });

    if (newGroupInput?.parentElement) {
        elements.modalBody.appendChild(newGroupInput.parentElement);
    }
}

function showDeleteConfirmation(groupId: string): void {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    overlay.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-header">
                <button class="close-confirm" aria-label="Закрыть"></button>
            </div>
            <div class="confirm-body">
                <h3>Удалить группу?</h3>
                <p>Удаление группы повлечет за собой удаление контактов связанных с этой группой</p>
                <div class="confirm-footer">
                    <button class="btn btn-blue confirm-delete">Да, удалить</button>
                    <button class="btn btn-white confirm-cancel">Отмена</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    setTimeout(() => overlay.classList.add('active'), 10);

    overlay.querySelector('.close-confirm')?.addEventListener('click', closeModal);
    overlay.querySelector('.confirm-cancel')?.addEventListener('click', closeModal);
    overlay.querySelector('.confirm-delete')?.addEventListener('click', () => {
        groups = groups.filter(g => g.id !== groupId);
        saveGroups();

        if (editingGroupId === groupId) {
            editingGroupId = null;
        }

        renderGroups();
        closeModal();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && document.body.contains(overlay)) {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function init(): void {
    loadGroups();

    elements.groupsBtn?.addEventListener('click', modalHandlers.open);
    elements.closeBtn?.addEventListener('click', modalHandlers.close);
    elements.addGroupBtn?.addEventListener('click', () => {
        if (editingGroupId) editingGroupId = null;
        if (!newGroupInput) {
            elements.modalBody?.appendChild(renderers.newGroupInput());
        }
    });
    elements.saveBtn?.addEventListener('click', () => {
        if (newGroupInput) {
            const event = new Event('blur');
            newGroupInput.dispatchEvent(event);
        }
    });

    elements.modal?.addEventListener('click', (e) => {
        if (e.target === elements.modal) modalHandlers.close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal?.classList.contains('active')) {
            modalHandlers.close();
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}