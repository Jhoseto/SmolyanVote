package smolyanVote.smolyanVote.models.svmessenger;

/**
 * Enum за типове съобщения в SVMessenger
 */
public enum MessageType {
    TEXT,      // Текстово съобщение
    IMAGE,     // Изображение с attachment_url
    FILE,      // Прикачен файл с attachment_url
    AUDIO,     // Гласово съобщение с attachment_url
    POLL,      // Бърза анкета — текстът е въпросът
    EMOJI      // Само emoji съобщение
}
