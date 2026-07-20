package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.List;

/**
 * Full events catalog for the Next.js hub (GET /api/v1/events).
 * Filtering, sorting and pagination are owned by the frontend.
 * {@code followingUsernames} / {@code votedKeys} are empty for anonymous callers.
 * Voted keys use {@code EVENT_TYPE:id} (e.g. {@code SIMPLEEVENT:12}).
 */
public record EventsCatalogResponse(
        List<EventSimpleViewDTO> events,
        List<String> followingUsernames,
        List<String> votedKeys
) {
}
