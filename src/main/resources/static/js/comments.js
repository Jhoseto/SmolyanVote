document.addEventListener("DOMContentLoaded", () => {
    const commentForm = document.getElementById("comment-form");
    const commentList = document.getElementById("comment-list");
    const eventId = document.getElementById("comments-section")?.dataset.eventId;
    const currentUser = document.querySelector("input[name='author']")?.value || "";

    if (!commentForm || !commentList || !eventId) return;

    // Създаване на основен коментар
    commentForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(this);

        // Вземане на CSRF токена и хедъра
        const csrfToken = document.querySelector("meta[name='_csrf']").getAttribute("content");
        const csrfHeader = document.querySelector("meta[name='_csrf_header']").getAttribute("content");

        fetch("/api/comments", {
            method: "POST",
            headers: {
                [csrfHeader]: csrfToken  // Добавяме CSRF токена в заглавките
            },
            body: formData
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                // Проверка дали коментарът вече е добавен, за да предотвратим дублиране
                if (!document.getElementById(`comment-${data.id}`)) {
                    const html = `
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
                    commentList.insertAdjacentHTML("afterbegin", html);
                }

                this.reset();

                // Обновяваме логиката за новите елементи
                attachReplyLogic();
            })
            .catch(err => console.error("Error:", err));
    });

    // Функция за добавяне на логика към всеки бутон "Отговор" и форма
    function attachReplyLogic() {
        // Покажи/скрий формата за отговор
        document.querySelectorAll(".reply-btn").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const form = document.getElementById(`reply-form-${id}`);
                if (form) {
                    form.classList.toggle("d-none");  // Toggle на класа, който показва или скрива формата
                }
            };
        });

        // Изпращане на отговор
        document.querySelectorAll(".reply-form").forEach(form => {
            form.onsubmit = function (e) {
                e.preventDefault();

                const parentId = form.querySelector("input[name='parentId']").value;
                const formData = new FormData(this);

                // Вземане на CSRF токена и хедъра
                const csrfToken = document.querySelector("meta[name='_csrf']").getAttribute("content");
                const csrfHeader = document.querySelector("meta[name='_csrf_header']").getAttribute("content");

                fetch("/api/comments/reply", {
                    method: "POST",
                    headers: {
                        [csrfHeader]: csrfToken  // Добавяме CSRF токена в заглавките
                    },
                    body: formData
                })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return res.json();
                    })
                    .then(data => {
                        const html = `
                        <div class="border-start ps-3 mb-2 ms-4 mt-2">
                            <strong>${data.author}</strong>
                            <p>${data.text}</p>
                        </div>`;

                        // Добавяне на подкоментар в правилния контейнер
                        const repliesContainer = document.getElementById(`replies-container-${parentId}`);
                        if (repliesContainer) {
                            repliesContainer.insertAdjacentHTML("beforeend", html);
                        }

                        // След като отговорът бъде добавен, скриваме формата
                        form.reset();
                        form.classList.add("d-none");
                    })
                    .catch(err => console.error("Error:", err));
            };
        });
    }

    // Първоначално закачаме логиката за вече съществуващите коментари
    attachReplyLogic();
});
