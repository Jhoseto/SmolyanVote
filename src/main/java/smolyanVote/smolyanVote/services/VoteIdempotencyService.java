package smolyanVote.smolyanVote.services;

import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.VoteAckResponse;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory replay cache for {@code Idempotency-Key} on {@code /api/v1/votes/**}
 * (MODERN_FRONTEND_PLAN Фаза 10). Same key within TTL returns the first ack
 * without re-executing the vote. DB UNIQUE constraints remain the race-safety net.
 */
@Service
public class VoteIdempotencyService {

    private static final long TTL_SECONDS = 24 * 60 * 60;

    private record Entry(VoteAckResponse response, Instant expiresAt) {}

    private final Map<String, Entry> cache = new ConcurrentHashMap<>();

    public VoteAckResponse getCached(String key) {
        if (key == null || key.isBlank()) return null;
        purgeExpired();
        Entry entry = cache.get(key.trim());
        if (entry == null) return null;
        if (entry.expiresAt.isBefore(Instant.now())) {
            cache.remove(key.trim());
            return null;
        }
        return entry.response;
    }

    public void put(String key, VoteAckResponse response) {
        if (key == null || key.isBlank() || response == null) return;
        cache.put(key.trim(), new Entry(response, Instant.now().plusSeconds(TTL_SECONDS)));
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        cache.entrySet().removeIf(e -> e.getValue().expiresAt.isBefore(now));
    }
}
