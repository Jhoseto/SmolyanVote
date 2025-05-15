package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.util.List;

public class ReferendumDetailDTO {

    private ReferendumEntity referendum;
    private UserEntity creator;
    private List<String> imageUrls;
    private List<String> options;
    private List<Integer> votes;
    private List<Integer> votePercentages;
    private int totalVotes;
    private Integer userVote;
    private List<CommentsEntity> comments;

    public ReferendumDetailDTO(ReferendumEntity referendum, UserEntity creator, List<String> imageUrls,
                               List<String> options, List<Integer> votes, List<Integer> votePercentages,
                               int totalVotes, Integer userVote, List<CommentsEntity> comments) {
        this.referendum = referendum;
        this.creator = creator;
        this.imageUrls = imageUrls;
        this.options = options;
        this.votes = votes;
        this.votePercentages = votePercentages;
        this.totalVotes = totalVotes;
        this.userVote = userVote;
        this.comments = comments;
    }

    public ReferendumEntity getReferendum() {return referendum;}

    public void setReferendum(ReferendumEntity referendum) {this.referendum = referendum;}

    public UserEntity getCreator() {return creator;}

    public void setCreator(UserEntity creator) {this.creator = creator;}

    public List<String> getImageUrls() {return imageUrls;}

    public void setImageUrls(List<String> imageUrls) {this.imageUrls = imageUrls;}

    public List<String> getOptions() {return options;}

    public void setOptions(List<String> options) {this.options = options;}

    public List<Integer> getVotes() {return votes;}

    public void setVotes(List<Integer> votes) {this.votes = votes;}

    public List<Integer> getVotePercentages() {return votePercentages;}

    public void setVotePercentages(List<Integer> votePercentages) {this.votePercentages = votePercentages;}

    public int getTotalVotes() {return totalVotes;}

    public void setTotalVotes(int totalVotes) {this.totalVotes = totalVotes;}

    public Integer getUserVote() {return userVote;}

    public void setUserVote(Integer userVote) {this.userVote = userVote;}

    public List<CommentsEntity> getComments() {return comments;}

    public void setComments(List<CommentsEntity> comments) {this.comments = comments;}

}
