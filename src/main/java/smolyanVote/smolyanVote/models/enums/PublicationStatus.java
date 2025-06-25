package smolyanVote.smolyanVote.models.enums;

public enum PublicationStatus {
    PUBLISHED("Публикувана"),
    EDITED("Редактирана"),
    PENDING("Изчакващ");


    private final String BG;
    PublicationStatus(String bg) {
        this.BG = bg;
    }
    public String toBG() {
        return BG;
    }
}
