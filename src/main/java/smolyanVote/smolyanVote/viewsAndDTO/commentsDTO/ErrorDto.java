package smolyanVote.smolyanVote.viewsAndDTO.commentsDTO;

public class ErrorDto {
    public String error;

    public ErrorDto(String error) {
        this.error = error;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
