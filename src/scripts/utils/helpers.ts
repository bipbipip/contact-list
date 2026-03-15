export const generateId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;

export const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};