package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

import java.util.List;
import java.util.Optional;

public interface ReferendumService {
    /** @return the id of the newly created referendum (used by the JSON API to redirect to the detail page). */
    Long createReferendum(String topic,
                          String description,
                          Locations location,
                          List<String> options,
                          List<MultipartFile> image1,
                          UserEntity user);

    Optional<ReferendumEntity> findById(Long id);


    @Transactional
    ReferendumDetailViewDTO getReferendumDetail(Long referendumId);

    /**
     * Admin inline edit: updates topic/description/location/options, removes
     * images whose id is in {@code deleteImageIds}, appends {@code newImages}.
     * @return the id of the updated referendum (used by the JSON API to re-fetch the fresh detail).
     */
    Long updateReferendum(Long id, String topic, String description, Locations location,
                          List<String> options, List<MultipartFile> newImages, List<Long> deleteImageIds);
}

