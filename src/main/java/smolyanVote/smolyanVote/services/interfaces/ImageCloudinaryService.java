package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.web.multipart.MultipartFile;

public interface ImageCloudinaryService {

    String saveUserImage(MultipartFile file, String username);

    String saveSingleImage(MultipartFile file, Long eventId);

    String saveSingleReferendumImage(MultipartFile file, Long eventId);

    String saveMultiPollImage(MultipartFile file, Long pollId);

    void deleteImage(String imageUrl);

    // Нов метод за изтриване на цяла папка по префикс
    void deleteFolder(String folderPath);
}
