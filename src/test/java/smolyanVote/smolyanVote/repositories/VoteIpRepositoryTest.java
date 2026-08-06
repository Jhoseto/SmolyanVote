package smolyanVote.smolyanVote.repositories;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import smolyanVote.smolyanVote.models.VoteIpEntity;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:voteiptest;MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.open-in-view=false"
})
class VoteIpRepositoryTest {

    private static final String IP = "203.0.113.55";
    private static final Long EVENT_ID = 100L;
    private static final String EVENT_TYPE = "SIMPLE_EVENT";

    @Autowired
    private VoteIpRepository voteIpRepository;

    @Test
    void countAndLock_respectPerIpEventLimit() {
        voteIpRepository.save(new VoteIpEntity(IP, EVENT_ID, EVENT_TYPE, 1L));
        voteIpRepository.save(new VoteIpEntity(IP, EVENT_ID, EVENT_TYPE, 2L));
        voteIpRepository.save(new VoteIpEntity(IP, EVENT_ID, EVENT_TYPE, 3L));

        assertEquals(3, voteIpRepository.countByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE));
        assertFalse(voteIpRepository.canVote(IP, EVENT_ID, EVENT_TYPE, 3));
        assertEquals(3, voteIpRepository.lockByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE).size());
    }

    @Test
    void differentEventsDoNotShareLimit() {
        voteIpRepository.save(new VoteIpEntity(IP, EVENT_ID, EVENT_TYPE, 1L));
        voteIpRepository.save(new VoteIpEntity(IP, EVENT_ID + 1, EVENT_TYPE, 1L));

        assertEquals(1, voteIpRepository.countByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE));
        assertEquals(1, voteIpRepository.countByIpAddressAndEventIdAndEventType(IP, EVENT_ID + 1, EVENT_TYPE));
    }

    @Test
    void deleteByEventIdAndEventType_removesRows() {
        voteIpRepository.save(new VoteIpEntity(IP, EVENT_ID, EVENT_TYPE, 1L));
        voteIpRepository.deleteByEventIdAndEventType(EVENT_ID, EVENT_TYPE);

        assertEquals(0, voteIpRepository.countByIpAddressAndEventIdAndEventType(IP, EVENT_ID, EVENT_TYPE));
    }
}
