package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Един емоджи ред под мехурчето: емоджито, броят и кой е реагирал.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVReactionSummaryDTO {

    private String emoji;
    private Integer count;
    /** Имена на потребителите за tooltip-а. */
    private List<String> usernames;
    /** Дали текущият потребител е реагирал с това емоджи. */
    private Boolean reactedByMe;
}
