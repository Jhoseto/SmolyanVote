package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO за изпращане на съобщение
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVSendMessageRequest {
    
    @NotNull(message = "Conversation ID е задължително")
    private Long conversationId;
    
    /** Може да е празен, когато съобщението носи прикачен файл. */
    @Size(max = 5000, message = "Съобщението трябва да е до 5000 символа")
    private String text;
    
    private String messageType = "TEXT";
    
    private Long parentMessageId; // For reply functionality

    // Прикачен файл — попълва се след POST /messages/upload
    private String attachmentUrl;
    private String attachmentName;
    private Long attachmentSize;
    private String attachmentMime;
}
