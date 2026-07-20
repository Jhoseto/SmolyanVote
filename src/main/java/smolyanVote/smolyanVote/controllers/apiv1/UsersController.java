package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.UserFollowRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.interfaces.SignalsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.*;

import java.io.IOException;
import java.util.List;

/**
 * Тънък JSON контролер за публичния профил (MODERN_FRONTEND_PLAN.md Фаза 7)
 * — порт на legacy `UserController`'s `/profile`, `/user/{username}`,
 * `/profile/api/**`, `/user/{id}/api/**`, `/profile/update/ajax`, съответно
 * `UserFollowController`'s `/api/follow/{id}/followers|following` (същите
 * {@link FollowService} методи, само типизиран отговор вместо {@code Object[]}
 * редове). Публикациите на профила reuse-ват директно съществуващия
 * {@code GET /api/v1/publications?userIds=} (Фаза 4) — не е дублирано тук.
 */
@RestController
@RequestMapping("/api/v1/users")
public class UsersController {

    private final UserService userService;
    private final FollowService followService;
    private final UserFollowRepository userFollowRepository;
    private final MainEventsService mainEventsService;
    private final SignalsService signalsService;

    public UsersController(UserService userService,
                                 FollowService followService,
                                 UserFollowRepository userFollowRepository,
                                 MainEventsService mainEventsService,
                                 SignalsService signalsService) {
        this.userService = userService;
        this.followService = followService;
        this.userFollowRepository = userFollowRepository;
        this.mainEventsService = mainEventsService;
        this.signalsService = signalsService;
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> me() {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(CurrentUserResponse.fromEntity(user));
    }

    @GetMapping("/{username}")
    public ResponseEntity<?> profile(@PathVariable String username, Authentication auth) {
        UserEntity profileUser = userService.findUserByUsername(username).orElse(null);
        if (profileUser == null) {
            return ResponseEntity.status(404).body(ApiMessageResponse.error("Потребителят не е намерен"));
        }

        UserEntity currentUser = currentUser(auth);
        boolean isOwnProfile = currentUser != null && currentUser.getId().equals(profileUser.getId());
        boolean isFollowing = !isOwnProfile && currentUser != null
                && followService.isFollowing(currentUser.getId(), profileUser.getId());

        long followersCount = followService.getFollowersCount(profileUser.getId());
        long followingCount = followService.getFollowingCount(profileUser.getId());

        return ResponseEntity.ok(PublicProfileDTO.from(profileUser, followersCount, followingCount, isFollowing, isOwnProfile));
    }

    @GetMapping("/{username}/events")
    public ResponseEntity<List<EventSimpleViewDTO>> events(@PathVariable String username) {
        if (userService.findUserByUsername(username).isEmpty()) {
            return ResponseEntity.status(404).build();
        }
        return ResponseEntity.ok(mainEventsService.getAllUserEvents(username));
    }

    @GetMapping("/{username}/signals")
    public ResponseEntity<List<SignalResponseDTO>> signals(@PathVariable String username, Authentication auth) {
        UserEntity profileUser = userService.findUserByUsername(username).orElse(null);
        if (profileUser == null) {
            return ResponseEntity.status(404).build();
        }

        UserEntity currentUser = currentUser(auth);
        // Repository query already orders by `created desc` (see `getSignalsByAuthor`).
        Pageable pageable = PageRequest.of(0, 200);
        Page<SignalsEntity> signals = signalsService.getSignalsByAuthor(profileUser.getId(), pageable);

        List<SignalResponseDTO> result = signals.getContent().stream()
                .map(signal -> SignalResponseDTO.from(signal, isLiked(signal, currentUser),
                        currentUser != null ? currentUser.getId() : null))
                .toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<FollowListResponse> followers(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            Authentication auth) {
        return followList(username, page, size, search, auth, true);
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<FollowListResponse> following(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            Authentication auth) {
        return followList(username, page, size, search, auth, false);
    }

    private ResponseEntity<FollowListResponse> followList(String username, int page, int size, String search,
                                                            Authentication auth, boolean followers) {
        UserEntity profileUser = userService.findUserByUsername(username).orElse(null);
        if (profileUser == null) {
            return ResponseEntity.status(404).build();
        }

        boolean hasSearch = search != null && !search.trim().isEmpty();
        List<Object[]> rows;
        if (followers) {
            rows = hasSearch
                    ? followService.searchFollowers(profileUser.getId(), search, page, size)
                    : followService.getFollowers(profileUser.getId(), page, size);
        } else {
            rows = hasSearch
                    ? followService.searchFollowing(profileUser.getId(), search, page, size)
                    : followService.getFollowing(profileUser.getId(), page, size);
        }

        UserEntity currentUser = currentUser(auth);
        List<Long> followingIds = List.of();
        if (currentUser != null && !rows.isEmpty()) {
            List<Long> rowIds = rows.stream().map(row -> (Long) row[0]).toList();
            followingIds = userFollowRepository.findFollowingUserIds(currentUser.getId(), rowIds);
        }
        List<Long> finalFollowingIds = followingIds;

        List<FollowUserSummaryDTO> items = rows.stream()
                .map(row -> FollowUserSummaryDTO.fromRow(row, finalFollowingIds.contains((Long) row[0])))
                .toList();

        return ResponseEntity.ok(FollowListResponse.of(items, page, size));
    }

    @PutMapping(value = "/me", consumes = "multipart/form-data")
    public ResponseEntity<?> updateMe(
            @RequestParam(required = false) MultipartFile avatar,
            @RequestParam(defaultValue = "") String bio,
            @RequestParam Locations location,
            Authentication auth) {
        UserEntity currentUser = currentUser(auth);
        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiMessageResponse.error("Необходима е автентикация"));
        }

        try {
            userService.updateUserProfile(currentUser.getId(), avatar, bio, location);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(ApiMessageResponse.error("Грешка при обновяване на профила"));
        }

        UserEntity updated = userService.getCurrentUser();
        long followersCount = followService.getFollowersCount(updated.getId());
        long followingCount = followService.getFollowingCount(updated.getId());
        return ResponseEntity.ok(PublicProfileDTO.from(updated, followersCount, followingCount, false, true));
    }

    private boolean isLiked(SignalsEntity signal, UserEntity currentUser) {
        return currentUser != null && signalsService.isLikedByUser(signal.getId(), currentUser.getUsername());
    }

    private UserEntity currentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userService.getCurrentUser();
    }
}
