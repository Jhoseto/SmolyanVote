package smolyanVote.smolyanVote.models.enums;

public enum SignalsUrgencyLevel {
    LOW("Ниска"),
    MEDIUM("Средна"),
    HIGH("Висока");

    private final String displayName;

    SignalsUrgencyLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}