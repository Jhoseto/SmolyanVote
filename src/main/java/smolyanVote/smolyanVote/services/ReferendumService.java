package smolyanVote.smolyanVote.services;

import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailDTO;

import java.util.List;
import java.util.Optional;

public interface ReferendumService {
    void createReferendum(String topic,
                          String description,
                          Locations location,
                          List<String> options,
                          List<MultipartFile> image1,
                          UserEntity user);

    Optional<ReferendumEntity> findById(Long id);

    ReferendumDetailDTO getReferendumDetail(Long referendumId, String username);
}

