package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.PublicationStatus;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
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
    private final PublicationRepository publicationRepository;
    private final SignalsRepository signalsRepository;

    public HomeStatsServiceImpl(UserRepository userRepository,
                                SimpleEventRepository simpleEventRepository,
                                ReferendumRepository referendumRepository,
                                MultiPollRepository multiPollRepository,
                                PublicationRepository publicationRepository,
                                SignalsRepository signalsRepository) {
        this.userRepository = userRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.publicationRepository = publicationRepository;
        this.signalsRepository = signalsRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public HomeStatsResponse getHomeStats() {
        long eventsTotal = simpleEventRepository.count()
                + referendumRepository.count()
                + multiPollRepository.count();

        long publicationsTotal = publicationRepository.countByStatus(PublicationStatus.PUBLISHED)
                + publicationRepository.countByStatus(PublicationStatus.EDITED);

        return new HomeStatsResponse(
                userRepository.count(),
                eventsTotal,
                publicationsTotal,
                signalsRepository.count()
        );
    }
}
