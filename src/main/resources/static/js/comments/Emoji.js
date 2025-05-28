export function initEmojiPicker() {
    // Избираме всички emoji бутони - главния и reply бутоните
    const emojiButtons = document.querySelectorAll('#emoji-btn, .emoji-reply-btn');

    // Създаваме един общ emoji picker контейнер (ще го създадем динамично, ако го няма)
    let emojiPicker = document.getElementById('emoji-picker');
    if (!emojiPicker) {
        emojiPicker = document.createElement('div');
        emojiPicker.id = 'emoji-picker';
        emojiPicker.classList.add('emoji-picker');
        document.body.appendChild(emojiPicker);
    }

    // Емоджита
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '😢', '🔥', '😎', '🙏', '💡'];

    // Функция за зареждане на емоджита в picker-a
    function loadEmojis() {
        emojiPicker.innerHTML = '';
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.classList.add('emoji');
            span.textContent = emoji;
            emojiPicker.appendChild(span);
        });
    }
    loadEmojis();

    let currentTextarea = null;

    // Функция за позициониране на emojiPicker под бутона
    function positionPicker(button) {
        const rect = button.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        emojiPicker.style.top = (rect.bottom + scrollTop + 5) + 'px';
        emojiPicker.style.left = (rect.left + scrollLeft) + 'px';
    }

    // При клик на emoji бутон:
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Ако emojiPicker вече е видим и за същия бутон - скриваме го
            if (emojiPicker.style.display === 'block' && currentTextarea === getTextareaForButton(btn)) {
                emojiPicker.style.display = 'none';
                currentTextarea = null;
                return;
            }

            currentTextarea = getTextareaForButton(btn);
            positionPicker(btn);
            emojiPicker.style.display = 'block';
        });
    });

    // Функция за взимане на правилния textarea спрямо бутона
    function getTextareaForButton(button) {
        if (button.id === 'emoji-btn') {
            return document.getElementById('main-editor');
        } else {
            // При reply бутоните - намирам textarea от същия reply form
            const replyForm = button.closest('form.reply-form');
            if (replyForm) {
                return replyForm.querySelector('textarea[name="text"]');
            }
        }
        return null;
    }

    // При избор на емоджи в picker-а
    emojiPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('emoji') && currentTextarea) {
            currentTextarea.value += e.target.textContent;
            currentTextarea.focus();
            emojiPicker.style.display = 'none';
            currentTextarea = null;
        }
    });

    // Клик извън emoji picker и бутоните го затваря
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && ![...emojiButtons].some(btn => btn.contains(e.target))) {
            emojiPicker.style.display = 'none';
            currentTextarea = null;
        }
    });

    // За по-добра мобилна поддръжка и ако прозореца се скролва - скрива emoji picker
    window.addEventListener('scroll', () => {
        emojiPicker.style.display = 'none';
        currentTextarea = null;
    });
}
