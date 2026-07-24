package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.componentsAndSecurity.MasterAdminPolicy;
import smolyanVote.smolyanVote.exceptions.UserBannedException;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserBanService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class UserBanServiceImpl implements UserBanService {

    private final UserRepository userRepository;
    private final MasterAdminPolicy masterAdminPolicy;

    public UserBanServiceImpl(UserRepository userRepository, MasterAdminPolicy masterAdminPolicy) {
        this.userRepository = userRepository;
        this.masterAdminPolicy = masterAdminPolicy;
    }

    @Override
    @Transactional
    public UserEntity resolveBanState(UserEntity user) {
        if (user == null) {
            return null;
        }

        if (UserStatusEnum.TEMPORARILY_BANNED.equals(user.getStatus())
                && user.getBanEndDate() != null
                && !user.getBanEndDate().isAfter(Instant.now())) {
            user.setStatus(UserStatusEnum.ACTIVE);
            user.setBanEndDate(null);
            user.setBanReason(null);
            user.setBannedByUsername(null);
            user.setBanDate(null);
            user.setModerationStrikeCount(0);
            return userRepository.save(user);
        }

        return user;
    }

    @Override
    public boolean isPermanentlyBanned(UserEntity user) {
        user = resolveBanState(user);
        return user != null && UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus());
    }

    @Override
    public boolean isTemporarilyBanned(UserEntity user) {
        user = resolveBanState(user);
        return user != null
                && UserStatusEnum.TEMPORARILY_BANNED.equals(user.getStatus())
                && user.getBanEndDate() != null
                && user.getBanEndDate().isAfter(Instant.now());
    }

    @Override
    public boolean isReadOnlyBanned(UserEntity user) {
        return isPermanentlyBanned(user) || isTemporarilyBanned(user);
    }

    @Override
    public void ensureCanInteract(UserEntity user) {
        user = resolveBanState(user);
        if (user == null) {
            return;
        }

        if (isPermanentlyBanned(user)) {
            throw new UserBannedException(
                    "Профилът ви е перманентно блокиран.",
                    null,
                    user.getBanReason(),
                    true);
        }

        if (isTemporarilyBanned(user)) {
            throw new UserBannedException(
                    "Профилът ви е временно ограничен до " + user.getBanEndDate() + ". Можете само да разглеждате съдържание.",
                    user.getBanEndDate(),
                    user.getBanReason(),
                    false);
        }
    }

    @Override
    @Transactional
    public StrikeResult recordModerationStrike(UserEntity user, String reason) {
        user = resolveBanState(user);
        if (masterAdminPolicy.isMasterAdmin(user)) {
            return new StrikeResult(user.getModerationStrikeCount(), MAX_STRIKES_BEFORE_AUTO_BAN, false, null);
        }

        int strikeCount = user.getModerationStrikeCount() + 1;
        user.setModerationStrikeCount(strikeCount);

        if (strikeCount >= MAX_STRIKES_BEFORE_AUTO_BAN) {
            Instant banEnd = Instant.now().plus(AUTO_BAN_HOURS, ChronoUnit.HOURS);
            user.setStatus(UserStatusEnum.TEMPORARILY_BANNED);
            user.setBanEndDate(banEnd);
            user.setBanReason(reason != null && !reason.isBlank()
                    ? reason
                    : "Автоматичен бан след 3 нарушения на правилата за съдържание.");
            user.setBannedByUsername("SYSTEM");
            user.setBanDate(Instant.now());
            user.setModerationStrikeCount(0);
            userRepository.save(user);
            return new StrikeResult(MAX_STRIKES_BEFORE_AUTO_BAN, 0, true, banEnd);
        }

        userRepository.save(user);
        return new StrikeResult(strikeCount, MAX_STRIKES_BEFORE_AUTO_BAN - strikeCount, false, null);
    }
}
