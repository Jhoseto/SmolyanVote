import { initReactions } from './reactions.js';
import { initEmojiPicker } from './emoji.js';
import { initDelete } from './delete.js';
import { initCommentEditing } from './edit.js';
import { initReplies } from './replies.js';  // Ако имаш инициализация за отговорите

export function initComments() {
    const commentForm = document.getElementById("comment-form");
    const commentsSection = document.getElementById("comments-section");
    const targetId = commentsSection?.dataset.targetId;
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    if (!commentForm || !targetId) return;

    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(this);
        if (!formData.has('targetId')) {
            formData.append('targetId', targetId);
        }

        fetch("/api/comments", {
            method: "POST",
            headers: { [csrfHeader]: csrfToken },
            body: formData
        })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err.error)))
            .then(data => {
                const dateObj = new Date(data.createdAt);
                let formattedDate = "—";  // Дефинираме променлива навън

                if (!isNaN(dateObj)) {
                    formattedDate = dateObj.toLocaleString('bg-BG', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    console.error("Invalid Date:", data.createdAt);
                }
                // Създай HTML подобен на Thymeleaf шаблона за коментар
                const commentHTML = `
<div id="comment-${data.id}" class="card p-3 comment-box">
    <div class="d-flex">
        <img src="${data.authorImage}" class="rounded-circle me-3" style="width: 40px; height: 40px;" />
        <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${data.author}</strong><br />
                    <small>${formattedDate}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm like-btn" data-id="${data.id}" data-type="like">👍 <span>0</span></button>
                    <button class="btn btn-sm dislike-btn" data-id="${data.id}" data-type="dislike">👎 <span>0</span></button>
                </div>
            </div>

            <div class="mt-2 comment-text">${data.text}</div>

            <div id="edit-container-${data.id}" class="edit-container mt-2 d-none">
                <textarea id="edit-editor-${data.id}" class="form-control tiny-edit-textarea"></textarea>
                <div class="mt-2 d-flex gap-2">
                    <button class="btn btn-sm btn-success save-edit-btn" data-id="${data.id}">
                        <i class="bi bi-check-lg"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary cancel-edit-btn" data-id="${data.id}">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-2">
                <button class="btn btn-sm btn-outline-secondary reply-btn" data-id="${data.id}">
                    <i class="bi bi-reply-fill"></i> Отговор
                </button>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-warning edit-btn" data-id="${data.id}" title="Редактирай">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${data.id}" title="Изтрий">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            <form class="reply-form mt-3 d-none" id="reply-form-${data.id}">
                <input type="hidden" name="targetId" value="${targetId}" />
                <input type="hidden" name="parentId" value="${data.id}" />
                <input type="hidden" name="author" value="${data.author}" />

                <button type="button" class="close-btn" aria-label="Close form">×</button>
                <textarea name="text" class="form-control mb-2" rows="2" placeholder="Отговор..." required></textarea>
                <div>
                    <button type="submit" class="submit-btn btn btn-sm btn-primary">Изпрати</button>
                    <button type="button" class="emoji-reply-btn btn btn-outline-secondary btn-sm" title="Добави емоджи">😀</button>
                </div>
                <div class="emoji-reply-picker emoji-picker d-none" style="max-width: 200px;"></div>
            </form>

            <div class="replies mt-3 ms-4" id="replies-container-${data.id}">
                <div class="replies-list" style="display: none;"></div>
                <div class="text-center mt-2">
                    <button class="show-replies-btn btn btn-link p-0" style="font-size: 0.9rem; color: #888888; display:none;">
                        Покажи всички (0) отговори
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
`;

                // Добави в началото на списъка с коментари
                const commentList = document.getElementById("comment-list");
                if (commentList) {
                    commentList.insertAdjacentHTML("afterbegin", commentHTML);

                    // Инициализирай събития и функционалности за новия коментар
                    const newCommentElem = document.getElementById(`comment-${data.id}`);
                    if (newCommentElem) {
                        initReactions(newCommentElem);
                        initEmojiPicker(newCommentElem);
                        initDelete(newCommentElem);
                        initCommentEditing(newCommentElem);
                        initReplies(newCommentElem);
                    }

                    // Ресетни формата
                    commentForm.reset();
                }
            })
            .catch(err => alert("Грешка: " + err));
    });
}
