package smolyanVote.smolyanVote.models.enums;

public enum EventStatus {
    ACTIVE("Активен"),

    INACTIVE("Неактивен"),
    ;



    private final String BG;

    EventStatus(String bg) {
        this.BG = bg;
    }

    public String toBG() {
        return BG;
    }
}
