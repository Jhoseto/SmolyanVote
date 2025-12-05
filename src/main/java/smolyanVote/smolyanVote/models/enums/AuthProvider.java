package smolyanVote.smolyanVote.models.enums;

/**
 * Represents the authentication provider used by a user.
 */
public enum AuthProvider {
    /**
     * Local authentication (email/password).
     */
    LOCAL("Локален"),

    /**
     * Google OAuth2 authentication.
     */
    GOOGLE("Google"),

    /**
     * Facebook OAuth2 authentication.
     */
    FACEBOOK("Facebook");

    private final String bgName;

    AuthProvider(String bgName) {
        this.bgName = bgName;
    }

    public String toBG() {
        return bgName;
    }
}

