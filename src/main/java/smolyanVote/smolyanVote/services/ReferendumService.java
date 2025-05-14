package smolyanVote.smolyanVote.services;

import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;

import java.util.List;

public interface ReferendumService {
    void createReferendum(String topic,
                          String description,
                          Locations location,
                          List<String> options,
                          List<MultipartFile> image1,
                          UserEntity user);
}
