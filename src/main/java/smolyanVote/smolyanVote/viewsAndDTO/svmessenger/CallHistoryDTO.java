package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.svmessenger.CallHistoryEntity;

import java.time.Instant;

/**
 * DTO за call history запис
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallHistoryDTO {

    private Long id;
    private Long conversationId;
    private Long callerId;
    private String callerName;
    private String callerImageUrl;
    private Long receiverId;
    private String receiverName;
    private String receiverImageUrl;
    private Instant startTime;
    private Instant endTime;
    private Long durationSeconds; // Duration in seconds (null if call was rejected/missed)
    private String status; // ACCEPTED, REJECTED, MISSED, CANCELLED
    private Boolean isVideoCall;

    /**
     * Mapper за конвертиране CallHistoryEntity -> CallHistoryDTO
     */
    public static class Mapper {

        public static CallHistoryDTO toDTO(CallHistoryEntity callHistory, 
                                          String callerName, String callerImageUrl,
                                          String receiverName, String receiverImageUrl) {
            if (callHistory == null) {
                return null;
            }

            CallHistoryDTO dto = new CallHistoryDTO();
            dto.setId(callHistory.getId());
            dto.setConversationId(callHistory.getConversationId());
            dto.setCallerId(callHistory.getCallerId());
            dto.setCallerName(callerName);
            dto.setCallerImageUrl(callerImageUrl);
            dto.setReceiverId(callHistory.getReceiverId());
            dto.setReceiverName(receiverName);
            dto.setReceiverImageUrl(receiverImageUrl);
            dto.setStartTime(callHistory.getStartTime());
            dto.setEndTime(callHistory.getEndTime());
            dto.setDurationSeconds(callHistory.getDurationSeconds());
            dto.setStatus(callHistory.getStatus().name());
            dto.setIsVideoCall(callHistory.getIsVideoCall());

            return dto;
        }
    }
}
