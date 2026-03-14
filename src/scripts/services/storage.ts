import { STORAGE_KEYS } from '../utils/constants';
import { Group } from '../models/group';
import { Contact } from '../models/contact';

export class StorageService {
    static saveGroups(groups: Group[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
        } catch (error) {
            console.error('Ошибка сохранения групп:', error);
        }
    }

    static loadGroups(): Group[] {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
            return saved ? JSON.parse(saved).map((g: any) => new Group(g.id, g.name)) : [];
        } catch (error) {
            console.error('Ошибка загрузки групп:', error);
            return [];
        }
    }

    static saveContacts(contacts: Contact[]): void {
        try {
            localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
        } catch (error) {
            console.error('Ошибка сохранения контактов:', error);
        }
    }

    static loadContacts(): Contact[] {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
            return saved ? JSON.parse(saved).map((c: any) => new Contact(c.id, c.name, c.phone, c.groupId)) : [];
        } catch (error) {
            console.error('Ошибка загрузки контактов:', error);
            return [];
        }
    }

    static getExpandedGroups(): Record<string, boolean> {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPANDED_GROUPS) || '{}');
        } catch {
            return {};
        }
    }

    static saveExpandedGroups(expanded: Record<string, boolean>): void {
        localStorage.setItem(STORAGE_KEYS.EXPANDED_GROUPS, JSON.stringify(expanded));
    }
}