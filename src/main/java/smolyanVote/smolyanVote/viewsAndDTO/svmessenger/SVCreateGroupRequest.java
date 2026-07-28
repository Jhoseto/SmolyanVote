package smolyanVote.smolyanVote.viewsAndDTO.svmessenger;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SVCreateGroupRequest {

    @NotBlank(message = "Заглавието е задължително")
    @Size(max = 120, message = "Заглавието може да е най-много 120 символа")
    private String title;

    @NotEmpty(message = "Изберете поне един участник")
    @Size(max = 99, message = "Групата може да има най-много 100 участници")
    private List<Long> memberIds;

    private String imageUrl;
}
