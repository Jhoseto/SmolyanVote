package smolyanVote.smolyanVote.utils;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Per-user rate limit for signal priority boosts — 10 toggles per minute. */
@Component
public class SignalBoostRateLimiter {

    private static final int MAX_BOOSTS_PER_MINUTE = 10;

    private final Map<Long, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(Long userId) {
        if (userId == null) {
            return false;
        }
        return buckets.computeIfAbsent(userId, id -> createBucket()).tryConsume(1);
    }

    private Bucket createBucket() {
        Bandwidth limit = Bandwidth.classic(MAX_BOOSTS_PER_MINUTE,
                Refill.intervally(MAX_BOOSTS_PER_MINUTE, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }
}
