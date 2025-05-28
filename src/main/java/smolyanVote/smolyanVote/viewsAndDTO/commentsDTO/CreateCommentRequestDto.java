package smolyanVote.smolyanVote.viewsAndDTO.commentsDTO;

public class CreateCommentRequestDto {
    private Long targetId;
    private String text;
    private Long parentId;

    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }
}
