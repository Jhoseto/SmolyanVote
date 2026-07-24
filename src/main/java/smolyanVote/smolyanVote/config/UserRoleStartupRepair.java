package smolyanVote.smolyanVote.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.util.List;

/**
 * One-time repair for legacy rows where {@code users.role} was NULL
 * (MySQL ENUM default / missing column default could leave admin-like access).
 */
@Component
@Slf4j
public class UserRoleStartupRepair implements ApplicationRunner {

    private final UserRepository userRepository;

    public UserRoleStartupRepair(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<UserEntity> withoutRole = userRepository.findAllWithNullRole();
        if (withoutRole.isEmpty()) {
            return;
        }
        for (UserEntity user : withoutRole) {
            user.setRole(UserRole.USER);
        }
        userRepository.saveAll(withoutRole);
        log.warn("Repaired {} user account(s) with NULL role → USER", withoutRole.size());
    }
}
