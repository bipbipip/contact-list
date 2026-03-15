import { CustomDropdown, DropdownItem } from '../dropdown';
import { ValidationService } from '../services/validation';
import { Toast } from './toast';
import IMask from 'imask';
import type { InputMask } from 'imask';
import { PHONE_MASK } from '../utils/constants';
import { Contact } from '../models/contact';

export class ContactModal {
    private modal: HTMLElement;
    private overlay: HTMLElement | null;
    private nameInput: HTMLInputElement;
    private phoneInput: HTMLInputElement;
    private dropdownContainer: HTMLElement;
    private phoneMask: InputMask<{ mask: string }> | null = null;
    private dropdown: CustomDropdown | null = null;
    private onSave: (data: { name: string; phone: string; groupId: string | null; isEdit: boolean; editId?: string }) => void;
    private contacts: Contact[] = [];

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

    setContacts(contacts: Contact[]): void {
        this.contacts = contacts;
    }

    setDropdown(dropdown: CustomDropdown): void {
        this.dropdown = dropdown;

        this.dropdown.bind('change', (value) => {
            if (value) {
                const dropdownField = this.dropdownContainer.closest('.contact-form__field');
                if (dropdownField) {
                    dropdownField.querySelector('.contact-form__error-text')?.remove();
                }
            }
        });
    }

    setGroups(groups: { id: string; name: string }[]): void {
        if (this.dropdown) {
            const dropdownItems = groups.map(g => new DropdownItem(g.id, g.name));
            this.dropdown.dataItems = dropdownItems;
        }
    }

    open(editData?: { id: string; name: string; phone: string; groupId: string }): void {
        if (!this.overlay) return;

        const title = this.modal.querySelector('.modal__title');
        if (title) {
            title.textContent = editData ? 'Редактирование контакта' : 'Добавление контакта';
        }

        Toast.clearAll();

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

        this.reset();
        this.dropdown?.close();
        this.modal.dataset.editMode = 'false';
        this.modal.dataset.editId = '';

        Toast.clearAll();
        this.overlay.classList.remove('active');
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

        const dropdownField = this.dropdownContainer.closest('.contact-form__field');
        if (dropdownField) {
            dropdownField.querySelector('.contact-form__error-text')?.remove();
        }
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

        const phone = this.phoneInput.value.trim();
        const normalizedPhone = ValidationService.normalizePhone(phone);

        if (!ValidationService.isPhoneUnique(phone, this.contacts, isEdit ? editId : undefined)) {
            const errorMessage = `Контакт с номером ${normalizedPhone} уже существует`;
            Toast.removeByMessage(errorMessage);
            Toast.error(errorMessage);

            ValidationService.showError(this.phoneInput, 'Этот номер уже используется');
            return;
        }

        this.onSave({
            name: this.nameInput.value.trim(),
            phone: phone,
            groupId: this.dropdown?.selectedValue || null,
            isEdit,
            editId
        });
    }
}