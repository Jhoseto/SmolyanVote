package smolyanVote.smolyanVote.services.support;

import smolyanVote.smolyanVote.models.UserEntity;

/**
 * Extracted from {@code UserController}'s private helpers (same formula,
 * behavior-preserving) — reused by {@code UsersController} so the JWT
 * profile API and the legacy Thymeleaf profile stay in sync, per one
 * canonical calculation.
 */
public final class ReputationCalculator {

    private ReputationCalculator() {
    }

    public static int score(UserEntity user) {
        int score = 0;
        score += user.getUserEventsCount() * 10;
        score += user.getTotalVotes() * 2;
        score += user.getPublicationsCount() * 5;
        score += user.getSignalsCount() * 8;
        return Math.max(0, score);
    }

    public static String badge(int score) {
        if (score >= 1000) return "VIP Потребител";
        if (score >= 500) return "Експерт";
        if (score >= 200) return "Активен";
        if (score >= 50) return "Участник";
        return "Нов потребител";
    }
}
