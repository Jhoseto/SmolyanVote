package smolyanVote.smolyanVote.viewsAndDTO.commentsDTO;

import java.time.Instant;

public class CommentResponseDto {
    private Long id;
    private String author;
    private String authorImage;
    private String text;
    private Long parentId;
    private Instant createdAt;


    public CommentResponseDto(Long id, String author, String authorImage, String text, Long parentId, Instant createdAt) {
        this.id = id;
        this.author = author;
        this.authorImage = authorImage;
        this.text = text;
        this.parentId = parentId;
        this.createdAt = createdAt;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getAuthorImage() {
        return authorImage;
    }

    public void setAuthorImage(String authorImage) {
        this.authorImage = authorImage;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public Instant getCreatedAt() {return createdAt;}

    public void setCreatedAt(Instant createdAt) {this.createdAt = createdAt;}
}
