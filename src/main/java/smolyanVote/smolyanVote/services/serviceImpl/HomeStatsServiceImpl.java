package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.HomeStatsService;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.HomeStatsResponse;

@Service
public class HomeStatsServiceImpl implements HomeStatsService {

    private final UserRepository userRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;

    public HomeStatsServiceImpl(UserRepository userRepository,
                                SimpleEventRepository simpleEventRepository,
                                ReferendumRepository referendumRepository,
                                MultiPollRepository multiPollRepository) {
        this.userRepository = userRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public HomeStatsResponse getHomeStats() {
        return new HomeStatsResponse(
                userRepository.count(),
                simpleEventRepository.count(),
                referendumRepository.count(),
                multiPollRepository.count()
        );
    }
}
