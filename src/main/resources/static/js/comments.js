document.addEventListener("DOMContentLoaded", () => {
    const commentForm = document.getElementById("comment-form");
    const commentList = document.getElementById("comment-list");
    const eventId = document.getElementById("comments-section")?.dataset.eventId;
    const currentUser = document.querySelector("input[name='author']")?.value || "";

    if (!commentForm || !commentList || !eventId) return;

    const csrfToken = document.querySelector("meta[name='_csrf']").getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']").getAttribute("content");

    // Основна форма за създаване на коментар
    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch("/api/comments", {
            method: "POST",
            headers: {
                [csrfHeader]: csrfToken
            },
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (!document.getElementById(`comment-${data.id}`)) {
                    const commentHTML = createCommentHTML(data);
                    commentList.insertAdjacentHTML("afterbegin", commentHTML);
                    attachReplyEvents(document.getElementById(`comment-${data.id}`)); // Само новия коментар
                }

                this.reset();
            })
            .catch(err => console.error("Error:", err));
    });

    // Създаване на HTML за коментар
    function createCommentHTML(data) {
        return `
        <div class="mb-3 p-3 bg-light rounded" id="comment-${data.id}">
            <strong>${data.author}</strong>
            <p>${data.text}</p>
            <button class="btn btn-sm btn-outline-secondary reply-btn" data-id="${data.id}">Отговор</button>
            <form class="reply-form mt-2 d-none" id="reply-form-${data.id}">
                <input type="hidden" name="eventId" value="${eventId}" />
                <input type="hidden" name="parentId" value="${data.id}" />
                <input type="hidden" name="author" value="${currentUser}" />
                <div class="mb-2">
                    <textarea name="text" placeholder="Отговор..." class="form-control form-control-sm" rows="2" required></textarea>
                </div>
                <button type="submit" class="btn btn-sm btn-primary">Изпрати</button>
            </form>
            <div class="replies ms-4 mt-3" id="replies-container-${data.id}"></div>
        </div>`;
    }

    // Закачане на логика към бутоните "Отговор" и формите
    function attachReplyEvents(scope = document) {
        scope.querySelectorAll(".reply-btn").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const form = document.getElementById(`reply-form-${id}`);
                if (form) {
                    form.classList.toggle("d-none");
                }
            };
        });

        scope.querySelectorAll(".reply-form").forEach(form => {
            if (form.dataset.bound) return; // Предотвратява повторно закачане
            form.dataset.bound = true;

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
                        <strong>${data.author}</strong>
                        <p>${data.text}</p>
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

    // Закачаме логика към вече съществуващите коментари
    attachReplyEvents();
});
