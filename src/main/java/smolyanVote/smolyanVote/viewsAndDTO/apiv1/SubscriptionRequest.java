package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.enums.SubscriptionType;

import java.util.Set;

/**
 * JSON заявка за {@code POST /api/v1/subscriptions} — footer newsletter.
 * Празен {@code types} = пълно отписване (v1 паритет с {@code /subscription/update}).
 */
public record SubscriptionRequest(Set<SubscriptionType> types) {
}
