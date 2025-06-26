package smolyanVote.smolyanVote.models.enums;

public enum ReportReasonEnum {
    SPAM("Спам"),
    HARASSMENT("Тормоз или заплахи"),
    HATE_SPEECH("Език на омразата"),
    MISINFORMATION("Дезинформация"),
    INAPPROPRIATE("Неподходящо съдържание"),
    COPYRIGHT("Нарушение на авторски права"),
    OTHER("Друго");

    private final String displayName;

    ReportReasonEnum(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static ReportReasonEnum fromString(String value) {
        if (value == null) return OTHER;

        try {
            return ReportReasonEnum.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return OTHER;
        }
    }
}