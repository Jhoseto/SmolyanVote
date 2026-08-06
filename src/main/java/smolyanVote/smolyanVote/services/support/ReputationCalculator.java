package smolyanVote.smolyanVote.services.support;

import smolyanVote.smolyanVote.models.UserEntity;

/**
 * Canonical reputation formula for JWT profile API and legacy UI.
 * Point weights and tier thresholds are mirrored in
 * {@code frontend/src/shared/lib/gamification.ts}.
 */
public final class ReputationCalculator {

    /** Points per created event / referendum / poll. */
    private static final int POINTS_PER_EVENT = 15;
    /** Points per vote cast on any event type. */
    private static final int POINTS_PER_VOTE = 1;
    /** Points per published article. */
    private static final int POINTS_PER_PUBLICATION = 5;
    /** Points per civic signal submitted. */
    private static final int POINTS_PER_SIGNAL = 5;
    /** Points per comment posted. */
    private static final int POINTS_PER_COMMENT = 1;

    private ReputationCalculator() {
    }

    public static int score(UserEntity user) {
        int score = 0;
        score += user.getUserEventsCount() * POINTS_PER_EVENT;
        score += user.getTotalVotes() * POINTS_PER_VOTE;
        score += user.getPublicationsCount() * POINTS_PER_PUBLICATION;
        score += user.getSignalsCount() * POINTS_PER_SIGNAL;
        score += user.getCommentsCount() * POINTS_PER_COMMENT;
        return Math.max(0, score);
    }

    /**
     * {@code Участник} requires at least one event, vote, publication and signal.
     * Until then the user stays {@code Наблюдаващ} regardless of points.
     */
    public static boolean hasParticipantQualification(UserEntity user) {
        return user.getUserEventsCount() >= 1
                && user.getTotalVotes() >= 1
                && user.getPublicationsCount() >= 1
                && user.getSignalsCount() >= 1;
    }

    public static String badge(UserEntity user) {
        if (!hasParticipantQualification(user)) {
            return "Наблюдаващ";
        }
        int score = score(user);
        if (score >= 10_000) return "VIP Потребител";
        if (score >= 4_000) return "Легенда";
        if (score >= 2_000) return "Експерт";
        if (score >= 400) return "Ангажиран";
        if (score >= 100) return "Активен";
        return "Участник";
    }
}
