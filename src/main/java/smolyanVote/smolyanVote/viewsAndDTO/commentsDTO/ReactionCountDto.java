package smolyanVote.smolyanVote.viewsAndDTO.commentsDTO;

public class ReactionCountDto {
    public int likes;
    public int dislikes;
    private String userVote;

    public ReactionCountDto(int likes, int dislikes, String userVote) {
        this.likes = likes;
        this.dislikes = dislikes;

        this.userVote = userVote;
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

    public String getUserVote() {return userVote;}

    public void setUserVote(String userVote) {this.userVote = userVote;}
}
