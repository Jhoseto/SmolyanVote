package smolyanVote.smolyanVote.services.support;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.VoteIpEntity;
import smolyanVote.smolyanVote.repositories.VoteIpRepository;
import smolyanVote.smolyanVote.utils.ClientIpResolver;

import java.util.List;

/**
 * Enforces max {@value #MAX_VOTES_PER_IP} distinct vote submissions per IP per event.
 * Reserves an IP slot before the vote row is persisted (same transaction as caller).
 */
@Service
public class VoteIpGuardService {

    public static final int MAX_VOTES_PER_IP = 3;

    private static final String MISSING_IP_MESSAGE =
            "Не може да се потвърди IP адресът ви. Моля, опитайте отново или се свържете с нас.";

    private final VoteIpRepository voteIpRepository;
    private final ClientIpResolver clientIpResolver;
    private final boolean allowMissingIp;

    public VoteIpGuardService(
            VoteIpRepository voteIpRepository,
            ClientIpResolver clientIpResolver,
            @Value("${smolyanvote.votes.allow-missing-ip:false}") boolean allowMissingIp) {
        this.voteIpRepository = voteIpRepository;
        this.clientIpResolver = clientIpResolver;
        this.allowMissingIp = allowMissingIp;
    }

    /**
     * Locks existing IP rows for this event, rejects if limit reached, inserts reservation row.
     * Must run in the same transaction as the vote insert.
     */
    @Transactional
    public void reserveIpSlot(String ipAddress, Long eventId, String eventType, Long userId) {
        if (!clientIpResolver.isValid(ipAddress)) {
            if (allowMissingIp) {
                return;
            }
            throw new IllegalStateException(MISSING_IP_MESSAGE);
        }

        String ip = ipAddress.trim();

        List<VoteIpEntity> locked = voteIpRepository.lockByIpAddressAndEventIdAndEventType(ip, eventId, eventType);
        if (locked.size() >= MAX_VOTES_PER_IP) {
            throw new IllegalStateException(
                    "Достигнат е лимитът от " + MAX_VOTES_PER_IP + " гласа от този IP адрес за това събитие.");
        }

        boolean sameUserAlreadyReserved = locked.stream()
                .anyMatch(row -> userId != null && userId.equals(row.getUserId()));
        if (sameUserAlreadyReserved) {
            return;
        }

        VoteIpEntity reservation = new VoteIpEntity(ip, eventId, eventType, userId);
        voteIpRepository.save(reservation);

        if (voteIpRepository.countByIpAddressAndEventIdAndEventType(ip, eventId, eventType) > MAX_VOTES_PER_IP) {
            throw new IllegalStateException(
                    "Достигнат е лимитът от " + MAX_VOTES_PER_IP + " гласа от този IP адрес за това събитие.");
        }
    }
}
