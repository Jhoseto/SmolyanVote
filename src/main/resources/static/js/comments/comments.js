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
            .then(() => window.location.reload())
            .catch(err => alert("Грешка: " + err));
    });
}
