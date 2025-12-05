package smolyanVote.smolyanVote.models.enums;

public enum ReportableEntityType {
    PUBLICATION("Публикация"),
    SIMPLE_EVENT("Просто събитие"),

    REFERENDUM("Референдум"),

    SIGNAL("Сигнал"),

    COMMENT("Коментар"),

    MULTI_POLL("Множествена анкета"),

    USER("Потребител");



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