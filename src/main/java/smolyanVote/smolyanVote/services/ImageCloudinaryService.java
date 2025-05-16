package smolyanVote.smolyanVote.services;

import org.springframework.web.multipart.MultipartFile;

public interface ImageCloudinaryService {

    String saveUserImage(MultipartFile file, String username);

    String saveSingleImage(MultipartFile file, Long eventId);

    String saveSingleReferendumImage(MultipartFile file, Long eventId);
}
