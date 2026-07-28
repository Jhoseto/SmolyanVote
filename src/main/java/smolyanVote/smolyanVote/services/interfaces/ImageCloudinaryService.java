package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.web.multipart.MultipartFile;

public interface ImageCloudinaryService {

    String saveUserImage(MultipartFile file, String username);

    /** Download a trusted OAuth provider avatar and store it in Cloudinary. */
    String saveUserImageFromUrl(String imageUrl, String username);

    /** Store already-downloaded OAuth avatar bytes (required for Facebook CDN URLs). */
    String saveUserImageFromBytes(byte[] imageBytes, String username);

    String saveSingleImage(MultipartFile file, Long eventId);
    String saveSingleSignalImage(MultipartFile file, Long signalId);

    String saveSingleReferendumImage(MultipartFile file, Long eventId);

    String saveMultiPollImage(MultipartFile file, Long pollId);


    void deleteImage(String imageUrl);

    // Нов метод за изтриване на цяла папка по префикс
    void deleteFolder(String folderPath);

    String savePodcastImage(MultipartFile file, Long episodeId);

    /** Uploads a podcast episode's audio track (Cloudinary treats audio as a "video" resource). */
    String savePodcastAudio(MultipartFile file, Long episodeId);

    /**
     * Uploads a chat attachment (image, document or voice note). Images go
     * through moderation; other types are stored as raw resources.
     */
    String saveMessengerAttachment(MultipartFile file, Long conversationId);
}
