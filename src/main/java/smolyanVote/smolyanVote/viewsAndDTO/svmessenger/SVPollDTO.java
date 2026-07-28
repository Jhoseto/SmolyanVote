package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Бърза анкета в разговор — въпросът е текстът на съобщението. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVPollDTO {

    private String question;
    private List<Option> options;
    private Integer totalVotes;
    /** Опцията, за която текущият потребител е гласувал, или null. */
    private Long myOptionId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Option {
        private Long id;
        private String text;
        private Integer votes;
    }
}
