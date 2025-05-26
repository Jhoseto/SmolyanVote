document.addEventListener("DOMContentLoaded", () => {
    const commentForm = document.getElementById("comment-form");
    const commentsSection = document.getElementById("comments-section");
    const targetId = commentsSection?.dataset.targetId;
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    if (!commentForm || !targetId) return;

    // Инициализация на Quill редактор с емоджита
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Вашият коментар...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['emoji']  // бутон за емотикони
            ],
            "emoji-toolbar": true,
            "emoji-textarea": false,
            "emoji-shortname": true
        }
    });

    // Задаване на висок z-index на emoji picker при клик, за да не бъде скрит
    document.addEventListener("click", () => {
        const picker = document.querySelector(".ql-emoji-picker");
        if (picker) {
            picker.style.zIndex = "9999";
        }
    });

    // Основна форма за добавяне на коментар
    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // Вземаме съдържанието от Quill (HTML)
        const content = quill.root.innerHTML;
        document.getElementById('comment-hidden').value = content;

        const formData = new FormData(this);

        // Добавяме targetId, ако липсва
        if (!formData.has('targetId')) {
            formData.append('targetId', targetId);
        }

        fetch("/api/comments", {
            method: "POST",
            headers: {
                [csrfHeader]: csrfToken
            },
            body: formData
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => Promise.reject(data.error || "Грешка при изпращане"));
                }
                return res.json();
            })
            .then(() => window.location.reload())
            .catch(err => alert("Грешка: " + err));
    });

    // Функция за закачане на събития за reply бутони и форми
    function attachReplyEvents(scope = document) {
        scope.querySelectorAll(".reply-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const form = document.getElementById(`reply-form-${id}`);
                if (form) {
                    form.classList.toggle("d-none");
                }
            });
        });

        scope.querySelectorAll(".reply-form").forEach(form => {
            if (form.getAttribute("data-bound") === "true") return;
            form.setAttribute("data-bound", "true");

            form.addEventListener("submit", function (e) {
                e.preventDefault();
                const formData = new FormData(this);
                const parentId = formData.get("parentId");
                const targetId = formData.get("targetId");

                fetch("/api/comments/reply", {
                    method: "POST",
                    headers: {
                        [csrfHeader]: csrfToken
                    },
                    body: formData
                })
                    .then(res => {
                        if (!res.ok) {
                            return res.json().then(data => Promise.reject(data.error || "Грешка при изпращане на отговор"));
                        }
                        return res.json();
                    })
                    .then(data => {
                        const replyHTML = `
                        <div class="border-start ps-3 mb-2 ms-4 mt-2 reply-box" id="reply-${data.id}">
                            <div class="d-flex align-items-start">
                                <img src="${data.authorImage}" class="rounded-circle me-2 mt-1" style="width: 30px; height: 30px; object-fit: cover;" alt="Потребителска снимка">
                                <div>
                                    <strong>${data.author}</strong>
                                    <p>${data.text}</p>
                                </div>
                            </div>
                        </div>`;
                        const repliesContainer = document.getElementById(`replies-container-${parentId}`);
                        if (repliesContainer) {
                            repliesContainer.insertAdjacentHTML("beforeend", replyHTML);
                            attachReplyEvents(repliesContainer); // Закачаме събития и за новия reply, ако има такива бутони
                        }
                        this.reset();
                        this.classList.add("d-none");
                    })
                    .catch(err => alert("Грешка: " + err));
            });
        });
    }
    attachReplyEvents();

    // like & dislike бутоните - гласуване
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".like-btn, .dislike-btn");
        if (!btn) return;

        const commentId = btn.dataset.id;
        const type = btn.dataset.type;

        fetch(`/api/comments/${commentId}/reaction/${type}`, {
            method: "POST",
            headers: {
                [csrfHeader]: csrfToken
            }
        })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => Promise.reject(data.error || "Грешка при гласуване"));
                }
                return res.json();
            })
            .then(data => {
                const commentBox = btn.closest(".comment-box, .reply-box");
                if (!commentBox) return;

                const likeBtn = commentBox.querySelector(".like-btn");
                const dislikeBtn = commentBox.querySelector(".dislike-btn");

                if (likeBtn && dislikeBtn) {
                    likeBtn.querySelector("span").textContent = data.likes;
                    dislikeBtn.querySelector("span").textContent = data.dislikes;

                    likeBtn.classList.remove("btn-primary");
                    dislikeBtn.classList.remove("btn-primary");

                    if (type === "like") {
                        likeBtn.classList.add("btn-primary");
                    } else {
                        dislikeBtn.classList.add("btn-primary");
                    }
                }
            })
            .catch(err => alert("Грешка при гласуване: " + err));
    });

    // Скриване на подкоментари по подразбиране, с бутон за показване
    document.querySelectorAll('.replies').forEach(repliesContainer => {
        const repliesList = repliesContainer.querySelector('.replies-list');
        const showRepliesBtn = repliesContainer.querySelector('.show-replies-btn');

        if (repliesList) repliesList.style.display = 'none';
        if (showRepliesBtn) {
            showRepliesBtn.style.display = 'inline-block';
            showRepliesBtn.addEventListener('click', () => {
                repliesList.style.display = 'block';
                showRepliesBtn.style.display = 'none';
            });
        }
    });






    // Изтриване на коментар
    document.addEventListener("click", function (e) {
        const delBtn = e.target.closest(".delete-btn");
        if (!delBtn) return;

        const id = delBtn.dataset.id;
        if (!confirm("Сигурни ли сте, че искате да изтриете този коментар?")) return;

        fetch(`/api/comments/${id}`, {
            method: "DELETE",
            headers: {
                [csrfHeader]: csrfToken
            }
        })
            .then(res => {
                if (!res.ok) return res.json().then(data => Promise.reject(data.error));
                document.getElementById(`comment-${id}`)?.remove();
            })
            .catch(err => alert("Грешка при изтриване: " + err));
    });

// Редактиране на коментар

    let activeEditor = null;
    let activeCommentId = null;

    $(document).on('click', '.edit-btn', function () {
        const commentBox = $(this).closest('.comment-box');
        const commentId = $(this).data('id');
        const originalTextEl = commentBox.find('.comment-text');
        const editContainer = commentBox.find('.edit-container');
        const quillDiv = editContainer.find('.quill-editor');

        // Създай нов Quill само веднъж
        if (!quillDiv.data('quill')) {
            const quill = new Quill(quillDiv[0], {
                theme: 'snow'
            });
            quillDiv.data('quill', quill);
        }

        const quill = quillDiv.data('quill');
        quill.root.innerHTML = originalTextEl.html();

        originalTextEl.addClass('d-none');
        editContainer.removeClass('d-none');

        activeEditor = quill;
        activeCommentId = commentId;
    });

    $(document).on('click', '.cancel-edit-btn', function () {
        const commentBox = $(this).closest('.comment-box');
        commentBox.find('.edit-container').addClass('d-none');
        commentBox.find('.comment-text').removeClass('d-none');
        activeEditor = null;
        activeCommentId = null;
    });

    $(document).on('click', '.save-edit-btn', function () {
        const commentBox = $(this).closest('.comment-box');
        const newText = activeEditor.root.innerHTML;

        $.ajax({
            url: '/api/comments/' + activeCommentId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ text: newText }),
            success: function (res) {
                commentBox.find('.comment-text').html(res.text).removeClass('d-none');
                commentBox.find('.edit-container').addClass('d-none');
            },
            error: function () {
                alert('Грешка при редактиране на коментара');
            }
        });

        activeEditor = null;
        activeCommentId = null;
    });
});
