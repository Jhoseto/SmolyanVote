package solyanVote.solyanVote;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.SmolyanVoteApplication;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.EventRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.VoteRepository;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = SmolyanVoteApplication.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class ConcurrentVotingTest {

    @Autowired
    private VoteRepository voteRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    private EventEntity event;

    @BeforeAll
    void setup() {
        // Създаване на събитие
        event = new EventEntity();
        event.setTitle("Тестово събитие");
        event.setDescription("Описание");
        event.setLocation(Locations.SMOLYAN);
        event.setCreatedAt(Instant.now());
        event.setCreatorName("Система");
        event.setYesVotes(0);
        event.setNoVotes(0);
        event.setNeutralVotes(0);
        event.setTotalVotes(0);
        event = eventRepository.save(event);

        // Създаване на 100 потребителя
        for (int i = 0; i < 100; i++) {
            UserEntity user = new UserEntity()
                    .setUsername("user" + i)
                    .setEmail("user" + i + "@mail.com")
                    .setPassword("pass")
                    .setActive(true);
            userRepository.save(user);
        }
    }

    @Test
    void testConcurrentVoting() throws InterruptedException {
        ExecutorService executor = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(100);
        List<UserEntity> users = userRepository.findAll();

        for (UserEntity user : users) {
            executor.submit(() -> {
                try {
                    castVote(user, event, "1");
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        EventEntity updatedEvent = eventRepository.findById(event.getId()).orElseThrow();
        List<VoteEntity> votes = voteRepository.findAllByEventId(event.getId());

        assertEquals(100, votes.size(), "Трябва да има 100 гласа");
        assertEquals(100, updatedEvent.getYesVotes(), "Трябва да има 100 гласа ЗА");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void castVote(UserEntity user, EventEntity event, String voteValue) {
        if (voteRepository.existsByUserIdAndEventId(user.getId(), event.getId())) return;

        VoteEntity vote = new VoteEntity();
        vote.setUser(user);
        vote.setEvent(event);
        vote.setVoteValue(voteValue);
        vote.setVotedAt(Instant.now());

        voteRepository.save(vote);

        // Инкрементиране на броячите в синхронизиран блок
        synchronized (event.getId().toString().intern()) {
            switch (voteValue) {
                case "1" -> event.setYesVotes(event.getYesVotes() + 1);
                case "2" -> event.setNoVotes(event.getNoVotes() + 1);
                case "3" -> event.setNeutralVotes(event.getNeutralVotes() + 1);
            }
            event.setTotalVotes(event.getTotalVotes() + 1);
            eventRepository.save(event);
        }
    }
}
