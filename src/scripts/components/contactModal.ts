import { CustomDropdown } from '../dropdown';
import { ValidationService } from '../services/validation';
import IMask from 'imask';
import type { InputMask } from 'imask';
import { PHONE_MASK } from '../utils/constants';

export class ContactModal {
    private modal: HTMLElement;
    private overlay: HTMLElement | null;
    private nameInput: HTMLInputElement;
    private phoneInput: HTMLInputElement;
    private dropdownContainer: HTMLElement;
    private phoneMask: InputMask<{ mask: string }> | null = null;
    private dropdown: CustomDropdown | null = null;
    private onSave: (data: { name: string; phone: string; groupId: string | null; isEdit: boolean; editId?: string }) => void;

    constructor(
        modalId: string,
        options: {
            onSave: ContactModal['onSave'];
            onClose?: () => void;
        }
    ) {
        this.modal = document.getElementById(modalId)!;
        this.overlay = this.modal.querySelector('.modal__overlay');
        this.nameInput = document.getElementById('contactName') as HTMLInputElement;
        this.phoneInput = document.getElementById('contactPhone') as HTMLInputElement;
        this.dropdownContainer = document.getElementById('contactGroupDropdown')!;
        this.onSave = options.onSave;

        this.initPhoneMask();
        this.attachEvents();
    }

    private initPhoneMask(): void {
        if (this.phoneInput) {
            this.phoneMask = IMask(this.phoneInput, {
                mask: PHONE_MASK,
                lazy: false,
                placeholderChar: '_'
            });
        }
    }

    private attachEvents(): void {
        document.getElementById('closeContactModal')?.addEventListener('click', () => this.close());
        document.getElementById('cancelContactBtn')?.addEventListener('click', () => this.close());

        document.getElementById('saveContactBtn')?.addEventListener('click', () => this.handleSave());

        this.modal.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).classList.contains('modal__overlay')) {
                this.close();
            }
        });

        this.nameInput.addEventListener('input', () => {
            if (this.nameInput.value.trim()) {
                ValidationService.hideError(this.nameInput);
            }
        });

        this.phoneInput.addEventListener('input', () => {
            if (this.phoneInput.value.trim() && !this.phoneInput.value.includes('_')) {
                ValidationService.hideError(this.phoneInput);
            }
        });
    }

    setDropdown(dropdown: CustomDropdown): void {
        this.dropdown = dropdown;
    }

    setGroups(groups: { id: string; name: string }[]): void {
        if (this.dropdown) {
            this.dropdown.dataItems = groups.map(g => ({ id: g.id, name: g.name } as any));
        }
    }

    open(editData?: { id: string; name: string; phone: string; groupId: string }): void {
        if (!this.overlay) return;

        const title = this.modal.querySelector('.modal__title');
        if (title) {
            title.textContent = editData ? 'Редактирование контакта' : 'Добавление контакта';
        }

        if (editData) {
            this.modal.dataset.editMode = 'true';
            this.modal.dataset.editId = editData.id;
            this.nameInput.value = editData.name;

            if (this.phoneMask) {
                this.phoneMask.value = editData.phone;
            } else {
                this.phoneInput.value = editData.phone;
            }

            this.dropdown?.selectItemById(editData.groupId);
        } else {
            this.reset();
        }

        this.overlay.classList.add('active');
    }

    close(): void {
        if (!this.overlay) return;
        this.overlay.classList.remove('active');
        this.reset();
        this.dropdown?.close();
        this.modal.dataset.editMode = 'false';
        this.modal.dataset.editId = '';
    }

    private reset(): void {
        const form = document.getElementById('contactForm') as HTMLFormElement;
        form?.reset();
        if (this.phoneMask) {
            this.phoneMask.value = '';
        }
        this.dropdown?.selectItemById(null);

        ValidationService.hideError(this.nameInput);
        ValidationService.hideError(this.phoneInput);
        this.dropdownContainer.closest('.contact-form__field')?.querySelector('.contact-form__error-text')?.remove();
    }

    private handleSave(): void {
        const isEdit = this.modal.dataset.editMode === 'true';
        const editId = this.modal.dataset.editId;
        const dropdownField = this.dropdownContainer.closest('.contact-form__field');
        const dropdownElement = dropdownField instanceof HTMLElement ? dropdownField : null;

        const isValid = ValidationService.validateContactForm(
            this.nameInput.value,
            this.phoneInput.value,
            this.dropdown?.selectedValue || null,
            this.nameInput,
            this.phoneInput,
            dropdownElement
        );

        if (!isValid) return;

        this.onSave({
            name: this.nameInput.value.trim(),
            phone: this.phoneInput.value.trim(),
            groupId: this.dropdown?.selectedValue || null,
            isEdit,
            editId
        });
    }
}