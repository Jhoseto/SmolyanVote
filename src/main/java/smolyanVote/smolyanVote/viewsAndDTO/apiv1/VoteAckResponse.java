package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * Minimal write-ack for vote mutations — the frontend refetches the detail
 * endpoint afterwards for authoritative counts (plan: "Live results via
 * read path only").
 */
public record VoteAckResponse(boolean success, String message) {

    public static VoteAckResponse ok(String message) {
        return new VoteAckResponse(true, message);
    }
}
