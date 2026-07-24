package smolyanVote.smolyanVote.componentsAndSecurity;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;

/**
 * Ensures the configured master admin account stays ADMIN and unbanned on startup.
 */
@Component
public class MasterAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MasterAdminBootstrap.class);

    private final UserRepository userRepository;
    private final MasterAdminPolicy masterAdminPolicy;

    public MasterAdminBootstrap(UserRepository userRepository, MasterAdminPolicy masterAdminPolicy) {
        this.userRepository = userRepository;
        this.masterAdminPolicy = masterAdminPolicy;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        userRepository.findByEmail(masterAdminPolicy.getMasterAdminEmail()).ifPresent(this::ensureMasterAdminState);
    }

    private void ensureMasterAdminState(UserEntity user) {
        boolean changed = false;

        if (!UserRole.ADMIN.equals(user.getRole())) {
            user.setRole(UserRole.ADMIN);
            changed = true;
            log.warn("Master admin {} restored to ADMIN role.", user.getUsername());
        }

        if (UserStatusEnum.TEMPORARILY_BANNED.equals(user.getStatus())
                || UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus())) {
            user.setStatus(UserStatusEnum.ACTIVE);
            user.setBanEndDate(null);
            user.setBanReason(null);
            user.setBannedByUsername(null);
            user.setBanDate(null);
            changed = true;
            log.warn("Master admin {} ban state cleared on startup.", user.getUsername());
        }

        if (changed) {
            userRepository.save(user);
        }
    }
}
