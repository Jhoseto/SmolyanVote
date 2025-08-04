package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.DeleteEventsService;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.util.List;

@Service
public class DeleteEventsServiceImpl implements DeleteEventsService {

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
    private final SimpleEventServiceImpl simpleEventService;
    private final ReferendumServiceImpl referendumService;
    private final MultiPollServiceImpl multiPollService;
    private final ActivityLogService activityLogService;
    private final smolyanVote.smolyanVote.scheduling.UserScheduler userScheduler;
    private final UserService userService;

    @Autowired
    public DeleteEventsServiceImpl(SimpleEventRepository simpleEventRepository,
                                   ReferendumRepository referendumRepository,
                                   VoteSimpleEventRepository voteSimpleEventRepository,
                                   VoteReferendumRepository voteReferendumRepository,
                                   SimpleEventImageRepository simpleEventImageRepository,
                                   ReferendumImageRepository referendumImageRepository,
                                   CommentsRepository commentsRepository,
                                   ImageCloudinaryService imageCloudinaryService,
                                   MultiPollRepository multiPollRepository,
                                   VoteMultiPollRepository voteMultiPollRepository,
                                   MultiPollImageRepository multiPollImageRepository,
                                   SimpleEventServiceImpl simpleEventService,
                                   ReferendumServiceImpl referendumService,
                                   MultiPollServiceImpl multiPollService,
                                   ActivityLogService activityLogService, smolyanVote.smolyanVote.scheduling.UserScheduler userScheduler, UserService userService) {
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
        this.simpleEventService = simpleEventService;
        this.referendumService = referendumService;
        this.multiPollService = multiPollService;
        this.activityLogService = activityLogService;
        this.userScheduler = userScheduler;
        this.userService = userService;
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
    //@LogActivity - manual Log try/catch logic

    public void deleteEvent(Long eventId) {
        EventType type = getEventTypeById(eventId);

        // Извличаме данните ПРЕДИ изтриване за логването
        String eventTitle = "";
        String creatorName = "";
        ActivityActionEnum actionEnum = null;

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
        // Activity logging for admin log panel СЛЕД успешното изтриване
        try {
            String details = String.format("Deleted %s: \"%s\" (Creator: %s)",
                    type.name().toLowerCase().replace("_", " "),
                    eventTitle.length() > 100 ? eventTitle.substring(0, 100) + "..." : eventTitle,
                    creatorName);

            // Използваме правилното entityType според типа събитие
            String entityType = type.name(); // "SIMPLEEVENT", "REFERENDUM", "MULTI_POLL"

            activityLogService.logActivity(actionEnum, userService.getCurrentUser(), entityType, eventId, details, null, null);
        } catch (Exception e) {
            System.err.println("Failed to log event deletion: " + e.getMessage());
        }
    }


    @Override
    public boolean canUserDeleteEvent(Long eventId, UserEntity user) {
        if (user == null) {
            return false;
        }

        // Админите могат да изтриват всичко
        if (user.getRole().equals(UserRole.ADMIN)) {
            return true;
        }

        try {
            EventType eventType = getEventTypeById(eventId);

            switch (eventType) {
                case SIMPLEEVENT:
                    SimpleEventDetailViewDTO event = simpleEventService.getSimpleEventDetails(eventId);
                    return event.getCreator() != null &&
                            user.getUsername().equals(event.getCreator().getUsername());

                case REFERENDUM:
                    ReferendumDetailViewDTO referendum = referendumService.getReferendumDetail(eventId);
                    return referendum.getCreator() != null &&
                            user.getUsername().equals(referendum.getCreator().getUsername());

                case MULTI_POLL:
                    MultiPollDetailViewDTO multiPoll = multiPollService.getMultiPollDetail(eventId);
                    return multiPoll.getCreator() != null &&
                            user.getUsername().equals(multiPoll.getCreator().getUsername());

                default:
                    return false;
            }
        } catch (Exception e) {
            return false;
        }
    }
}
