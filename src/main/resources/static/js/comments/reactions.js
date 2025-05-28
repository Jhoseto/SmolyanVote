export function initReactions(scope = document) {
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".like-btn, .dislike-btn");
        if (!btn) return;

        const commentBox = btn.closest(".comment-box, .reply-box");
        if (!commentBox) return;

        const likeBtn = commentBox.querySelector(".like-btn");
        const dislikeBtn = commentBox.querySelector(".dislike-btn");
        const commentId = btn.dataset.id;
        const type = btn.dataset.type;

        likeBtn.disabled = true;
        dislikeBtn.disabled = true;

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
                const likeCount = likeBtn.querySelector("span");
                const dislikeCount = dislikeBtn.querySelector("span");

                animateCountChange(likeCount, data.likes);
                animateCountChange(dislikeCount, data.dislikes);

                [likeBtn, dislikeBtn].forEach(btn => {
                    btn.classList.remove("active-vote");
                    btn.removeAttribute("title");
                });

                if (data.userVote === "LIKE") {
                    likeBtn.classList.add("active-vote");
                    likeBtn.title = "Гласували сте с ДА";
                } else if (data.userVote === "DISLIKE") {
                    dislikeBtn.classList.add("active-vote");
                    dislikeBtn.title = "Гласували сте с НЕ";
                }
            })
            .catch(err => alert("Грешка при гласуване: " + err))
            .finally(() => {
                likeBtn.disabled = false;
                dislikeBtn.disabled = false;
            });
    });

    function animateCountChange(span, newValue) {
        if (parseInt(span.textContent) !== newValue) {
            span.classList.add("count-change");
            span.textContent = newValue;
            setTimeout(() => span.classList.remove("count-change"), 400);
        }
    }
}
