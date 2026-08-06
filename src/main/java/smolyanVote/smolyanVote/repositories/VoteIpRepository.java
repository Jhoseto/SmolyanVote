package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.VoteIpEntity;

import jakarta.persistence.LockModeType;
import java.util.List;

@Repository
public interface VoteIpRepository extends JpaRepository<VoteIpEntity, Long> {

    @Modifying
    @Query("DELETE FROM VoteIpEntity v WHERE v.eventId = :eventId AND v.eventType = :eventType")
    void deleteByEventIdAndEventType(@Param("eventId") Long eventId, @Param("eventType") String eventType);

    /**
     * Брои колко пъти един IP адрес е гласувал за дадено събитие
     * @param ipAddress IP адресът
     * @param eventId ID на събитието
     * @param eventType Тип на събитието ("SIMPLE_EVENT", "REFERENDUM", "MULTI_POLL")
     * @return Брой гласове от този IP за това събитие
     */
    @Query("SELECT COUNT(v) FROM VoteIpEntity v WHERE v.ipAddress = :ipAddress AND v.eventId = :eventId AND v.eventType = :eventType")
    long countByIpAddressAndEventIdAndEventType(
            @Param("ipAddress") String ipAddress,
            @Param("eventId") Long eventId,
            @Param("eventType") String eventType
    );

    /**
     * Намира всички гласове от един IP за дадено събитие
     * @param ipAddress IP адресът
     * @param eventId ID на събитието
     * @param eventType Тип на събитието
     * @return Списък с гласовете
     */
    List<VoteIpEntity> findByIpAddressAndEventIdAndEventType(
            String ipAddress,
            Long eventId,
            String eventType
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VoteIpEntity v WHERE v.ipAddress = :ipAddress AND v.eventId = :eventId AND v.eventType = :eventType")
    List<VoteIpEntity> lockByIpAddressAndEventIdAndEventType(
            @Param("ipAddress") String ipAddress,
            @Param("eventId") Long eventId,
            @Param("eventType") String eventType
    );

    /**
     * @return true if fewer than {@code maxVotes} rows exist for this IP/event
     */
    default boolean canVote(String ipAddress, Long eventId, String eventType, int maxVotes) {
        long voteCount = countByIpAddressAndEventIdAndEventType(ipAddress, eventId, eventType);
        return voteCount < maxVotes;
    }
}

