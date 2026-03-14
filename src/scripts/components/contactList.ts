import { Contact } from '../models/contact';
import { Group } from '../models/group';
import { escapeHtml } from '../utils/helpers';
import { StorageService } from '../services/storage';

export class ContactList {
    private container: HTMLElement;
    private contacts: Contact[] = [];
    private groups: Group[] = [];
    private onEditContact: (contactId: string) => void;
    private onDeleteContact: (contactId: string) => void;

    constructor(
        containerSelector: string,
        options: {
            onEditContact: (contactId: string) => void;
            onDeleteContact: (contactId: string) => void;
        }
    ) {
        this.container = document.querySelector(containerSelector)!;
        this.onEditContact = options.onEditContact;
        this.onDeleteContact = options.onDeleteContact;
    }

    setData(contacts: Contact[], groups: Group[]): void {
        this.contacts = contacts;
        this.groups = groups;
        this.render();
    }

    private render(): void {
        if (this.contacts.length === 0) {
            this.container.innerHTML = '<p class="contact-list__empty-text">Список контактов пуст</p>';
            return;
        }

        const contactsByGroup = this.groupContacts();
        const groupsHtml = this.renderGroups(contactsByGroup);

        this.container.innerHTML = `<div class="contact-groups">${groupsHtml}</div>`;
        this.attachEvents();
    }

    private groupContacts(): Map<string, Contact[]> {
        const map = new Map<string, Contact[]>();

        this.contacts.forEach(contact => {
            if (!map.has(contact.groupId)) {
                map.set(contact.groupId, []);
            }
            map.get(contact.groupId)!.push(contact);
        });

        return map;
    }

    private renderGroups(contactsByGroup: Map<string, Contact[]>): string {
        const expandedGroups = StorageService.getExpandedGroups();

        const sortedGroups = Array.from(contactsByGroup.entries()).sort((a, b) => {
            const groupA = this.groups.find(g => g.id === a[0]);
            const groupB = this.groups.find(g => g.id === b[0]);
            return (groupA?.name || '').localeCompare(groupB?.name || '');
        });

        return sortedGroups.map(([groupId, groupContacts]) => {
            const group = this.groups.find(g => g.id === groupId);
            if (!group) return '';

            const isExpanded = expandedGroups[groupId] || false;

            return `
                <div class="contact-group" data-group-id="${groupId}">
                    <div class="contact-group__header" data-group-id="${groupId}">
                        <div class="contact-group__title ${isExpanded ? 'expanded' : ''}">
                            ${group.name}
                        </div>
                        <div class="contact-group__arrow" style="transform: ${isExpanded ? 'rotate(180deg)' : 'none'}"></div>
                    </div>
                    <div id="group-content-${groupId}" class="contact-group__content ${isExpanded ? 'expanded' : ''}">
                        <div class="contact-group__contacts">
                            ${this.renderContactItems(groupContacts)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    private renderContactItems(contacts: Contact[]): string {
        return contacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <div class="contact-item__info">
                    <div class="contact-item__name">${escapeHtml(contact.name)}</div>
                    <div class="contact-item__stack">
                        <div class="contact-item__phone">${escapeHtml(contact.phone)}</div>
                           <div class="contact-item__actions">
                                <button class="contact-item__edit-btn" data-contact-id="${contact.id}" aria-label="Редактировать контакт"></button>
                                <button class="contact-item__delete-btn" data-contact-id="${contact.id}" aria-label="Удалить контакт"></button>
                           </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    private attachEvents(): void {
        document.querySelectorAll('.contact-group__header').forEach(header => {
            header.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const groupId = target.dataset.groupId;
                const content = document.getElementById(`group-content-${groupId}`);
                const title = target.querySelector('.contact-group__title');
                const arrow = target.querySelector('.contact-group__arrow') as HTMLElement;

                if (content && title && arrow) {
                    content.classList.toggle('expanded');
                    title.classList.toggle('expanded');
                    arrow.style.transform = content.classList.contains('expanded') ? 'rotate(180deg)' : 'none';

                    const expanded = StorageService.getExpandedGroups();
                    expanded[groupId!] = content.classList.contains('expanded');
                    StorageService.saveExpandedGroups(expanded);
                }
            });
        });

        document.querySelectorAll('.contact-item__edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const contactId = (e.currentTarget as HTMLElement).dataset.contactId;
                if (contactId) {
                    this.onEditContact(contactId);
                }
            });
        });

        document.querySelectorAll('.contact-item__delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const contactId = (e.currentTarget as HTMLElement).dataset.contactId;
                if (contactId) {
                    this.onDeleteContact(contactId);
                }
            });
        });
    }
}