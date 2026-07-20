package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.enums.SubscriptionType;

import java.util.Set;

/** JSON отговор за {@code POST /api/v1/subscriptions} и {@code GET /api/v1/subscriptions}. */
public record SubscriptionResponse(boolean success, Set<SubscriptionType> types) {
}
