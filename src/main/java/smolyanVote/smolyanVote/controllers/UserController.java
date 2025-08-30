package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.SignalsRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.services.mappers.UsersMapper;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SignalsDto;
import smolyanVote.smolyanVote.viewsAndDTO.UserProfileViewModel;

import java.io.IOException;
import java.util.*;

@Controller
public class UserController {

    private final UserService userService;
    private final MainEventsService mainEventsService;
    private final UserRepository userRepository;
    private final UsersMapper usersMapper;
    private final SignalsService signalsService;
    private final SignalsRepository signalsRepository;
    private final PublicationService publicationService;
    private final FollowService followService;

    @Autowired
    public UserController(UserService userService,
                          MainEventsService mainEventsService,
                          UserRepository userRepository,
                          UsersMapper usersMapper, SignalsService signalsService,
                          SignalsRepository signalsRepository,
                          PublicationService publicationService,
                          FollowService followService) {
        this.userService = userService;
        this.mainEventsService = mainEventsService;
        this.userRepository = userRepository;
        this.usersMapper = usersMapper;
        this.signalsService = signalsService;
        this.signalsRepository = signalsRepository;
        this.publicationService = publicationService;
        this.followService = followService;
    }

    // ===== UNIFIED PROFILE ENDPOINTS =====
    @GetMapping("/profile")
    public String showOwnProfile(Model model, Authentication auth) {
        if (auth == null) {
            return "redirect:/login";
        }

        UserEntity currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return "redirect:/login";
        }

        model.addAttribute("followersCount", followService.getFollowersCount(currentUser.getId()));
        model.addAttribute("followingCount", followService.getFollowingCount(currentUser.getId()));
        return buildProfileView(currentUser, currentUser, model, true);
    }

    @GetMapping("/user/{username}")
    public String showUserProfile(@PathVariable String username, Model model, Authentication auth) {
        UserEntity targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен"));

        UserEntity currentUser = (auth != null) ? userService.getCurrentUser() : null;
        boolean isOwnProfile = currentUser != null && currentUser.getUsername().equals(username);

        model.addAttribute("followersCount", followService.getFollowersCount(targetUser.getId()));
        model.addAttribute("followingCount", followService.getFollowingCount(targetUser.getId()));
        return buildProfileView(targetUser, currentUser, model, isOwnProfile);
    }

    // ===== PROFILE VIEW BUILDER =====
    private String buildProfileView(UserEntity profileUser, UserEntity currentUser, Model model, boolean isOwnProfile) {
        List<EventSimpleViewDTO> userEvents = mainEventsService.getAllUserEvents(profileUser.getUsername());

        model.addAttribute("user", profileUser);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userEvents", userEvents);
        model.addAttribute("isOwnProfile", isOwnProfile);
        model.addAttribute("locations", Locations.values());

        // Calculate reputation
        int reputationScore = calculateReputation(profileUser);
        model.addAttribute("reputationScore", reputationScore);
        model.addAttribute("reputationBadge", getReputationBadge(reputationScore));

        return "unified-profile";
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

    @PostMapping("/profile/update")
    public String updateProfile(@RequestParam("profileImage") MultipartFile profileImage,
                                @RequestParam("location") Locations location,
                                @RequestParam("bio") String bio,
                                Authentication auth) throws IOException {

        if (auth == null) {
            return "redirect:/login";
        }

        try {
            Long userId = userService.getCurrentUser().getId();
            userService.updateUserProfile(userId, profileImage, bio, location);
            return "redirect:/profile";
        } catch (Exception e) {
            return "redirect:/profile?error=update_failed";
        }
    }

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
        int score = 0;
        score += (user.getUserEventsCount() * 10);
        score += (user.getTotalVotes() * 2);
        score += (user.getPublicationsCount() * 5);
        return Math.max(0, score);
    }

    private String getReputationBadge(int score) {
        if (score >= 1000) return "VIP Потребител";
        if (score >= 500) return "Експерт";
        if (score >= 200) return "Активен";
        if (score >= 50) return "Участник";
        return "Нов потребител";
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        return error;
    }
}