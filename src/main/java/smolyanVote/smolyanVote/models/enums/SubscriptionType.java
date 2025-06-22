package smolyanVote.smolyanVote.models.enums;

public enum SubscriptionType {
    PODCAST_EPISODES("Нови подкаст епизоди"),
    ELECTION_UPDATES("Избори и гласувания"),
    CITY_NEWS("Новини за града"),
    ALL_NOTIFICATIONS("Всички известия");

    private final String displayName;

    SubscriptionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
