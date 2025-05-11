package smolyanVote.smolyanVote.services;

import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.UserProfileViewModel;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing users.
 */

public interface UserService {

    Authentication authenticateUser(String email, String password);

    Optional<UserEntity> findUserByEmail(String email);

    Optional<UserEntity> findUserByUsername(String username);

    List<UserProfileViewModel> getAllUsers();

    UserEntity getCurrentUser();

    void promoteUserToAdmin(String username);

    void promoteAdminToUser(String username);

    void changeUserRole(Long userId);

    void deleteUser(Long userId);


    UserProfileViewModel getUserByUsername(String userName);

    void updateUserProfile(Long userId, MultipartFile newImage, String bio, Locations location) throws IOException;
}
