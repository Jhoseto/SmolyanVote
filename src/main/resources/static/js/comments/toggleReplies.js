export function toggleReplies() {
    document.querySelectorAll('.replies').forEach(container => {
        const list = container.querySelector('.replies-list');
        const btn = container.querySelector('.show-replies-btn');

        if (list) list.style.display = 'none';
        if (btn) {
            btn.style.display = 'inline-block';
            btn.addEventListener('click', () => {
                list.style.display = 'block';
                btn.style.display = 'none';
            });
        }
    });
}
