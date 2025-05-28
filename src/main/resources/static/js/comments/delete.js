export function initDelete() {
    const csrfToken = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".delete-btn");
        if (!btn) return;

        const id = btn.dataset.id;
        if (!confirm("Сигурни ли сте, че искате да изтриете този коментар?")) return;

        fetch(`/api/comments/${id}`, {
            method: "DELETE",
            headers: { [csrfHeader]: csrfToken }
        })
            .then(res => res.ok ? document.getElementById(`comment-${id}`)?.remove() : res.json().then(err => Promise.reject(err.error)))
            .catch(err => alert("Грешка при изтриване: " + err));
    });
}
