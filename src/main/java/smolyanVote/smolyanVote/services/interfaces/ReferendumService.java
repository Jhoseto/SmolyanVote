package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

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

    ReferendumDetailViewDTO getReferendumDetail(Long referendumId, Long userId);
}

