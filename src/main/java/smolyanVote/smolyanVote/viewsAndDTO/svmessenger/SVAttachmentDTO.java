package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Резултат от POST /api/svmessenger/messages/upload — клиентът го прикача
 * към следващото изпращане на съобщение.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVAttachmentDTO {

    private String url;
    private String name;
    private Long size;
    private String mime;
}
