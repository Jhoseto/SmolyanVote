package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.web.multipart.MultipartFile;

public interface ImageModerationService {

    boolean isFileSafe(byte[] fileBytes);

    boolean isImageSafe(String imageUrl);

}
