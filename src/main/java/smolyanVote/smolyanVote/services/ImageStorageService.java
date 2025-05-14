package smolyanVote.smolyanVote.services;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ImageStorageService {

    String saveSingleImage(MultipartFile file, Long eventId);

    String saveSingleReferendumImage(MultipartFile file, Long eventId);
}
