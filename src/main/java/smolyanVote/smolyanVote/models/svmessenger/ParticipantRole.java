package smolyanVote.smolyanVote.models.svmessenger;

public enum ParticipantRole {
    /** Created the group; cannot be removed or demoted. */
    OWNER,
    /** Can rename the group and add or remove members. */
    ADMIN,
    /** Can read and write only. */
    MEMBER
}
