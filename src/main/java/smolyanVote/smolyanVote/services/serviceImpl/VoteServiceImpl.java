package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.repository.EventRepository;
import smolyanVote.smolyanVote.services.VoteService;


@Service
public class VoteServiceImpl implements VoteService {

    private final EventRepository eventRepository;  // Репозиторията за гласовете

    @Autowired
    public VoteServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }


    @Override
    @Transactional
    public void recordVote(Long eventId, String voteValue) {
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Събитие не е намерено"));

        switch (voteValue.toLowerCase()) {
            case "1":
                event.setYesVotes(event.getYesVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
                break;
            case "2":
                event.setNoVotes(event.getNoVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
                break;
            case "3":
                event.setNeutralVotes(event.getNeutralVotes() + 1);
                event.setTotalVotes(event.getTotalVotes() + 1);
                break;
            default:
                throw new IllegalArgumentException("Невалиден вот: " + voteValue);
        }
        eventRepository.save(event);
    }


}
