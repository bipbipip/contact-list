export class Contact {
    public id: string;
    public name: string;
    public phone: string;
    public groupId: string;

    constructor(id: string, name: string, phone: string, groupId: string) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.groupId = groupId;
    }
}