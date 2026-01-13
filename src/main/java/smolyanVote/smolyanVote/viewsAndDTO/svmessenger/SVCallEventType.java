package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

/**
 * Enum за типовете call events в SVMessenger
 */
public enum SVCallEventType {
    CALL_REQUEST,
    CALL_ACCEPT,
    CALL_REJECT,
    CALL_REJECTED,  // Mobile app version of CALL_REJECT
    CALL_END,
    CALL_ENDED,     // Mobile app version of CALL_END
    CALL_BUSY,
    CALL_CANCEL,
    CALL_MISSED
}
