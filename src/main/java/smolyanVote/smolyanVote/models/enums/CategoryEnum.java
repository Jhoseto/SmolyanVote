package smolyanVote.smolyanVote.models.enums;

public enum CategoryEnum {
    NEWS("Новини", "news", "bi-newspaper"),
    INFRASTRUCTURE("Инфаструктура","infrastructure","bi-street"),
    MUNICIPAL("Общинa", "municipal", "bi-building"),
    INITIATIVES("Граждански инициативи", "initiatives", "bi-lightbulb"),
    CULTURE("Културни събития", "culture", "bi-palette"),
    OTHER("Други", "other", "bi-three-dots");

    private final String displayName;
    private final String value;
    private final String icon;

    CategoryEnum(String displayName, String value, String icon) {
        this.displayName = displayName;
        this.value = value;
        this.icon = icon;
    }



    public String getDisplayName() {
        return displayName;
    }

    public String getValue() {
        return value;
    }

    public String getIcon() {
        return icon;
    }

    public static CategoryEnum fromValue(String value) {
        for (CategoryEnum category : values()) {
            if (category.value.equals(value)) {
                return category;
            }
        }
        return OTHER; // Default fallback
    }

    @Override
    public String toString() {
        return displayName;
    }
}

