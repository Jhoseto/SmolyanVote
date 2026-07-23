package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.web.multipart.MultipartFile;

public interface ImageCloudinaryService {

    String saveUserImage(MultipartFile file, String username);

    /** Download a trusted OAuth provider avatar and store it in Cloudinary. */
    String saveUserImageFromUrl(String imageUrl, String username);

    String saveSingleImage(MultipartFile file, Long eventId);
    String saveSingleSignalImage(MultipartFile file, Long signalId);

    String saveSingleReferendumImage(MultipartFile file, Long eventId);

    String saveMultiPollImage(MultipartFile file, Long pollId);


    void deleteImage(String imageUrl);

    // Нов метод за изтриване на цяла папка по префикс
    void deleteFolder(String folderPath);

    String savePodcastImage(MultipartFile file, Long episodeId);
}
