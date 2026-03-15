import { Contact } from '../models/contact';

export class ValidationService {
    static showError(input: HTMLElement, message: string): void {
        const fieldContainer = input.closest('.contact-form__field');
        if (!fieldContainer) return;

        this.hideError(input);

        input.classList.add('error');

        const errorText = document.createElement('span');
        errorText.className = 'contact-form__error-text';
        errorText.textContent = message;
        fieldContainer.appendChild(errorText);
    }

    static hideError(input: HTMLElement): void {
        const fieldContainer = input.closest('.contact-form__field');
        if (!fieldContainer) return;

        input.classList.remove('error');
        fieldContainer.querySelector('.contact-form__error-text')?.remove();
    }

    static validateContactForm(
        name: string,
        phone: string,
        selectedGroup: string | null,
        nameInput: HTMLElement,
        phoneInput: HTMLElement,
        dropdownField: HTMLElement | null
    ): boolean {
        let isValid = true;

        this.hideError(nameInput);
        this.hideError(phoneInput);
        dropdownField?.querySelector('.contact-form__error-text')?.remove();

        if (!name.trim()) {
            this.showError(nameInput, 'Поле является обязательным');
            isValid = false;
        }

        if (!phone.trim() || phone.includes('_')) {
            this.showError(phoneInput, 'Введите корректный номер телефона');
            isValid = false;
        }

        if (!selectedGroup && dropdownField) {
            const errorText = document.createElement('span');
            errorText.className = 'contact-form__error-text';
            errorText.textContent = 'Выберите группу';
            dropdownField.appendChild(errorText);
            isValid = false;
        }

        return isValid;
    }

    static isPhoneUnique(phone: string, contacts: Contact[], excludeContactId?: string): boolean {
        const normalizedPhone = this.normalizePhone(phone);
        return !contacts.some(contact =>
            this.normalizePhone(contact.phone) === normalizedPhone &&
            contact.id !== excludeContactId
        );
    }

    static normalizePhone(phone: string): string {
        return phone.replace(/\D/g, '');
    }

    static isValidPhoneFormat(phone: string): boolean {
        return !phone.includes('_') && phone.trim().length > 0;
    }
}