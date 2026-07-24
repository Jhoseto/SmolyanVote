package smolyanVote.smolyanVote.models.enums;

/**
 * Central place for default user role — every new account must start as USER.
 * ADMIN is granted only via {@code AdminUserManagementService.changeUserRole}.
 */
public final class UserRoleDefaults {

    public static final UserRole NEW_USER = UserRole.USER;

    private UserRoleDefaults() {
    }

    public static UserRole effective(UserRole role) {
        return role != null ? role : NEW_USER;
    }
}
