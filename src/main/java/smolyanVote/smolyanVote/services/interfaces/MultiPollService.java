package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.util.List;

public interface MultiPollService {
    /** @return the id of the newly created poll (used by the JSON API to redirect to the detail page). */
    Long createMultiPoll(CreateMultiPollView view);

    @Transactional
    MultiPollDetailViewDTO getMultiPollDetail(Long id);

    /**
     * Admin inline edit: updates title/description/location/options, removes
     * images whose id is in {@code deleteImageIds}, appends new images from {@code dto}.
     * @return the id of the updated poll (used by the JSON API to re-fetch the fresh detail).
     */
    Long updateMultiPoll(Long id, CreateMultiPollView dto, List<Long> deleteImageIds);
}
