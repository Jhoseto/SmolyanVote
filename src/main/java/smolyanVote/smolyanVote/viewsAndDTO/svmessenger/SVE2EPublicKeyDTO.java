package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVE2EPublicKeyDTO {
    private Long userId;
    private String publicJwk;
}
