package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.time.Instant;

/**
 * Call History Entity
 * Записва историята на обажданията в разговор
 */
@Entity
@Table(name = "call_history", indexes = {
    @Index(name = "idx_call_history_conversation", columnList = "conversation_id"),
    @Index(name = "idx_call_history_created", columnList = "created"),
    @Index(name = "idx_call_history_caller", columnList = "caller_id"),
    @Index(name = "idx_call_history_receiver", columnList = "receiver_id")
})
public class CallHistoryEntity extends BaseEntity {

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "caller_id", nullable = false)
    private Long callerId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(name = "start_time", nullable = false, columnDefinition = "TIMESTAMP")
    private Instant startTime;

    @Column(name = "end_time", columnDefinition = "TIMESTAMP")
    private Instant endTime;

    @Column(name = "duration_seconds", nullable = true)
    private Long durationSeconds; // Duration in seconds (null if call was rejected/missed)

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private CallStatus status;

    @Column(name = "is_video_call", nullable = false)
    private Boolean isVideoCall = false;

    public enum CallStatus {
        ACCEPTED,   // Call was accepted and completed
        REJECTED,   // Call was rejected by receiver
        MISSED,     // Call was missed (not answered)
        CANCELLED   // Call was cancelled by caller before being answered
    }

    // Constructors
    public CallHistoryEntity() {}

    // Getters and Setters
    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getCallerId() {
        return callerId;
    }

    public void setCallerId(Long callerId) {
        this.callerId = callerId;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public CallStatus getStatus() {
        return status;
    }

    public void setStatus(CallStatus status) {
        this.status = status;
    }

    public Boolean getIsVideoCall() {
        return isVideoCall;
    }

    public void setIsVideoCall(Boolean isVideoCall) {
        this.isVideoCall = isVideoCall;
    }
}
