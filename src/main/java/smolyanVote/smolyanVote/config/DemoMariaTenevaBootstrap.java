package smolyanVote.smolyanVote.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.AuthProvider;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;

import java.io.InputStream;
import java.time.Instant;
import java.util.Arrays;

/**
 * Seeds a realistic demo profile for local development and demos.
 * Disabled in production unless explicitly enabled via property.
 */
@Component
@Order(1)
public class DemoMariaTenevaBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoMariaTenevaBootstrap.class);

    static final String USERNAME = "MariaTeneva";
    static final String REAL_NAME = "Мария Тенева";
    static final String EMAIL = "maria.teneva@smolyanvote.local";
    static final String DEFAULT_PASSWORD = "Maria2026";
    static final String AVATAR_RESOURCE = "seed/demo-users/maria-teneva-avatar.jpg";
    static final String BIO =
            "Родена и израснала в Смолян. Работя в местна фирма, а в свободното си време следя "
                    + "инициативите за градска среда, култура и устойчиво развитие в региона. "
                    + "Вярвам, че активната общност прави Смолян по-добро място за живеене.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ImageCloudinaryService imageCloudinaryService;
    private final Environment environment;

    @Value("${smolyanvote.demo-users.seed-maria-teneva:true}")
    private boolean seedEnabled;

    public DemoMariaTenevaBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ImageCloudinaryService imageCloudinaryService,
            Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.imageCloudinaryService = imageCloudinaryService;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled || isProductionProfile()) {
            return;
        }

        UserEntity user = userRepository.findByEmail(EMAIL)
                .or(() -> userRepository.findByUsername(USERNAME))
                .orElseGet(this::createUser);

        boolean changed = enrichProfile(user);
        if (changed) {
            userRepository.save(user);
        }

        if (needsAvatar(user)) {
            try {
                String imageUrl = uploadAvatar();
                user.setImageUrl(imageUrl);
                userRepository.save(user);
                log.info("Demo user {} avatar uploaded to Cloudinary.", USERNAME);
            } catch (Exception e) {
                log.warn("Demo user {} avatar upload skipped: {}", USERNAME, e.getMessage());
            }
        }

        log.info(
                "Demo user ready: username={}, email={}, password={} (dev only)",
                USERNAME,
                EMAIL,
                DEFAULT_PASSWORD);
    }

    private UserEntity createUser() {
        UserEntity user = new UserEntity();
        user.setUsername(USERNAME);
        user.setRealName(REAL_NAME);
        user.setEmail(EMAIL);
        user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setAuthProvider(AuthProvider.LOCAL);
        user.setStatus(UserStatusEnum.ACTIVE);
        user.setRole(UserRole.USER);
        user.setLocation(Locations.SMOLYAN);
        user.setBio(BIO);
        user.setImageUrl("");
        user.setUserConfirmationCode(null);
        user.setTotalVotes(0);
        user.setPublicationsCount(0);
        user.setUserEventsCount(0);
        user.setSignalsCount(0);
        user.setCommentsCount(0);
        user.setLastOnline(Instant.now().minusSeconds(3600));
        user.setOnlineStatus(0);
        userRepository.save(user);
        log.info("Created demo user profile for {}.", REAL_NAME);
        return user;
    }

    private boolean enrichProfile(UserEntity user) {
        boolean changed = false;

        if (user.getRealName() == null || user.getRealName().isBlank()) {
            user.setRealName(REAL_NAME);
            changed = true;
        }
        if (user.getBio() == null || user.getBio().isBlank()) {
            user.setBio(BIO);
            changed = true;
        }
        if (user.getLocation() == null || user.getLocation() == Locations.NONE) {
            user.setLocation(Locations.SMOLYAN);
            changed = true;
        }
        if (user.getStatus() != UserStatusEnum.ACTIVE) {
            user.setStatus(UserStatusEnum.ACTIVE);
            user.setUserConfirmationCode(null);
            changed = true;
        }
        if (user.getAuthProvider() == null) {
            user.setAuthProvider(AuthProvider.LOCAL);
            changed = true;
        }
        if (user.getRole() == null) {
            user.setRole(UserRole.USER);
            changed = true;
        }
        if (user.getPassword() == null || user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
            changed = true;
        }
        if (user.getLastOnline() == null) {
            user.setLastOnline(Instant.now().minusSeconds(3600));
            changed = true;
        }

        return changed;
    }

    private static boolean needsAvatar(UserEntity user) {
        String url = user.getImageUrl();
        return url == null || url.isBlank();
    }

    private String uploadAvatar() throws Exception {
        ClassPathResource resource = new ClassPathResource(AVATAR_RESOURCE);
        try (InputStream in = resource.getInputStream()) {
            byte[] bytes = in.readAllBytes();
            return imageCloudinaryService.saveUserImageFromBytes(bytes, USERNAME);
        }
    }

    private boolean isProductionProfile() {
        String[] profiles = environment.getActiveProfiles();
        return Arrays.stream(profiles).anyMatch("prod"::equalsIgnoreCase);
    }
}
