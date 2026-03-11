import '../styles/main.scss'

interface User {
    name: string;
    age: number;
}

const user: User = {
    name: 'Илья',
    age: 24
};

console.log('Проект запущен!', user);


const app = document.getElementById('app');
if (app) {
    const element = document.createElement('p');
    element.textContent = `Привет, ${user.name}! Тебе ${user.age} лет.`;
    app.appendChild(element);
}