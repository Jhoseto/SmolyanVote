package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationParticipantEntity;

/** One member of a group conversation. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVParticipantDTO {

    private SVUserMinimalDTO user;
    private String role;

    public static SVParticipantDTO from(SVConversationParticipantEntity participant) {
        if (participant == null) return null;
        return new SVParticipantDTO(
                SVUserMinimalDTO.Mapper.toDTO(participant.getUser()),
                participant.getRole().name());
    }
}
