package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteEntity;
import smolyanVote.smolyanVote.repository.EventRepository;
import smolyanVote.smolyanVote.repository.UserRepository;
import smolyanVote.smolyanVote.repository.VoteRepository;
import smolyanVote.smolyanVote.services.VoteService;


@Service
public class VoteServiceImpl implements VoteService {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;

    @Autowired
    public VoteServiceImpl(EventRepository eventRepository,
                           UserRepository userRepository,
                           VoteRepository voteRepository) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.voteRepository = voteRepository;
    }


    @Transactional
    @Override
    public void recordVote(Long eventId, String voteValue, String userEmail) {
        EventEntity event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Събитие не е намерено"));
        UserEntity user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));


        // Проверка дали вече е гласувал
        if (voteRepository.existsByUserAndEvent(user, event)) {
            throw new IllegalStateException("Потребителят вече е гласувал за това събитие.");
        }


        VoteEntity vote = new VoteEntity();
        vote.setUser(user);
        vote.setEvent(event);
        vote.setVoteValue(voteValue);
        voteRepository.save(vote);


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



        user.setTotalVotes(user.getTotalVotes() + 1);
        userRepository.save(user);
    }
}
