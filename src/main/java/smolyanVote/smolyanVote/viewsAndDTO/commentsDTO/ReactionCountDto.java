package smolyanVote.smolyanVote.viewsAndDTO.commentsDTO;

public class ReactionCountDto {
    public int likes;
    public int dislikes;

    public ReactionCountDto(int likes, int dislikes) {
        this.likes = likes;
        this.dislikes = dislikes;
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public int getDislikes() {
        return dislikes;
    }

    public void setDislikes(int dislikes) {
        this.dislikes = dislikes;
    }
}
