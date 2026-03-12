import '../styles/main.scss'

const groupsBtn = document.getElementById('group-btn');
const modal = document.getElementById('groupsModal');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

function openModal() {
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    if (modal) {
        modal.classList.remove('active');
    }
}

if (groupsBtn) {
    groupsBtn.addEventListener('click', openModal);
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
}

if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        console.log('Группы сохранены');
        closeModal();
    });
}

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}


document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('active')) {
        closeModal();
    }
});

const style = document.createElement('style');
style.textContent = `
  .group-item.selected {
    background: #E8F0FE;
    color: var(--accent-color);
    font-weight: bold;
  }
`;
document.head.appendChild(style);