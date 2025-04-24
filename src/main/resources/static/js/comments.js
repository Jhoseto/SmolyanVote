document.addEventListener("DOMContentLoaded", () => {
    const commentForm = document.getElementById("comment-form");
    const eventId = document.getElementById("comments-section")?.dataset.eventId;

    if (!commentForm || !eventId) return;

    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    // 🟢 Основна форма за коментар
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
            .then(() => window.location.reload())
            .catch(err => console.error("Error:", err));
    });

    // 🟢 Закачане на логика за бутони и форми
    function attachReplyEvents(scope = document) {
        // ✅ Бутони "Отговор"
        scope.querySelectorAll(".reply-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const form = document.getElementById(`reply-form-${id}`);
                if (form) {
                    form.classList.toggle("d-none");
                }
            });
        });

        // ✅ Форми за отговор
        scope.querySelectorAll(".reply-form").forEach(form => {
            // 👉 Фикс: използваме custom атрибут, не dataset.bound
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

    // 🟢 Стартиране на attach logic
    attachReplyEvents();
});
