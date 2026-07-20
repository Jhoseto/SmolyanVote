package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.services.support.ReputationCalculator;
import smolyanVote.smolyanVote.services.mappers.UsersMapper;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SignalsDto;
import smolyanVote.smolyanVote.viewsAndDTO.UserProfileViewModel;

import java.util.*;

/**
 * Legacy profile JSON endpoints. Page HTML lives in Next.js
 * ({@code /profile}, {@code /user/[username]}).
 */
@Controller
public class UserController {

    private final UserService userService;
    private final MainEventsService mainEventsService;
    private final UserRepository userRepository;
    private final UsersMapper usersMapper;
    private final SignalsService signalsService;
    private final SignalsRepository signalsRepository;
    private final PublicationService publicationService;

    @Autowired
    public UserController(UserService userService,
                          MainEventsService mainEventsService,
                          UserRepository userRepository,
                          UsersMapper usersMapper, SignalsService signalsService,
                          SignalsRepository signalsRepository,
                          PublicationService publicationService) {
        this.userService = userService;
        this.mainEventsService = mainEventsService;
        this.userRepository = userRepository;
        this.usersMapper = usersMapper;
        this.signalsService = signalsService;
        this.signalsRepository = signalsRepository;
        this.publicationService = publicationService;
    }

    // ===== API ENDPOINTS =====

    @GetMapping(value = "/api/user/current", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getCurrentUserApi(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            UserProfileViewModel userProfile = usersMapper.mapUserToProfileViewModel(currentUser);

            Map<String, Object> response = new HashMap<>();
            response.putAll(convertProfileViewModelToMap(userProfile));
            response.put("reputationScore", calculateReputation(currentUser));
            response.put("reputationBadge", getReputationBadge(calculateReputation(currentUser)));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждане на потребителските данни"));
        }
    }

    @GetMapping(value = "/api/user/{userId}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserByIdApi(@PathVariable Long userId) {
        try {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен"));

            UserProfileViewModel userProfile = usersMapper.mapUserToProfileViewModel(user);

            Map<String, Object> response = new HashMap<>();
            response.putAll(convertProfileViewModelToMap(userProfile));
            response.put("reputationScore", calculateReputation(user));
            response.put("reputationBadge", getReputationBadge(calculateReputation(user)));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждане на потребителските данни"));
        }
    }

    @GetMapping(value = "/api/user/preferences", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserPreferences(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            Map<String, Object> preferences = new HashMap<>();

            preferences.put("likedPosts", new ArrayList<>());
            preferences.put("dislikedPosts", new ArrayList<>());
            preferences.put("bookmarkedPosts", new ArrayList<>());
            preferences.put("followedAuthors", new ArrayList<>());
            preferences.put("notifications", user.getNotification() != null ? user.getNotification() : new ArrayList<>());

            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждането на предпочитанията"));
        }
    }

    // ===== TAB CONTENT ENDPOINTS =====

    @GetMapping(value = "/profile/api/events", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<EventSimpleViewDTO>> getOwnEvents(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            List<EventSimpleViewDTO> events = mainEventsService.getAllUserEvents(currentUser.getUsername());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping(value = "/user/{userId}/api/events", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<EventSimpleViewDTO>> getUserEvents(@PathVariable Long userId) {
        try {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен"));

            List<EventSimpleViewDTO> events = mainEventsService.getAllUserEvents(user.getUsername());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }



    @GetMapping(value = "/profile/api/publications", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<PublicationResponseDTO>> getOwnPublications() {
        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        List<PublicationResponseDTO> publications = publicationService.findAllByAuthorId(currentUser.getId());
        return ResponseEntity.ok(publications);
    }

    @GetMapping(value = "/user/{userId}/api/publications", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<PublicationResponseDTO>> getAllUserPublications(@PathVariable Long userId) {

        List<PublicationResponseDTO> publications = publicationService.findAllByAuthorId(userId);
        return ResponseEntity.ok(publications);
    }




    @GetMapping(value = "/profile/api/signals", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<SignalsDto>> getCurrentUserSignals() {
        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).build(); // Unauthorized
        }

        List<SignalsDto> signals = signalsService.findAllByAuthorId(currentUser.getId());
        return ResponseEntity.ok(signals);
    }


    @GetMapping(value = "/user/{userId}/api/signals", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<SignalsDto>> getUserSignals(@PathVariable Long userId) {
        List<SignalsDto> signals = signalsService.findAllByAuthorId(userId);

        return ResponseEntity.ok(signals);
    }


    @GetMapping(value = "/profile/api/messenger", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getOwnMessenger(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).build();
        }

        // Placeholder - to be implemented with messengerLogService + Mapper
        List<Map<String, Object>> messenger = new ArrayList<>();
        return ResponseEntity.ok(messenger);
    }

    @GetMapping(value = "/user/{userId}/api/messenger", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getUserMessenger(@PathVariable Long userId) {
        // Placeholder - to be implemented with messengerLogService + Mapper
        List<Map<String, Object>> messenger = new ArrayList<>();
        return ResponseEntity.ok(messenger);
    }


    // ===== PROFILE UPDATE ENDPOINTS =====

    @PostMapping(value = "/profile/update/ajax", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateProfileAjax(
            @RequestParam("profileImage") MultipartFile profileImage,
            @RequestParam("location") Locations location,
            @RequestParam("bio") String bio,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            Long userId = userService.getCurrentUser().getId();
            userService.updateUserProfile(userId, profileImage, bio, location);

            // Return updated user data using mapper
            UserEntity updatedUser = userService.getCurrentUser();
            UserProfileViewModel userProfile = usersMapper.mapUserToProfileViewModel(updatedUser);

            Map<String, Object> response = new HashMap<>();
            response.putAll(convertProfileViewModelToMap(userProfile));
            response.put("success", true);
            response.put("message", "Профилът е обновен успешно");
            response.put("reputationScore", calculateReputation(updatedUser));
            response.put("reputationBadge", getReputationBadge(calculateReputation(updatedUser)));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при обновяване на профила"));
        }
    }

    // ===== PRIVATE UTILITY METHODS =====

    private Map<String, Object> convertProfileViewModelToMap(UserProfileViewModel profile) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", profile.getId());
        map.put("username", profile.getUserName());
        map.put("realName", profile.getRealName());
        map.put("email", profile.getEmail());
        map.put("imageUrl", profile.getProfileImageUrl());
        map.put("role", profile.getRole().name());
        map.put("onlineStatus", profile.getOnlineStatus());
        map.put("created", profile.getCreated());
        map.put("lastOnline", profile.getLastOnline());
        map.put("userEventsCount", profile.getUserOfferCount());
        return map;
    }

    private int calculateReputation(UserEntity user) {
        return ReputationCalculator.score(user);
    }

    private String getReputationBadge(int score) {
        return ReputationCalculator.badge(score);
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        return error;
    }
}