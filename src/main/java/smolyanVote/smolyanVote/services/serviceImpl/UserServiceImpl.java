package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.componentsAndSecurity.MasterAdminPolicy;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.*;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.ConfirmationLinkService;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.EmailService;
import smolyanVote.smolyanVote.services.mappers.UsersMapper;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.UserProfileViewModel;
import smolyanVote.smolyanVote.viewsAndDTO.UserRegistrationViewModel;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of the UserService interface.
 */
@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final UsersMapper usersMapper;
    private final ImageCloudinaryServiceImpl imageStorageService;
    private final ConfirmationLinkService confirmationLinkService;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;
    private final MasterAdminPolicy masterAdminPolicy;

    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           UserDetailsService userDetailsService,
                           UsersMapper usersMapper,
                           ImageCloudinaryServiceImpl imageStorageService,
                           ConfirmationLinkService confirmationLinkService,
                           EmailService emailService,
                           ActivityLogService activityLogService,
                           MasterAdminPolicy masterAdminPolicy) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
        this.usersMapper = usersMapper;
        this.imageStorageService = imageStorageService;
        this.confirmationLinkService = confirmationLinkService;
        this.emailService = emailService;
        this.activityLogService = activityLogService;
        this.masterAdminPolicy = masterAdminPolicy;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<UserEntity> findUserByEmail(String email) {
        // Нормализиране на email на малки букви преди търсене
        String normalizedEmail = email != null ? email.toLowerCase().trim() : null;
        return userRepository.findByEmail(normalizedEmail);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<UserEntity> findUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Authenticates a user using email and password.
     *
     * @param email    the email of the user
     * @param password the password of the user
     * @return an Authentication object if authentication is successful, otherwise null
     */

    @Transactional
    @LogActivity(action = ActivityActionEnum.USER_LOGIN, entityType = ActivityTypeEnum.USER,
            details = "Email: {email}, Username: {username}", onSuccessOnly = false)

    public Authentication authenticateUser(String email, String password) {
        // Нормализиране на email на малки букви преди authentication
        String normalizedEmail = email != null ? email.toLowerCase().trim() : null;
        UserDetails userDetails = userDetailsService.loadUserByUsername(normalizedEmail);

        if (userDetails != null && passwordEncoder.matches(password, userDetails.getPassword())) {
            Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            getCurrentUser().setOnlineStatus(1);

            return authentication;
        }
        return null;
    }


    @Override
    public boolean checkPassword(UserEntity user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }

    /**
     * {@inheritDoc}
     */
    @Transactional
    @Override
    public List<UserProfileViewModel> getAllUsers() {
        List<UserProfileViewModel> allUsers = new ArrayList<>();
        List<UserEntity> users = userRepository.findAll();

        // Mapping users to UserProfileViewModel using MapperForUsers
        for (UserEntity user : users) {
            UserProfileViewModel userProfileViewModel = usersMapper.mapUserToProfileViewModel(user);
            allUsers.add(userProfileViewModel);
        }
        return allUsers;
    }

    /**
     * Retrieves information about the currently logged-in user.
     * Works with both traditional authentication and OAuth2 authentication.
     *
     * @return the UserEntity object representing the currently logged-in user, or null if no user is logged in
     */
    @Transactional
    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String identifier = null;

            // JWT автентикация (JwtAuthenticationFilter поставя UserEntity директно
            // като principal) - authentication.getName() би върнал UserEntity#toString(),
            // затова връщаме entity-то веднага, без email/username lookup.
            if (authentication.getPrincipal() instanceof UserEntity) {
                return (UserEntity) authentication.getPrincipal();
            }

            // Проверка за OAuth2User (Google/Facebook login)
            if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
                org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = 
                    (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
                // За OAuth2, извличаме email от атрибутите
                identifier = oAuth2User.getAttribute("email");
            } else {
                // За традиционна автентикация, използваме getName() (което е email)
                identifier = authentication.getName();
            }
            
            if (identifier != null && !identifier.isEmpty()) {
                // Нормализиране на email на малки букви
                String normalizedIdentifier = identifier.toLowerCase().trim();
                
                // Първо опитваме по email
                Optional<UserEntity> userByEmailOptional = userRepository.findByEmail(normalizedIdentifier);
                if (userByEmailOptional.isPresent()) {
                    return userByEmailOptional.get();
                }
                
                // Ако не намерим по email, опитваме по username
                Optional<UserEntity> userOptional = userRepository.findByUsername(normalizedIdentifier);
                if (userOptional.isPresent()) {
                    return userOptional.get();
                }
            }
        }
        return null;
    }


    /**
     * Deletes a user from the repository based on the provided user ID.
     * If the user exists in the repository, it is deleted.
     * If the user does not exist, a message is printed indicating that the delete operation failed.
     *
     * @param userId The ID of the user to be deleted.
     */

    @Transactional
    @Override
    //@LogActivity - manual Log try/catch logic

    public void deleteUser(Long userId){
        Optional<UserEntity> user = userRepository.findById(userId);
        if (user.isPresent()){
            UserEntity currentUser = user.get();

            if (masterAdminPolicy.isMasterAdmin(currentUser)) {
                throw new RuntimeException("Master admin профилът не може да бъде изтрит.");
            }

            // Запазваме данните ПРЕДИ изтриване
            String deletedUsername = user.get().getUsername();
            String deletedEmail = user.get().getEmail();

            System.out.println("Delete user => "+currentUser.getUsername());
            userRepository.delete(currentUser);

            // Activity logging for admin log panel СЛЕД успешното изтриване
            try {
                String details = String.format("Deleted user: \"%s\" (Email: %s)", deletedUsername, deletedEmail);
                activityLogService.logActivity(ActivityActionEnum.DELETE_ACCOUNT, getCurrentUser(),
                        "DEFAULT", userId, details, null, null);
            } catch (Exception e) {
                System.err.println("Failed to log user deletion: " + e.getMessage());
            }

        }else {
            throw new RuntimeException("Delete operation false ! The User not exist");
        }
    }

    /**
     * Retrieves the user profile information for the user with the specified username.
     * If a user with the given username exists, their profile information is retrieved and mapped to a UserProfileViewModel object.
     * If no user with the specified username exists, an empty UserProfileViewModel object is returned.
     *
     * @param userName The username of the user whose profile information is to be retrieved.
     * @return UserProfileViewModel containing the profile information of the user.
     */
    @Override
    public UserProfileViewModel getUserByUsername (String userName) {
        Optional<UserEntity> user = userRepository.findByUsername(userName);

        UserProfileViewModel userProfileViewModel = new UserProfileViewModel();
        if (user.isPresent()) {
            UserEntity currentUser = user.get();
            userProfileViewModel = usersMapper.mapUserToProfileViewModel(currentUser);
        }
        return userProfileViewModel;
    }



    //CREATE NEW USER
    @Override
    @LogActivity(action = ActivityActionEnum.USER_REGISTER, entityType = ActivityTypeEnum.USER,
            details = "Username: {username}, Email: {email}")

    public void createNewUser(UserRegistrationViewModel userRegistrationViewModel) {

        // Нормализиране на email на малки букви
        String normalizedEmail = userRegistrationViewModel.getEmail() != null ?
                userRegistrationViewModel.getEmail().toLowerCase().trim() : null;

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalStateException("Потребител с този имейл адрес вече съществува!");
        }
        if (userRepository.findByUsername(userRegistrationViewModel.getUsername()).isPresent()) {
            throw new IllegalStateException("Потребител с това потребителско име вече съществува!");
        }

        UserRole userRole = UserRole.USER;
        UserEntity newUser = new UserEntity();
        String confirmationCode = generateConfirmationCode();
        String defaultUserImage = "";

        newUser.setUsername(userRegistrationViewModel.getUsername())
                .setPassword(passwordEncoder.encode(userRegistrationViewModel.getRegPassword()))
                .setEmail(normalizedEmail)
                .setStatus(UserStatusEnum.PENDING_ACTIVATION)
                .setImageUrl(defaultUserImage)
                .setUserConfirmationCode(confirmationCode)
                .setRole(userRole);
        setCurrentTimeStamps(newUser);
        userRepository.save(newUser);

        // Outside any broader DB transaction: Mailjet failure must surface to AuthController.
        emailService.sendConfirmationEmail(newUser.getEmail());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    @Transactional
    public boolean confirmEmail(Long userId, String code) {
        Optional<UserEntity> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return false;
        }

        UserEntity user = userOptional.get();
        if (user.getUserConfirmationCode() == null
                || !user.getUserConfirmationCode().equals(code)
                || user.getStatus() != UserStatusEnum.PENDING_ACTIVATION) {
            return false;
        }

        user.setStatus(UserStatusEnum.ACTIVE);
        userRepository.save(user);

        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            activityLogService.logActivity(ActivityActionEnum.USER_EMAIL_VERIFY, user,
                    ActivityTypeEnum.USER.name(), user.getId(), "Email verified successfully", ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log USER_EMAIL_VERIFY activity: " + e.getMessage());
        }

        return true;
    }

    // ===== HELPER METHODS FOR ACTIVITY LOGGING (mirrors PasswordResetServiceImpl) =====

    private String extractIpAddress() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes =
                    (org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getHeader("X-Real-IP");
                }
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                if (ip != null && ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                return ip != null ? ip : "unknown";
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    private String extractUserAgent() {
        try {
            org.springframework.web.context.request.ServletRequestAttributes attributes =
                    (org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                jakarta.servlet.http.HttpServletRequest request = attributes.getRequest();
                String userAgent = request.getHeader("User-Agent");
                return userAgent != null ? userAgent : "unknown";
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    // Функция за поставяне на времеви печати
    private static void setCurrentTimeStamps(BaseEntity baseEntity) {
        baseEntity.setCreated(Instant.now());
        baseEntity.setModified(Instant.now());
    }
    // Генериране на уникален код за потвърждение
    private String generateConfirmationCode() {
        return UUID.randomUUID().toString();
    }




    @Override
    @LogActivity(action = ActivityActionEnum.EDIT_PROFILE, entityType = ActivityTypeEnum.USER,
            details = "Bio: {bio}, Location: {location}")

    public void updateUserProfile(Long userId, MultipartFile newImage, String bio, Locations location) throws IOException {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));

        // Обновяване на биографията
        if (bio != null && !bio.equals(user.getBio())) {
            user.setBio(bio);
        }

        // Обновяване на местоположението
        if (location != null && location != Locations.NONE && !location.equals(user.getLocation())) {
            user.setLocation(location);
        }

        // Обработка на ново изображение
        if (newImage != null && !newImage.isEmpty()) {
            // Изтриване на старата снимка от Cloudinary, ако съществува
            if (user.getImageUrl() != null && !user.getImageUrl().isEmpty()) {
                imageStorageService.deleteImage(user.getImageUrl());
            }

            // Качване на новата снимка
            String imageUrl = imageStorageService.saveUserImage(newImage, user.getUsername());
            user.setImageUrl(imageUrl);
        }

        // Запазване на обновените данни
        userRepository.save(user);
    }

    // ====== SIDEBAR METHODS =====

    @Override
    public long getOnlineUsersCount() {
        return userRepository.countByOnlineStatus(1); // 1 = online
    }

    @Override
    public List<UserEntity> getOnlineUsers(int limit) {
        int size = Math.min(Math.max(limit, 1), 20);
        return userRepository.findOnlineUsers(1, PageRequest.of(0, size));
    }

}
