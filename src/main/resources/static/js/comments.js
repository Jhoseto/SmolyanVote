document.addEventListener("DOMContentLoaded", () => {
    const commentForm = document.getElementById("comment-form");
    const eventId = document.getElementById("comments-section")?.dataset.eventId;
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    if (!commentForm || !eventId) return;

    // 🟢 Инициализация на Quill редактор
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Вашият коментар...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['emoji']  // ← бутон за емотикони
            ],
            "emoji-toolbar": true,      // бутона в toolbar
            "emoji-textarea": false,    // няма нужда от отделно поле
            "emoji-shortname": true     // пишеш :smile: и ти го дава
        }
    });


    // 🟢 Основна форма за коментар
    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        // Вземи съдържанието от Quill
        const content = quill.root.innerHTML;
        document.getElementById('comment-hidden').value = content;

        const formData = new FormData(this);

        fetch("/api/comments", {
            method: "POST",
            headers: {
                [csrfHeader]: csrfToken
            },
            body: formData
        })
            .then(res => res.json())
            .then(() => window.location.reload())
            .catch(err => console.error("Error:", err));
    });

    // 🟢 Закачане на логика за бутони и форми за отговор
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

                fetch("/api/comments/reply", {
                    method: "POST",
                    headers: {
                        [csrfHeader]: csrfToken
                    },
                    body: formData
                })
                    .then(res => res.json())
                    .then(data => {
                        const replyHTML = `
                            <div class="border-start ps-3 mb-2 ms-4 mt-2" id="reply-${data.id}">
                                <div class="d-flex align-items-start">
                                    <img src="${data.authorImage}" class="rounded-circle me-2 mt-1" style="width: 30px; height: 30px; object-fit: cover;" alt="">
                                    <div>
                                        <strong>${data.author}</strong>
                                        <p>${data.text}</p>
                                    </div>
                                </div>
                            </div>`;
                        const repliesContainer = document.getElementById(`replies-container-${parentId}`);
                        if (repliesContainer) {
                            repliesContainer.insertAdjacentHTML("beforeend", replyHTML);
                        }
                        this.reset();
                        this.classList.add("d-none");
                    })
                    .catch(err => console.error("Error:", err));
            });
        });
    }

    attachReplyEvents();

    // 🟢 Скриване на подкоментари по подразбиране
    document.querySelectorAll('.replies').forEach(repliesContainer => {
        const repliesList = repliesContainer.querySelector('.replies-list');
        const showRepliesBtn = repliesContainer.querySelector('.show-replies-btn');

        if (repliesList) repliesList.style.display = 'none';
        if (showRepliesBtn) {
            showRepliesBtn.style.display = 'block';
            showRepliesBtn.addEventListener('click', () => {
                repliesList.style.display = 'block';
                showRepliesBtn.style.display = 'none';
            });
        }
    });
});
