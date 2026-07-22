package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** Per-user signal flags for DTO mapping (boost, subscribe, resolved reports). */
public record SignalEnrichment(
        boolean hasBoosted,
        boolean isSubscribed,
        boolean hasReportedResolved,
        int resolvedReportCount,
        Long currentUserId,
        boolean includeAdminNotes
) {
    public static SignalEnrichment guest() {
        return new SignalEnrichment(false, false, false, 0, null, false);
    }
}
