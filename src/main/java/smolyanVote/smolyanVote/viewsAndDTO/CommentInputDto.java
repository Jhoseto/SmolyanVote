package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO за входящи данни при създаване/редактиране на коментари
 */
public class CommentInputDto {

    @NotBlank(message = "Текстът на коментара е задължителен")
    @Size(max = 2000, message = "Коментарът не може да бъде по-дълъг от 2000 символа")
    private String text;

    // Конструктори
    public CommentInputDto() {
    }

    public CommentInputDto(String text) {
        this.text = text;
    }

    // Getters & Setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}