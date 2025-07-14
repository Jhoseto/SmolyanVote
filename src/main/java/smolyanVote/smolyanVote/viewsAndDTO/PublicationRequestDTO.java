package smolyanVote.smolyanVote.viewsAndDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;

public class PublicationRequestDTO {

    @NotBlank(message = "Заглавието не може да бъде празно")
    @Size(min = 1, max = 200, message = "Заглавието трябва да бъде между 1 и 200 символа")
    private String title;

    @NotBlank(message = "Съдържанието не може да бъде празно")
    @Size(min = 1, max = 10000, message = "Съдържанието трябва да бъде между 1 и 10000 символа")
    private String content;

    private CategoryEnum category;

    private String imageUrl;

    @Size(max = 10, message = "Емоцията не може да бъде повече от 10 символа")
    private String emotion;

    @Size(max = 100, message = "Текстът на емоцията не може да бъде повече от 100 символа")
    private String emotionText;

    @Size(max = 20, message = "Статусът не може да бъде повече от 20 символа")
    private String status = "PUBLISHED";

    private String linkUrl;
    private String linkMetadata;

    // ====== CONSTRUCTORS ======

    public PublicationRequestDTO() {
    }

    public PublicationRequestDTO(String title, String content, CategoryEnum category) {
        this.title = title;
        this.content = content;
        this.category = category;
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

    public String getEmotion() {
        return emotion;
    }

    public void setEmotion(String emotion) {
        this.emotion = emotion;
    }

    public String getEmotionText() {
        return emotionText;
    }

    public void setEmotionText(String emotionText) {
        this.emotionText = emotionText;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLinkUrl() {return linkUrl;}

    public void setLinkUrl(String linkUrl) {this.linkUrl = linkUrl;}

    public String getLinkMetadata() {return linkMetadata;}

    public void setLinkMetadata(String linkMetadata) {this.linkMetadata = linkMetadata;}

    // ====== UTILITY METHODS ======

    public boolean hasImage() {
        return imageUrl != null && !imageUrl.trim().isEmpty();
    }

    public boolean hasEmotion() {
        return emotion != null && !emotion.trim().isEmpty();
    }

    public boolean isPublished() {
        return "PUBLISHED".equals(status);
    }

    public boolean isDraft() {
        return "PENDING".equals(status);
    }

    @Override
    public String toString() {
        return "PublicationRequestDTO{" +
                "title='" + title + '\'' +
                ", contentLength=" + (content != null ? content.length() : 0) +
                ", category=" + category +
                ", hasImage=" + hasImage() +
                ", emotion='" + emotion + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
}