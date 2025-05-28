import { initReactions } from './reactions.js';
import { initEmojiPicker } from './emoji.js';
import { initDelete } from './delete.js';
import { initCommentEditing } from './edit.js';

export function initReplies(scope = document) {
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    function attachReplyEvents(currentScope = scope) {
        currentScope.querySelectorAll(".reply-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const form = document.getElementById(`reply-form-${id}`);
                if (!form) return;

                form.classList.remove("d-none");
                btn.style.display = "none";
            });
        });

        currentScope.querySelectorAll(".reply-form").forEach(form => {
            if (form.dataset.bound === "true") return;
            form.dataset.bound = "true";

            const closeBtn = form.querySelector(".close-btn");
            if (closeBtn) {
                closeBtn.addEventListener("click", () => {
                    form.classList.add("d-none");
                    const parentId = form.querySelector('input[name="parentId"]').value;
                    const replyBtn = document.querySelector(`.reply-btn[data-id="${parentId}"]`);
                    if (replyBtn) {
                        replyBtn.style.display = "inline-block";
                    }
                });
            }

            form.addEventListener("submit", function (e) {
                e.preventDefault();

                const formData = new FormData(this);
                fetch("/api/comments/reply", {
                    method: "POST",
                    headers: { [csrfHeader]: csrfToken },
                    body: formData
                })
                    .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err.error)))
                    .then(data => {
                        const formattedDate = new Date(data.createdAt).toLocaleString('bg-BG', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        const replyHTML = `
<div id="reply-${data.id}" class="card p-2 mb-2 reply-box">
    <div class="d-flex">
        <img src="${data.authorImage}" class="rounded-circle me-2 mt-1" style="width: 35px; height: 35px;" />
        <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
                <strong>${data.author}</strong>
                <small>${formattedDate}</small>
            </div>
            <div class="reply-text mt-1">${data.text}</div>

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

            <div class="d-flex justify-content-end align-items-center gap-2 mt-2">
                <button class="btn btn-sm like-btn" data-id="${data.id}" data-type="like">
                    👍 <span>0</span>
                </button>
                <button class="btn btn-sm dislike-btn" data-id="${data.id}" data-type="dislike">
                    👎 <span>0</span>
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
        </div>
    </div>
</div>
`;

                        const container = document.getElementById(`replies-container-${data.parentId}`);
                        if (container) {
                            const repliesList = container.querySelector('.replies-list');
                            if (repliesList) {
                                if (repliesList.style.display === "none") {
                                    repliesList.style.display = "block";
                                }
                                repliesList.insertAdjacentHTML("afterbegin", replyHTML);

                                const newReplyElem = document.getElementById(`reply-${data.id}`);
                                if (newReplyElem) {
                                    initReactions(newReplyElem);
                                    initEmojiPicker(newReplyElem);
                                    initDelete(newReplyElem);
                                    initCommentEditing(newReplyElem);
                                }
                            }

                            // Скрий формата и покажи бутона "Отговор"
                            form.reset();
                            form.classList.add("d-none");
                            const replyBtn = container.closest('.comment-box').querySelector(`.reply-btn[data-id="${data.parentId}"]`);
                            if (replyBtn) {
                                replyBtn.style.display = "inline-block";
                            }
                        }
                    })
                    .catch(err => alert("Грешка при създаване на отговор: " + err));
            });
        });
    }

    attachReplyEvents(scope);
}
