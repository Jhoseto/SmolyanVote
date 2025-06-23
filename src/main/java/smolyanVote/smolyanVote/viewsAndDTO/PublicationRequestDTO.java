package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;


public class PublicationRequestDTO {

    @NotBlank(message = "Заглавието не може да бъде празно")
    @Size(min = 5, max = 200, message = "Заглавието трябва да бъде между 5 и 200 символа")
    private String title;

    @NotBlank(message = "Съдържанието не може да бъде празно")
    @Size(min = 10, max = 10000, message = "Съдържанието трябва да бъде между 10 и 10000 символа")
    private String content;

    @NotNull(message = "Категорията е задължителна")
    private CategoryEnum category;

    private String imageUrl;

    // ====== CONSTRUCTORS ======

    public PublicationRequestDTO() {
    }

    // ====== GETTERS AND SETTERS ======

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public CategoryEnum getCategory() {
        return category;
    }

    public void setCategory(CategoryEnum category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}