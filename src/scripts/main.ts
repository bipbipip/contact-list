import '../styles/main.scss';
import { CustomDropdown, DropdownItem } from './dropdown';
import { StorageService } from './services/storage';
import { ContactModal } from './components/contactModal';
import { GroupsModal } from './components/groupsModal';
import { ContactList } from './components/contactList';
import { ConfirmModal } from './components/confirmModal';
import { Group } from './models/group';
import { Contact } from './models/contact';
import { generateId } from './utils/helpers';

let groups: Group[] = [];
let contacts: Contact[] = [];

const contactDropdown = new CustomDropdown('contactGroupDropdown', {
    placeholder: 'Выберите группу',
    className: 'contact-form__dropdown'
});

const contactModal = new ContactModal('contactModal', {
    onSave: (data) => {
        const { name, phone, groupId, isEdit, editId } = data;

        if (!groupId) return;

        if (isEdit && editId) {
            const index = contacts.findIndex(c => c.id === editId);
            if (index !== -1) {
                contacts[index] = new Contact(editId, name, phone, groupId);
            }
        } else {
            const newContact = new Contact(generateId(), name, phone, groupId);
            contacts.push(newContact);
        }

        StorageService.saveContacts(contacts);
        contactList.setData(contacts, groups);
        contactModal.close();
    }
});

const groupsModal = new GroupsModal('groupsModal', {
    onGroupsChange: (updatedGroups) => {
        const deletedGroups = groups.filter(g => !updatedGroups.find(ug => ug.id === g.id));

        deletedGroups.forEach(group => {
            contacts = contacts.filter(c => c.groupId !== group.id);
        });

        groups = updatedGroups;
        StorageService.saveGroups(groups);
        StorageService.saveContacts(contacts);
        contactDropdown.dataItems = groups.map(g => new DropdownItem(g.id, g.name));
        contactList.setData(contacts, groups);
    }
});

const contactList = new ContactList('.contact-list__body', {
    onEditContact: (contactId) => {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            contactModal.open({
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                groupId: contact.groupId
            });
        }
    },
    onDeleteContact: (contactId) => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;

        new ConfirmModal({
            title: 'Удалить контакт?',
            message: `Вы уверены, что хотите удалить контакт "${contact.name}"?`,
            onConfirm: () => {
                contacts = contacts.filter(c => c.id !== contactId);
                StorageService.saveContacts(contacts);
                contactList.setData(contacts, groups);
            }
        }).show();
    }
});

groups = StorageService.loadGroups();
contacts = StorageService.loadContacts();

contactModal.setDropdown(contactDropdown);
contactModal.setGroups(groups);
contactList.setData(contacts, groups);

document.getElementById('group-btn')?.addEventListener('click', () => {
    groupsModal.setGroups(groups);
    groupsModal.open();
});

document.querySelector('.contact-list__add-btn')?.addEventListener('click', () => {
    contactModal.open();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
    }
});