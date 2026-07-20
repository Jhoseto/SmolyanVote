package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationStatSummaryResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationsLastActivityResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.PublicationsSidebarStatsResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.TopAuthorResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.TopAuthorsResponse;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.TrendingTopicResponse;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

/**
 * Read-only widgets за дясната лента на `/publications` (MODERN_FRONTEND_PLAN.md
 * Фаза 4 "Right sidebar widgets") — тънък порт на `PublicationsController`'s
 * "RIGHT SIDEBAR ENDPOINTS" секция, без бизнес логика тук (тя си остава в
 * {@link PublicationService}); всичко е публично (виж `ApplicationSecurityConfiguration`
 * — `GET /api/v1/publications/**` е `permitAll`), както в legacy.
 */
@RestController
@RequestMapping("/api/v1/publications/sidebar")
public class PublicationsSidebarController {

    private final PublicationService publicationService;
    private final UserService userService;
    private final FollowService followService;
    private final PublicationRepository publicationRepository;

    public PublicationsSidebarController(PublicationService publicationService,
                                                UserService userService,
                                                FollowService followService,
                                                PublicationRepository publicationRepository) {
        this.publicationService = publicationService;
        this.userService = userService;
        this.followService = followService;
        this.publicationRepository = publicationRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<PublicationsSidebarStatsResponse> stats() {
        return ResponseEntity.ok(new PublicationsSidebarStatsResponse(
                publicationService.getTotalCount(),
                publicationService.getTodayCount(),
                publicationService.getWeekCount(),
                userService.getOnlineUsersCount()));
    }

    @GetMapping("/top-authors")
    public ResponseEntity<TopAuthorsResponse> topAuthors(Authentication auth) {
        List<Map<String, Object>> authorsData =
                publicationService.getTopAuthorsData(startOfDay(), 5);

        UserEntity currentUser = currentUser(auth);

        List<TopAuthorResponse> authors = authorsData.stream()
                .map(a -> {
                    Long id = (Long) a.get("id");
                    boolean isFollowing = currentUser != null && followService.isFollowing(currentUser.getId(), id);
                    return new TopAuthorResponse(id, (String) a.get("username"), (String) a.get("imageUrl"),
                            (Long) a.get("publicationsCount"), isFollowing);
                })
                .toList();

        return ResponseEntity.ok(new TopAuthorsResponse(authors));
    }

    @GetMapping("/trending")
    public ResponseEntity<List<TrendingTopicResponse>> trending() {
        List<TrendingTopicResponse> topics = publicationService.getTrendingHashtags().stream()
                .map(row -> new TrendingTopicResponse(String.valueOf(row[0]), ((Number) row[1]).longValue()))
                .toList();
        return ResponseEntity.ok(topics);
    }

    @GetMapping("/last-activity")
    public ResponseEntity<PublicationsLastActivityResponse> lastActivity() {
        PublicationEntity lastPost = publicationService.getLastPublishedPost();
        if (lastPost == null) {
            return ResponseEntity.ok(PublicationsLastActivityResponse.empty());
        }
        return ResponseEntity.ok(new PublicationsLastActivityResponse(
                lastPost.getCreated(), lastPost.getId(), lastPost.getTitle(),
                lastPost.getAuthor().getUsername(), lastPost.getAuthor().getImageUrl(),
                lastPost.getLikesCount(), lastPost.getCommentsCount()));
    }

    @GetMapping("/most-commented")
    public ResponseEntity<PublicationStatSummaryResponse> mostCommented() {
        PublicationEntity post = publicationService.getMostCommentedPostToday(startOfDay());
        return ResponseEntity.ok(toStatSummary(post));
    }

    @GetMapping("/top-viewed")
    public ResponseEntity<List<PublicationStatSummaryResponse>> topViewed() {
        List<PublicationEntity> posts = publicationRepository.findTopByOrderByViewsCountDesc(
                startOfDay(), PageRequest.of(0, 3));
        return ResponseEntity.ok(posts.stream().map(this::toStatSummary).toList());
    }

    private PublicationStatSummaryResponse toStatSummary(PublicationEntity post) {
        if (post == null) {
            return new PublicationStatSummaryResponse(null, null, 0, 0, 0, null, null, null);
        }
        return new PublicationStatSummaryResponse(post.getId(), post.getTitle(), post.getCommentsCount(),
                post.getViewsCount(), post.getLikesCount(), post.getAuthor().getId(),
                post.getAuthor().getUsername(), post.getAuthor().getImageUrl());
    }

    private Instant startOfDay() {
        return LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
    }

    private UserEntity currentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userService.getCurrentUser();
    }
}
