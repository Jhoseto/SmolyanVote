package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
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
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.models.enums.UserRole;
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

    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           UserDetailsService userDetailsService,
                           UsersMapper usersMapper,
                           ImageCloudinaryServiceImpl imageStorageService,
                           ConfirmationLinkService confirmationLinkService,
                           EmailService emailService,
                           ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userDetailsService = userDetailsService;
        this.usersMapper = usersMapper;
        this.imageStorageService = imageStorageService;
        this.confirmationLinkService = confirmationLinkService;
        this.emailService = emailService;
        this.activityLogService = activityLogService;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<UserEntity> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
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
    @LogActivity(action = ActivityActionEnum.USER_LOGIN, entityType = EventType.DEFAULT,
            details = "Email: {email}", onSuccessOnly = false)

    public Authentication authenticateUser(String email, String password) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

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
     *
     * @return the UserEntity object representing the currently logged-in user, or null if no user is logged in
     */
    @Transactional
    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            Optional<UserEntity> userOptional = userRepository.findByUsername(username);
            if (userOptional.isPresent()) {
                return userOptional.get();
            } else {
                // The user not found by userName, then find by Email
                Optional<UserEntity> userByEmailOptional = userRepository.findByEmail(username);
                return userByEmailOptional.orElse(null);
            }
        }
        return null;
    }

    @Transactional
    @LogActivity(action = ActivityActionEnum.ADMIN_PROMOTE_USER, entityType = EventType.DEFAULT,
            details = "Promoted to admin: {username}")

    public void promoteUserToAdmin(String username) {
        Optional<UserEntity> userOptional = userRepository.findByUsername(username);
        UserRole newRole = UserRole.ADMIN;

        if (userOptional.isPresent()) {
            UserEntity user = userOptional.get();

            if (!user.getRole().equals(newRole)) {
                user.setRole(newRole);
                userRepository.save(user);
            } else {
                throw new RuntimeException("User is already an ADMIN.");
            }
        } else {
            throw new RuntimeException("User not found with username: " + username);
        }
    }

    @Transactional
    @LogActivity(action = ActivityActionEnum.ADMIN_DEMOTE_USER, entityType = EventType.DEFAULT,
            details = "Demoted to user: {username}")

    public void promoteAdminToUser(String username) {
        Optional<UserEntity> userOptional = userRepository.findByUsername(username);
        UserRole newRole = UserRole.USER;

        if (userOptional.isPresent()) {
            UserEntity user = userOptional.get();

            if (!user.getRole().equals(newRole)) {
                user.setRole(newRole);
                userRepository.save(user);
            } else {
                throw new RuntimeException("Role 'USER' not found in the database.");
            }
        } else {
            throw new RuntimeException("User not found with username: " + username);
        }
    }

    @Override
    @Transactional
    public void changeUserRole(Long userId) {
        Optional<UserEntity> user = userRepository.findById(userId);

        if (user.isPresent()){
            UserEntity currentUser = user.get();
            if (currentUser.getRole().equals(UserRole.USER)){
                promoteUserToAdmin(currentUser.getUsername());
            }else {
                promoteAdminToUser(currentUser.getUsername());
            }
            userRepository.save(currentUser);

        }else {
            throw new RuntimeException("User not found !");
        }
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
    @LogActivity(action = ActivityActionEnum.USER_REGISTER, entityType = EventType.DEFAULT,
            details = "Username: {username}, Email: {email}")

    public void createNewUser(UserRegistrationViewModel userRegistrationViewModel) {

        UserRole userRole = UserRole.USER;
        UserEntity newUser = new UserEntity();
        String confirmationCode = generateConfirmationCode();
        String defaultUserImage = "https://res.cloudinary.com/dgescxzjk/image/upload/v1747385586/default_user_vtabqo.jpg";

        newUser.setUsername(userRegistrationViewModel.getUsername())
                .setPassword(passwordEncoder.encode(userRegistrationViewModel.getRegPassword()))
                .setEmail(userRegistrationViewModel.getEmail())
                .setActive(false)
                .setImageUrl(defaultUserImage)
                .setUserConfirmationCode(confirmationCode)
                .setRole(userRole);
        setCurrentTimeStamps(newUser);
        userRepository.save(newUser);

        emailService.sendConfirmationEmail(newUser.getEmail());

        System.out.println("Email sent to " + newUser.getEmail());
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
    @LogActivity(action = ActivityActionEnum.EDIT_PROFILE, entityType = EventType.DEFAULT,
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


}
