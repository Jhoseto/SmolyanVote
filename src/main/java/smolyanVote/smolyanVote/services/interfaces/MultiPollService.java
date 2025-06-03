package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

public interface MultiPollService {
    void createMultiPoll(CreateMultiPollView view);

    @Transactional
    MultiPollDetailViewDTO getMultiPollDetail(Long id);
}
