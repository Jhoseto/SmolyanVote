package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * Write-ack for event/referendum/poll creation — carries just the new id so
 * the frontend can navigate straight to the detail page without a reload.
 */
public record EventCreatedResponse(Long id) {
}
