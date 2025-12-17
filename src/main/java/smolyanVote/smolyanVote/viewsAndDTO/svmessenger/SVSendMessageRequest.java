package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.NotBlank;
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
    
    @NotBlank(message = "Съобщението не може да е празно")
    @Size(min = 1, max = 5000, message = "Съобщението трябва да е между 1 и 5000 символа")
    private String text;
    
    private String messageType = "TEXT";
    
    private Long parentMessageId; // For reply functionality
}
