package smolyanVote.smolyanVote.viewsAndDTO;

public class CommentResponseDto {
    private Long id;
    private String author;
    private String authorImage;
    private String text;

    public CommentResponseDto(Long id,
                              String author,
                              String authorImage,
                              String text) {
        this.id = id;
        this.author = author;
        this.authorImage = authorImage;
        this.text = text;
    }


    public Long getId() { return id; }
    public String getAuthor() { return author; }
    public String getAuthorImage() { return authorImage; }
    public String getText() { return text; }

    public void setId(Long id) { this.id = id; }
    public void setAuthor(String author) { this.author = author; }
    public void setAuthorImage(String authorImage) { this.authorImage = authorImage; }
    public void setText(String text) { this.text = text; }
}
