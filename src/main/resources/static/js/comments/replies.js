import { initReactions } from './reactions.js';
import { initEmojiPicker } from './emoji.js';
import { initDelete } from './delete.js';
import { initCommentEditing } from './edit.js';

export function initReplies(scope = document) {
    const csrfToken  = document.querySelector("meta[name='_csrf']")?.getAttribute("content");
    const csrfHeader = document.querySelector("meta[name='_csrf_header']")?.getAttribute("content");

    // За да не се върже два пъти
    if (scope.dataset.repliesInit === "true") return;
    scope.dataset.repliesInit = "true";

    // 1) Отваряне на reply формата
    scope.querySelectorAll(".reply-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const form = document.getElementById(`reply-form-${btn.dataset.id}`);
            if (!form) return;
            form.classList.remove("d-none");
            btn.style.display = "none";
        });
    });

    // 2) Обработка на всяка reply-форма
    scope.querySelectorAll(".reply-form").forEach(form => {
        if (form.dataset.bound === "true") return;
        form.dataset.bound = "true";

        // бутон „×“
        form.querySelector(".close-btn")?.addEventListener("click", () => {
            form.classList.add("d-none");
            const parentId = form.querySelector('input[name="parentId"]').value;
            document.querySelector(`.reply-btn[data-id="${parentId}"]`)?.style.setProperty("display", "inline-block");
        });

        form.addEventListener("submit", function(e) {
            e.preventDefault();
            const formData = new FormData(this);

            fetch("/api/comments/reply", {
                method: "POST",
                headers: { [csrfHeader]: csrfToken },
                body: formData
            })
                .then(r => r.ok ? r.json() : r.json().then(err => Promise.reject(err.error)))
                .then(data => {
                    // изчистваме формата
                    this.reset();
                    this.classList.add("d-none");
                    document.querySelector(`.reply-btn[data-id="${data.parentId}"]`)?.style.setProperty("display", "inline-block");

                    // вмъкваме новия reply
                    const container = document.getElementById(`replies-container-${data.parentId}`);
                    const repliesList = container?.querySelector(".replies-list");
                    if (!repliesList) return;
                    if (getComputedStyle(repliesList).display === "none") {
                        repliesList.style.display = "block";
                    }

                    const safeText = document.createElement("div");
                    safeText.textContent = data.text;

                    const html = `
<div id="reply-${data.id}" class="card p-2 mb-2 reply-box">
  <div class="d-flex">
    <img src="${data.authorImage}" class="rounded-circle me-2 mt-1" style="width:35px;height:35px;">
    <div class="flex-grow-1">
      <div class="d-flex justify-content-between align-items-center">
        <strong>${data.author}</strong>
        <small>${new Date(data.createdAt).toLocaleString('bg-BG',{
                        day:'2-digit', month:'2-digit', year:'numeric',
                        hour:'2-digit', minute:'2-digit'
                    })}</small>
      </div>
      <div class="reply-text mt-1">${safeText.innerHTML}</div>
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
      </div>
    </div>
  </div>
</div>`;

                    repliesList.insertAdjacentHTML("afterbegin", html);

                    // инициализиране на plugin-и върху новия елемент
                    const newElem = document.getElementById(`reply-${data.id}`);
                    initReactions(newElem);
                    initEmojiPicker(newElem);
                    initDelete(newElem);
                    initCommentEditing(newElem);

                    // автоматичен скрол към него
                    newElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    newElem.classList.add('highlight');
                    setTimeout(() => newElem.classList.remove('highlight'), 2000);
                })
                .catch(err => alert("Грешка: " + err));
        });
    });
}
