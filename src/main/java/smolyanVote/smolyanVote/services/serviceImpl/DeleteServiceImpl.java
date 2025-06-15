package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.DeleteService;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;

import java.util.List;

@Service
public class DeleteServiceImpl implements DeleteService {

    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final VoteSimpleEventRepository voteSimpleEventRepository;
    private final VoteReferendumRepository voteReferendumRepository;
    private final SimpleEventImageRepository simpleEventImageRepository;
    private final ReferendumImageRepository referendumImageRepository;
    private final CommentsRepository commentsRepository;
    private final ImageCloudinaryService imageCloudinaryService;
    private final MultiPollRepository multiPollRepository;
    private final VoteMultiPollRepository voteMultiPollRepository;
    private final MultiPollImageRepository multiPollImageRepository;

    @Autowired
    public DeleteServiceImpl(SimpleEventRepository simpleEventRepository,
                             ReferendumRepository referendumRepository,
                             VoteSimpleEventRepository voteSimpleEventRepository,
                             VoteReferendumRepository voteReferendumRepository,
                             SimpleEventImageRepository simpleEventImageRepository,
                             ReferendumImageRepository referendumImageRepository,
                             CommentsRepository commentsRepository,
                             ImageCloudinaryService imageCloudinaryService, MultiPollRepository multiPollRepository, VoteMultiPollRepository voteMultiPollRepository, MultiPollImageRepository multiPollImageRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.voteSimpleEventRepository = voteSimpleEventRepository;
        this.voteReferendumRepository = voteReferendumRepository;
        this.simpleEventImageRepository = simpleEventImageRepository;
        this.referendumImageRepository = referendumImageRepository;
        this.commentsRepository = commentsRepository;
        this.imageCloudinaryService = imageCloudinaryService;
        this.multiPollRepository = multiPollRepository;
        this.voteMultiPollRepository = voteMultiPollRepository;
        this.multiPollImageRepository = multiPollImageRepository;
    }

    public EventType getEventTypeById(Long id) {
        if (simpleEventRepository.existsById(id)) {
            return EventType.SIMPLEEVENT;
        } else if (referendumRepository.existsById(id)) {
            return EventType.REFERENDUM;
        } else if (multiPollRepository.existsById(id)) {
            return EventType.MULTI_POLL;

        }
        throw new EntityNotFoundException("Събитието с ID " + id + " не съществува.");
    }

    @Transactional
    @Override
    public void deleteEvent(Long eventId) {
        EventType type = getEventTypeById(eventId);

        switch (type) {
            case SIMPLEEVENT:
                // Изтриване на гласове и коментари
                voteSimpleEventRepository.deleteAllByEventId(eventId);
                commentsRepository.deleteAllByEvent_Id(eventId);

                // Изтриване на записите за снимки от базата
                List<SimpleEventImageEntity> simpleImages = simpleEventImageRepository.findByEventId(eventId);
                simpleEventImageRepository.deleteAll(simpleImages);

                // Изтриване на цялата папка със снимки от Cloudinary
                String folderPathEvents = "smolyanVote/events/event_" + eventId;
                imageCloudinaryService.deleteFolder(folderPathEvents);

                // Изтриване на самото събитие
                simpleEventRepository.deleteById(eventId);
                break;

            case REFERENDUM:
                // Изтриване на папката със снимки от Cloudinary
                String folderPathReferendums = "smolyanVote/referendums/referendum_" + eventId;
                imageCloudinaryService.deleteFolder(folderPathReferendums);

                // Изтриване на гласове и коментари
                voteReferendumRepository.deleteAllByReferendumId(eventId);
                commentsRepository.deleteAllByReferendum_Id(eventId);

                // Изтриване на снимките от базата
                List<ReferendumImageEntity> referendumImages = referendumImageRepository.findByReferendumId(eventId);
                referendumImageRepository.deleteAll(referendumImages);

                // Изтриване на референдума
                referendumRepository.deleteById(eventId);
                break;

            case MULTI_POLL:
                String folderPathMultiPoll = "smolyanVote/multipolls/poll_" + eventId;
                imageCloudinaryService.deleteFolder(folderPathMultiPoll);

                voteMultiPollRepository.deleteAllByMultiPollId(eventId);
                commentsRepository.deleteAllByMultiPoll_Id(eventId);

                List<MultiPollImageEntity> multiPollImages = multiPollImageRepository.findByMultiPoll_Id(eventId);
                multiPollImageRepository.deleteAll(multiPollImages);

                multiPollRepository.deleteById(eventId);
                break;
            default:
                throw new UnsupportedOperationException("Тип на събитието не е поддържан за изтриване: " + type);
        }
    }
}
