package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class SVCreatePollRequest {

    @NotNull
    private Long conversationId;

    @NotBlank
    @Size(max = 300)
    private String question;

    @Size(min = 2, max = 4, message = "Анкетата трябва да има между 2 и 4 опции")
    private List<String> options;
}
