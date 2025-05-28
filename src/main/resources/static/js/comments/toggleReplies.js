export function toggleReplies() {
    document.querySelectorAll('.replies').forEach(container => {
        const list = container.querySelector('.replies-list');
        const btn = container.querySelector('.show-replies-btn');

        if (!list || !btn) return;

        // Скрии листа по подразбиране
        list.style.display = 'none';
        btn.style.display = 'inline-block';
        btn.textContent = `Покажи всички (${list.children.length}) отговори`;

        btn.addEventListener('click', () => {
            if (list.style.display === 'none') {
                list.style.display = 'block';
                btn.textContent = 'Скрий отговорите';
            } else {
                list.style.display = 'none';
                btn.textContent = `Покажи всички (${list.children.length}) отговори`;
            }
        });
    });
}
