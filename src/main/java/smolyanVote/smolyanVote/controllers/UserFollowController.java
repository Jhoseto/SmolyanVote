package smolyanVote.smolyanVote.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserFollowRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.UserFollowMapper;
import smolyanVote.smolyanVote.viewsAndDTO.UserFollowDto;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller за user follow/unfollow операции
 * Използва UserFollowDto вместо Map<String, Object>
 */
@RestController
@RequestMapping("/api/follow")
public class UserFollowController {

    private final FollowService followService;
    private final UserService userService;
    private final UserFollowMapper userFollowMapper;
    private final UserFollowRepository userFollowRepository;


    public UserFollowController(FollowService followService,
                                UserService userService,
                                UserFollowMapper userFollowMapper,
                                UserFollowRepository userFollowRepository) {
        this.followService = followService;
        this.userService = userService;
        this.userFollowMapper = userFollowMapper;
        this.userFollowRepository = userFollowRepository;
    }

    /**
     * Follow потребител
     * POST /api/follow/{userId}
     */
    @PostMapping("/{userId}")
    public ResponseEntity<UserFollowDto> followUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                System.err.println("Current user is null!"); // debug лог
                return ResponseEntity.status(401)
                        .body(UserFollowDto.error("Трябва да влезете в профила си"));
            }

            System.out.println("Current user: " + currentUser.getUsername() + " id=" + currentUser.getId());
            System.out.println("Trying to follow userId=" + userId);

            followService.followUser(currentUser.getId(), userId);

            UserFollowDto response = userFollowMapper.createFollowResponse(currentUser, userId, "followed");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            System.err.println("IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(UserFollowDto.error(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // ще покаже точния stack trace на 500
            return ResponseEntity.internalServerError()
                    .body(UserFollowDto.error("Възникна неочаквана грешка"));
        }
    }


    /**
     * Unfollow потребител
     * DELETE /api/follow/{userId}
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<UserFollowDto> unfollowUser(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            // Вземи текущия потребител
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401)
                        .body(UserFollowDto.error("Трябва да влезете в профила си"));
            }

            // Изпълни unfollow операцията
            followService.unfollowUser(currentUser.getId(), userId);

            // Създай response чрез mapper
            UserFollowDto response = userFollowMapper.createFollowResponse(currentUser, userId, "unfollowed");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(UserFollowDto.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(UserFollowDto.error("Възникна неочаквана грешка"));
        }
    }

    /**
     * Проверка на follow статус
     * GET /api/follow/{userId}/status
     */
    @GetMapping("/{userId}/status")
    public ResponseEntity<UserFollowDto> getFollowStatus(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {

        try {
            UserEntity currentUser = userService.getCurrentUser();

            UserFollowDto response = userFollowMapper.createStatusResponse(currentUser, userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(UserFollowDto.error("Възникна грешка при проверката на статуса"));
        }
    }

    /**
     * Статистики за потребител (публичен endpoint)
     * GET /api/follow/{userId}/stats
     */
    @GetMapping("/{userId}/stats")
    public ResponseEntity<UserFollowDto> getUserStats(@PathVariable Long userId) {

        try {
            UserFollowDto response = userFollowMapper.createStatsResponse(userId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(UserFollowDto.error("Възникна грешка при зареждането на статистиките"));
        }
    }

    /**
     * Списък последователи на потребител
     * GET /api/follow/{userId}/followers?page=0&size=20&search=
     */
    @GetMapping("/{userId}/followers")
    public ResponseEntity<Map<String, Object>> getFollowers(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {

        try {
            List<Object[]> followers;

            if (search != null && !search.trim().isEmpty()) {
                followers = followService.searchFollowers(userId, search, page, size);
            } else {
                followers = followService.getFollowers(userId, page, size);
            }

            // Добавяме информация за follow статус на текущия потребител
            UserEntity currentUser = userService.getCurrentUser();
            List<Long> followingIds = new ArrayList<>();

            if (currentUser != null && !followers.isEmpty()) {
                List<Long> userIds = followers.stream()
                        .map(row -> (Long) row[0])
                        .collect(Collectors.toList());
                followingIds = userFollowRepository.findFollowingUserIds(currentUser.getId(), userIds);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", followers);
            response.put("currentPage", page);
            response.put("pageSize", size);
            response.put("hasNext", followers.size() == size);
            response.put("followingIds", followingIds);
            response.put("searchTerm", search);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Грешка при зареждане на последователите");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Списък следвани от потребител
     * GET /api/follow/{userId}/following?page=0&size=20&search=
     */
    @GetMapping("/{userId}/following")
    public ResponseEntity<Map<String, Object>> getFollowing(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {

        try {
            List<Object[]> following;

            if (search != null && !search.trim().isEmpty()) {
                following = followService.searchFollowing(userId, search, page, size);
            } else {
                following = followService.getFollowing(userId, page, size);
            }

            // Добавяме информация за follow статус на текущия потребител
            UserEntity currentUser = userService.getCurrentUser();
            List<Long> followingIds = new ArrayList<>();

            if (currentUser != null && !following.isEmpty()) {
                List<Long> userIds = following.stream()
                        .map(row -> (Long) row[0])
                        .collect(Collectors.toList());
                followingIds = userFollowRepository.findFollowingUserIds(currentUser.getId(), userIds);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", following);
            response.put("currentPage", page);
            response.put("pageSize", size);
            response.put("hasNext", following.size() == size);
            response.put("followingIds", followingIds);
            response.put("searchTerm", search);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Грешка при зареждане на следваните");
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}