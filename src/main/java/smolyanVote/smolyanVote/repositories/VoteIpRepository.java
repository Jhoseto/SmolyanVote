package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.VoteIpEntity;

import java.util.List;

@Repository
public interface VoteIpRepository extends JpaRepository<VoteIpEntity, Long> {

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

    /**
     * Проверява дали IP адресът може да гласува (има по-малко от 3 гласа)
     * @param ipAddress IP адресът
     * @param eventId ID на събитието
     * @param eventType Тип на събитието
     * @param maxVotes Максимален брой гласове (3)
     * @return true ако може да гласува, false ако е достигнал лимита
     */
    default boolean canVote(String ipAddress, Long eventId, String eventType, int maxVotes) {
        long voteCount = countByIpAddressAndEventIdAndEventType(ipAddress, eventId, eventType);
        return voteCount < maxVotes;
    }
}

