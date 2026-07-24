package smolyanVote.smolyanVote.componentsAndSecurity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.UserEntity;

import java.util.Locale;
import java.util.Optional;

/**
 * Protects the platform owner account from ban, delete, or demotion.
 */
@Component
public class MasterAdminPolicy {

    private final String masterAdminEmail;

    public MasterAdminPolicy(
            @Value("${smolyanvote.master-admin.email:smolyanvote@gmail.com}") String masterAdminEmail) {
        this.masterAdminEmail = normalizeEmail(masterAdminEmail);
    }

    public String getMasterAdminEmail() {
        return masterAdminEmail;
    }

    public boolean isMasterAdmin(UserEntity user) {
        return user != null && isMasterAdminEmail(user.getEmail());
    }

    public boolean isMasterAdminEmail(String email) {
        return email != null && normalizeEmail(email).equals(masterAdminEmail);
    }

    public Optional<String> deleteBlockedReason(UserEntity user) {
        if (isMasterAdmin(user)) {
            return Optional.of("Master admin профилът не може да бъде изтрит.");
        }
        return Optional.empty();
    }

    public Optional<String> banBlockedReason(UserEntity user) {
        if (isMasterAdmin(user)) {
            return Optional.of("Master admin профилът не може да бъде блокиран.");
        }
        return Optional.empty();
    }

    public Optional<String> demoteBlockedReason(UserEntity user) {
        if (isMasterAdmin(user)) {
            return Optional.of("Master admin профилът не може да бъде понижен до USER.");
        }
        return Optional.empty();
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
