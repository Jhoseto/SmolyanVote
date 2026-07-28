package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVUpdateGroupRequest {

    @Size(max = 120, message = "Заглавието може да е най-много 120 символа")
    private String title;

    private String imageUrl;
}
