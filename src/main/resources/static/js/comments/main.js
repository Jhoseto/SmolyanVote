import { initComments } from './comments.js';
import { initReplies } from './replies.js';
import { initReactions } from './reactions.js';
import { initDelete } from './delete.js';
import { initCommentEditing } from './edit.js';
import { initEmojiPicker } from './emoji.js';
import { toggleReplies } from "./toggleReplies.js";

document.addEventListener('DOMContentLoaded', () => {
    initComments();
    initReactions();
    initDelete();
    initCommentEditing();
    initEmojiPicker();
    toggleReplies();
    initReplies();
});
