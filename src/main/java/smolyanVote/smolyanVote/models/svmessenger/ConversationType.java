package smolyanVote.smolyanVote.models.svmessenger;

public enum ConversationType {
    /** Two participants, stored in the legacy user1/user2 columns. */
    DIRECT,
    /** Three or more participants, stored in sv_conversation_participants. */
    GROUP
}
