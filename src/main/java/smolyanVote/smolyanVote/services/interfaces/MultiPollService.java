package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.util.List;

public interface MultiPollService {
    /** @return the id of the newly created poll (used by the JSON API to redirect to the detail page). */
    Long createMultiPoll(CreateMultiPollView view);

    @Transactional
    MultiPollDetailViewDTO getMultiPollDetail(Long id);

    /** Detail payload without incrementing view counter or logging a VIEW activity (admin edit response). */
    @Transactional(readOnly = true)
    MultiPollDetailViewDTO getMultiPollDetailSnapshot(Long id);

    /**
     * Admin inline edit: updates title/description/location/options, removes
     * images whose id is in {@code deleteImageIds}, appends {@code newImages}.
     * @return the id of the updated poll (used by the JSON API to re-fetch the fresh detail).
     */
    Long updateMultiPoll(Long id, CreateMultiPollView dto, List<MultipartFile> newImages, List<Long> deleteImageIds);
}
