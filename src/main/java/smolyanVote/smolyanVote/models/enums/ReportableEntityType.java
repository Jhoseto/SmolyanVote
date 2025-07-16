package smolyanVote.smolyanVote.models.enums;

public enum ReportableEntityType {
    PUBLICATION("Публикация"),
    SIMPLE_EVENT("Просто събитие"),
    REFERENDUM("Референдум"),
    MULTI_POLL("Множествена анкета");

    private final String displayName;

    ReportableEntityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static ReportableEntityType fromString(String value) {
        if (value == null) return PUBLICATION;

        try {
            return ReportableEntityType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PUBLICATION;
        }
    }
}