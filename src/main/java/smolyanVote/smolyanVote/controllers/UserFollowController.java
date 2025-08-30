package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.UserFollowMapper;
import smolyanVote.smolyanVote.viewsAndDTO.UserFollowDto;

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


    @Autowired
    public UserFollowController(FollowService followService,
                                UserService userService,
                                UserFollowMapper userFollowMapper) {
        this.followService = followService;
        this.userService = userService;
        this.userFollowMapper = userFollowMapper;
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
            // Вземи текущия потребител
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401)
                        .body(UserFollowDto.error("Трябва да влезете в профила си"));
            }

            // Изпълни follow операцията
            followService.followUser(currentUser.getId(), userId);

            // Създай response чрез mapper
            UserFollowDto response = userFollowMapper.createFollowResponse(currentUser, userId, "followed");

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
}