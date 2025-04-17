package smolyanVote.smolyanVote.models.enums;

/**
 * Represents the roles available for users in the system.
 */
public enum UserRole {
    /**
     * Administrator role.
     */
    ADMIN("Администратор"),

    /**
     * Regular user role.
     */
    USER("Потребител");



    private final String BG;

    UserRole(String bg) {
        this.BG = bg;
    }

    public String toBG() {
        return BG;
    }
}
