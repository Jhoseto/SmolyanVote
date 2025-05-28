export function initCommentEditing() {
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");
    let activeEditorBox = null;

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.edit-btn');
        if (!btn) return;

        const commentBox = btn.closest('.comment-box, .reply-box');
        const commentId = btn.dataset.id;
        const originalTextEl = commentBox.querySelector('.comment-text, .reply-text');
        const editContainer = commentBox.querySelector('.edit-container');

        if (activeEditorBox && activeEditorBox !== commentBox) {
            const activeEditContainer = activeEditorBox.querySelector('.edit-container');
            const activeTextEl = activeEditorBox.querySelector('.comment-text, .reply-text');
            const prevBtn = activeEditorBox.querySelector('.edit-btn');

            activeEditContainer.innerHTML = '';
            activeEditContainer.classList.add('d-none');
            activeTextEl.classList.remove('d-none');
            if (prevBtn) prevBtn.classList.remove('d-none');
        }

        activeEditorBox = commentBox;
        btn.classList.add('d-none');

        const currentText = originalTextEl.innerText.trim();
        editContainer.innerHTML = `
            <textarea class="form-control" rows="4">${currentText}</textarea>
            <button class="btn btn-sm btn-success save-edit-btn mt-2" data-id="${commentId}">✔ Запази</button>
            <button class="btn btn-sm btn-secondary cancel-edit-btn mt-2" data-id="${commentId}">✖ Отказ</button>
        `;
        originalTextEl.classList.add('d-none');
        editContainer.classList.remove('d-none');
    });

    document.addEventListener('click', function (e) {
        const cancelBtn = e.target.closest('.cancel-edit-btn');
        if (!cancelBtn) return;

        const commentBox = cancelBtn.closest('.comment-box, .reply-box');
        const editContainer = commentBox.querySelector('.edit-container');
        const originalTextEl = commentBox.querySelector('.comment-text, .reply-text');
        const editBtn = commentBox.querySelector('.edit-btn');

        editContainer.classList.add('d-none');
        editContainer.innerHTML = '';
        originalTextEl.classList.remove('d-none');
        if (editBtn) editBtn.classList.remove('d-none');

        activeEditorBox = null;
    });

    document.addEventListener('click', function (e) {
        const saveBtn = e.target.closest('.save-edit-btn');
        if (!saveBtn) return;

        const commentId = saveBtn.dataset.id;
        const commentBox = saveBtn.closest('.comment-box, .reply-box');
        const textarea = commentBox.querySelector('textarea');
        const newText = textarea.value.trim();

        fetch(`/api/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            },
            body: JSON.stringify({ text: newText })
        })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err.error)))
            .then(data => {
                const originalTextEl = commentBox.querySelector('.comment-text, .reply-text');
                const editContainer = commentBox.querySelector('.edit-container');
                const editBtn = commentBox.querySelector('.edit-btn');

                originalTextEl.innerHTML = data.text;
                originalTextEl.classList.remove('d-none');
                editContainer.classList.add('d-none');
                editContainer.innerHTML = '';
                if (editBtn) editBtn.classList.remove('d-none');

                activeEditorBox = null;
            })
            .catch(err => alert("Грешка при редактиране: " + err));
    });
}
