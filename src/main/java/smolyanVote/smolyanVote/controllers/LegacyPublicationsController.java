package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.services.serviceImpl.ImageCloudinaryServiceImpl;
import smolyanVote.smolyanVote.repositories.PublicationRepository;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/publications")
public class LegacyPublicationsController {

    private final PublicationService publicationService;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageService;
    private final PublicationDetailService publicationDetailService;
    private final ReportsService reportsService;
    private final CommentsService commentsService;
    private final FollowService followService;  // <-- Ð”ÐžÐ‘ÐÐ’Ð˜ ÐŸÐžÐ›Ð•
    private final PublicationRepository publicationRepository;
    private final ActivityLogService activityLogService;

    public LegacyPublicationsController(PublicationService publicationService,
                                  UserService userService,
                                  ImageCloudinaryServiceImpl imageService,
                                  PublicationDetailService publicationDetailService, 
                                  ReportsService reportsService, 
                                  CommentsService commentsService,
                                  FollowService followService,
                                  PublicationRepository publicationRepository,
                                  ActivityLogService activityLogService) {  // <-- Ð”ÐžÐ‘ÐÐ’Ð˜ ÐŸÐÐ ÐÐœÐ•Ð¢ÐªÐ 
        this.publicationService = publicationService;
        this.userService = userService;
        this.imageService = imageService;
        this.publicationDetailService = publicationDetailService;
        this.reportsService = reportsService;
        this.commentsService = commentsService;
        this.followService = followService;  // <-- Ð”ÐžÐ‘ÐÐ’Ð˜ ÐŸÐ Ð˜Ð¡Ð’ÐžÐ¯Ð’ÐÐÐ•
        this.publicationRepository = publicationRepository;
        this.activityLogService = activityLogService;
    }

    // ====== REST API ENDPOINTS ======
    // Page HTML + OG share templates live in Next.js (/publications).

    @GetMapping(value = "/api", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getPublicationsAPI(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "date-desc") String sort,
            @RequestParam(defaultValue = "") String time,
            @RequestParam(defaultValue = "") String author,
            @RequestParam(required = false) String userIds,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {

        try {
            page = Math.max(0, page);
            size = Math.min(Math.max(1, size), 50);

            // Parse userIds parameter
            List<Long> authorIds = null;
            if (userIds != null && !userIds.trim().isEmpty()) {
                try {
                    authorIds = Arrays.stream(userIds.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Long::parseLong)
                        .collect(Collectors.toList());
                } catch (NumberFormatException e) {
                    // Ignore invalid userIds
                    authorIds = null;
                }
            }

            Pageable pageable = createPageable(page, size, sort);
            Page<PublicationEntity> publicationsPage = publicationService.findWithFilters(
                    search, category, status, time, author, authorIds, pageable, auth
            );

            // âœ… Ð›ÐžÐ“Ð˜Ð ÐÐÐ• ÐÐ SEARCH_CONTENT / FILTER_CONTENT
            try {
                UserEntity currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    boolean hasSearch = search != null && !search.trim().isEmpty();
                    boolean hasFilters = (category != null && !category.trim().isEmpty()) 
                            || (status != null && !status.trim().isEmpty()) 
                            || (time != null && !time.trim().isEmpty()) 
                            || (author != null && !author.trim().isEmpty())
                            || (authorIds != null && !authorIds.isEmpty());
                    
                    if (hasSearch) {
                        String ipAddress = extractIpAddress();
                        String userAgent = extractUserAgent();
                        String details = String.format("Search query: \"%s\"%s", 
                                search.length() > 100 ? search.substring(0, 100) + "..." : search,
                                hasFilters ? " (with filters)" : "");
                        activityLogService.logActivity(ActivityActionEnum.SEARCH_CONTENT, currentUser,
                                null, null, details, ipAddress, userAgent);
                    } else if (hasFilters) {
                        String ipAddress = extractIpAddress();
                        String userAgent = extractUserAgent();
                        StringBuilder filterDetails = new StringBuilder("Filters: ");
                        if (category != null && !category.trim().isEmpty()) filterDetails.append("category=").append(category).append(", ");
                        if (status != null && !status.trim().isEmpty()) filterDetails.append("status=").append(status).append(", ");
                        if (time != null && !time.trim().isEmpty()) filterDetails.append("time=").append(time).append(", ");
                        if (author != null && !author.trim().isEmpty()) filterDetails.append("author=").append(author).append(", ");
                        if (authorIds != null && !authorIds.isEmpty()) filterDetails.append("authorIds=").append(authorIds.size()).append(" users");
                        String details = filterDetails.toString().replaceAll(", $", "");
                        activityLogService.logActivity(ActivityActionEnum.FILTER_CONTENT, currentUser,
                                null, null, details, ipAddress, userAgent);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to log search/filter activity: " + e.getMessage());
            }

            //  commentsCount Ð·Ð° Ð²ÑÐ¸Ñ‡ÐºÐ¸ Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ð¸
            List<PublicationEntity> publications = publicationsPage.getContent();
            commentsService.fillCommentsCountsForAllPublications(publications);

            Map<String, Object> response = new HashMap<>();
            response.put("publications", publicationsPage.getContent());
            response.put("totalElements", publicationsPage.getTotalElements());


            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ð¸Ñ‚Ðµ", page));
        }
    }



    @PostMapping(value = "/api", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createPublication(
            @RequestBody PublicationRequestDTO request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            PublicationEntity publication = publicationService.create(request, user);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("id", publication.getId());
            response.put("title", publication.getTitle());
            response.put("content", publication.getContent());
            response.put("excerpt", publication.getExcerpt());
            response.put("category", publication.getCategory());
            response.put("emotion", publication.getEmotion());
            response.put("emotionText", publication.getEmotionText());
            response.put("imageUrl", publication.getImageUrl());
            response.put("status", publication.getStatus());
            response.put("createdAt", publication.getCreated());
            response.put("likesCount", publication.getLikesCount());
            response.put("dislikesCount", publication.getDislikesCount());
            response.put("commentsCount", publication.getCommentsCount());
            response.put("sharesCount", publication.getSharesCount());

            // Ð”Ð¾Ð±Ð°Ð²Ð¸ author Ð´Ð°Ð½Ð½Ð¸Ñ‚Ðµ
            Map<String, Object> authorData = new HashMap<>();
            authorData.put("id", publication.getAuthor().getId());
            authorData.put("username", publication.getAuthor().getUsername());
            authorData.put("imageUrl", publication.getAuthor().getImageUrl());
            response.put("author", authorData);

            response.put("message", "ÐŸÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð° Ðµ ÑÑŠÐ·Ð´Ð°Ð´ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");

            System.out.println("âœ… Response Ð³Ð¾Ñ‚Ð¾Ð², Ð²Ñ€ÑŠÑ‰Ð°Ð¼ Ñ€ÐµÐ·ÑƒÐ»Ñ‚Ð°Ñ‚");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            System.err.println("âŒ RuntimeException Ð² ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»ÐµÑ€Ð°: " + e.getMessage());
            e.printStackTrace();

            // Ð—ÐÐ©Ð˜Ð¢Ð: Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð½Ð¾ handling Ð·Ð° rate limiting
            if (e.getMessage().contains("Ð¼Ð¸Ð½ÑƒÑ‚Ð°")) {
                return ResponseEntity.status(429).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð°: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("âŒ Exception Ð² ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»ÐµÑ€Ð°: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð°: " + e.getMessage()));
        }
    }

    // ====== IMAGE UPLOAD ENDPOINT ======

    @PostMapping(value = "/api/upload/image", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("image") MultipartFile file,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.status(400).body(createErrorResponse("ÐÐµ Ðµ Ð¸Ð·Ð±Ñ€Ð°Ð½ Ñ„Ð°Ð¹Ð»"));
            }

            if (file.getSize() > 10 * 1024 * 1024) { // 10MB
                return ResponseEntity.status(400).body(createErrorResponse("Ð¤Ð°Ð¹Ð»ÑŠÑ‚ Ðµ Ñ‚Ð²ÑŠÑ€Ð´Ðµ Ð³Ð¾Ð»ÑÐ¼ (Ð¼Ð°ÐºÑÐ¸Ð¼ÑƒÐ¼ 10MB)"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(400).body(createErrorResponse("Ð¤Ð°Ð¹Ð»ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¸Ð·Ð¾Ð±Ñ€Ð°Ð¶ÐµÐ½Ð¸Ðµ"));
            }

            // ðŸ›¡ï¸ ÐšÐÐ§Ð’ÐÐœÐ• Ð¡ÐªÐ¡ ÐœÐžÐ”Ð•Ð ÐÐ¦Ð˜Ð¯
            UserEntity user = userService.getCurrentUser();
            String imageUrl = imageService.savePublicationImage(file, user.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", imageUrl);
            response.put("message", "Ð¡Ð½Ð¸Ð¼ÐºÐ°Ñ‚Ð° Ðµ ÐºÐ°Ñ‡ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÐºÐ°Ñ‡Ð²Ð°Ð½Ðµ Ð½Ð° ÑÐ½Ð¸Ð¼ÐºÐ°"));
        }
    }

    @GetMapping(value = "/api/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<PublicationEntity> getPublicationAPI(@PathVariable Long id, Authentication auth) {
        try {
            PublicationEntity publication = publicationService.findById(id);
            if (publication == null) {
                return ResponseEntity.notFound().build();
            }

            if (!publicationService.canViewPublication(publication, auth)) {
                return ResponseEntity.status(403).build();
            }

            return ResponseEntity.ok(publication);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping(value = "/api/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updatePublication(
            @PathVariable Long id,
            @RequestBody PublicationRequestDTO request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            PublicationEntity publication = publicationService.findById(id);
            if (publication == null) {
                return ResponseEntity.status(404).body(createErrorResponse("ÐŸÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð° Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°"));
            }

            if (!publicationService.canEditPublication(publication, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("ÐÑÐ¼Ð°Ñ‚Ðµ Ð¿Ñ€Ð°Ð²Ð° Ð·Ð° Ñ€ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ñ‚Ð°Ð·Ð¸ Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
            }

            publicationService.update(publication, request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "ÐŸÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð° Ðµ Ð¾Ð±Ð½Ð¾Ð²ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð°"));
        }
    }

    @DeleteMapping(value = "/api/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deletePublication(
            @PathVariable Long id,
            Authentication auth) {

        if (auth != null) {
            System.out.println("User: " + auth.getName());
        }

        if (auth == null) {
            System.out.println("ERROR: Authentication is null");
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            PublicationEntity publication = publicationService.findById(id);

            if (publication == null) {
                System.out.println("ERROR: Publication not found with ID: " + id);
                return ResponseEntity.status(404).body(createErrorResponse("ÐŸÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð° Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°"));
            }

            if (!publicationService.canEditPublication(publication, auth)) {
                System.out.println("ERROR: User doesn't have edit permissions");
                return ResponseEntity.status(403).body(createErrorResponse("ÐÑÐ¼Ð°Ñ‚Ðµ Ð¿Ñ€Ð°Ð²Ð° Ð·Ð° Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° Ñ‚Ð°Ð·Ð¸ Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
            }

            publicationService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "ÐŸÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð° Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            System.err.println("=== DELETE PUBLICATION ERROR ===");
            System.err.println("Exception type: " + e.getClass().getName());
            System.err.println("Exception message: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            System.err.println("=== END ERROR ===");

            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð°: " + e.getMessage()));
        }
    }

    // ====== INTERACTION ENDPOINTS ======

    @PostMapping(value = "/api/{id}/like", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            boolean isLiked = publicationService.toggleLike(id, user);
            int likesCount = publicationService.getLikesCount(id);
            int dislikesCount = publicationService.getDislikesCount(id);

            Map<String, Object> response = new HashMap<>();
            response.put("isLiked", isLiked);
            response.put("likesCount", likesCount);
            response.put("dislikesCount", dislikesCount);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ñ…Ð°Ñ€ÐµÑÐ²Ð°Ð½ÐµÑ‚Ð¾"));
        }
    }

    @PostMapping(value = "/api/{id}/dislike", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleDislike(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            boolean isDisliked = publicationService.toggleDislike(id, user);
            int likesCount = publicationService.getLikesCount(id);
            int dislikesCount = publicationService.getDislikesCount(id);

            Map<String, Object> response = new HashMap<>();
            response.put("isDisliked", isDisliked);
            response.put("likesCount", likesCount);
            response.put("dislikesCount", dislikesCount);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð´Ð¸ÑÐ»Ð°Ð¹ÐºÐ²Ð°Ð½ÐµÑ‚Ð¾"));
        }
    }

    // ====== REACTION USERS ======

    @GetMapping(value = "/api/{id}/liked-users", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getLikedUsers(@PathVariable Long id) {
        try {
            List<smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO> users = publicationService.getLikedUsers(id);
            Map<String, Object> response = new HashMap<>();
            response.put("users", users);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»Ð¸Ñ‚Ðµ"));
        }
    }

    @GetMapping(value = "/api/{id}/disliked-users", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getDislikedUsers(@PathVariable Long id) {
        try {
            List<smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO> users = publicationService.getDislikedUsers(id);
            Map<String, Object> response = new HashMap<>();
            response.put("users", users);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»Ð¸Ñ‚Ðµ"));
        }
    }

    @PostMapping(value = "/api/{id}/followPublication", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            boolean isBookmarked = publicationService.toggleBookmark(id, user);

            Map<String, Object> response = new HashMap<>();
            response.put("isBookmarked", isBookmarked);
            response.put("message", isBookmarked ? "Ð”Ð¾Ð±Ð°Ð²ÐµÐ½Ð¾ ÑÐ° Ð¸Ð·Ð²ÐµÑÑ‚Ð¸Ñ Ð¾Ñ‚Ð½Ð¾ÑÐ½Ð¾ Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸Ð°Ñ‚Ð°" : "ÐŸÑ€ÐµÐ¼Ð°Ñ…Ð½Ð°Ñ‚Ð¸ ÑÐ° Ð¸Ð·Ð²ÐµÑÑ‚Ð¸ÑÑ‚Ð° Ð·Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð°");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ bookmark-Ð²Ð°Ð½ÐµÑ‚Ð¾"));
        }
    }

    @PostMapping(value = "/api/{id}/share", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> sharePublication(@PathVariable Long id) {
        try {
            publicationService.incrementShareCount(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sharesCount", publicationService.getSharesCount(id));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÐ¿Ð¾Ð´ÐµÐ»ÑÐ½ÐµÑ‚Ð¾"));
        }
    }

    

    // ====== USER PREFERENCES ENDPOINT ======

    @GetMapping(value = "/api/user/preferences", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserPreferences(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            String username = user.getUsername();

            Map<String, Object> preferences = new HashMap<>();

            // Ð˜Ð·Ð²Ð»Ð¸Ñ‡Ð°Ð¼Ðµ Ñ€ÐµÐ°Ð»Ð½Ð¸Ñ‚Ðµ Ð´Ð°Ð½Ð½Ð¸ Ð½Ð° Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»Ñ
            List<Long> likedPosts = publicationService.getLikedPublicationIdsByUsername(username);
            List<Long> dislikedPosts = publicationService.getDislikedPublicationIdsByUsername(username);
            List<Long> bookmarkedPosts = publicationService.getBookmarkedPublicationIdsByUsername(username);
            List<Long> followedAuthors = List.of(); // Ð—Ð° ÑÐµÐ³Ð° Ð¿Ñ€Ð°Ð·ÐµÐ½, Ð½ÑÐ¼Ð° follow ÑÐ¸ÑÑ‚ÐµÐ¼Ð°

            preferences.put("likedPosts", likedPosts);
            preferences.put("dislikedPosts", dislikedPosts);
            preferences.put("bookmarkedPosts", bookmarkedPosts);
            preferences.put("followedAuthors", followedAuthors);

            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿Ñ€ÐµÐ´Ð¿Ð¾Ñ‡Ð¸Ñ‚Ð°Ð½Ð¸ÑÑ‚Ð°"));
        }
    }

    // ====== DATA ENDPOINTS ======

    @GetMapping(value = "/api/statistics", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalPublications", publicationService.getTotalCount());
            stats.put("todayPublications", publicationService.getTodayCount());
            stats.put("weekPublications", publicationService.getWeekCount());
            stats.put("monthPublications", publicationService.getMonthCount());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            Map<String, Object> errorStats = new HashMap<>();
            errorStats.put("totalPublications", 0);
            errorStats.put("todayPublications", 0);
            errorStats.put("weekPublications", 0);
            errorStats.put("monthPublications", 0);
            errorStats.put("activeUsers", 0);
            return ResponseEntity.status(500).body(errorStats);
        }
    }

    @GetMapping(value = "/api/trending", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getTrendingTopics() {
        try {
            List<Map<String, Object>> trending = publicationService.getTrendingTopics();
            return ResponseEntity.ok(trending);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of());
        }
    }

    @GetMapping(value = "/api/authors/active", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<UserEntity>> getActiveAuthors() {
        try {
            List<UserEntity> authors = publicationService.getActiveAuthors(10);
            return ResponseEntity.ok(authors);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of());
        }
    }

    // ===== RIGHT SIDEBAR ENDPOINTS =====

    @GetMapping(value = "/api/sidebar/stats", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSidebarStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalPublications", publicationService.getTotalCount());
        stats.put("todayPublications", publicationService.getTodayCount());
        stats.put("weekPublications", publicationService.getWeekCount());
        stats.put("onlineUsers", userService.getOnlineUsersCount());
        return ResponseEntity.ok(stats);
    }

    @GetMapping(value = "/api/sidebar/top-authors", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSidebarTopAuthors(Authentication auth) {
        try {
            // Ð’Ð·ÐµÐ¼Ð¸ Ñ‚Ð¾Ð¿ 5 Ð°Ð²Ñ‚Ð¾Ñ€Ð¸ Ð¾Ñ‚ Ð´Ð½ÐµÑ
            Instant startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
            List<Map<String, Object>> authorsData = publicationService.getTopAuthorsData(startOfDay, 5);
            
            // Ð’Ð·ÐµÐ¼Ð¸ ÑÐ¿Ð¸ÑÑŠÐº Ñ ÑÐ»ÐµÐ´Ð²Ð°Ð½Ð¸ Ð°Ð²Ñ‚Ð¾Ñ€Ð¸ (Ð°ÐºÐ¾ Ðµ Ð»Ð¾Ð³Ð½Ð°Ñ‚)
            List<Long> followingIds = new ArrayList<>();
            if (auth != null && auth.isAuthenticated()) {
                UserEntity currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    followingIds = authorsData.stream()
                        .map(a -> (Long) a.get("id"))
                        .filter(authorId -> followService.isFollowing(currentUser.getId(), authorId))
                        .collect(Collectors.toList());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("authors", authorsData);
            response.put("followingIds", followingIds);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("authors", List.of(), "followingIds", List.of()));
        }
    }

    @GetMapping(value = "/api/sidebar/trending", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getSidebarTrending() {
        List<Object[]> trending = publicationService.getTrendingHashtags();
        return ResponseEntity.ok(trending.stream().map(row -> {
            Map<String, Object> m = new HashMap<>();
            m.put("topic", row[0]);
            m.put("count", row[1]);
            return m;
        }).collect(Collectors.toList()));
    }

    @GetMapping(value = "/api/sidebar/last-activity", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSidebarLastActivity() {
        Map<String, Object> activity = new HashMap<>();
        
        PublicationEntity lastPost = publicationService.getLastPublishedPost();
        if (lastPost != null) {
            activity.put("lastPostTime", lastPost.getCreated());
            activity.put("lastPostId", lastPost.getId());
            activity.put("lastPostTitle", lastPost.getTitle());
            activity.put("lastPostAuthor", lastPost.getAuthor().getUsername());
            activity.put("lastPostAuthorImage", lastPost.getAuthor().getImageUrl());
            activity.put("lastPostLikes", lastPost.getLikesCount());
            activity.put("lastPostComments", lastPost.getCommentsCount());
        }
        
        return ResponseEntity.ok(activity);
    }

    @GetMapping(value = "/api/sidebar/most-commented", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSidebarMostCommented() {
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        PublicationEntity post = publicationService.getMostCommentedPostToday(startOfDay);
        
        if (post == null) {
            return ResponseEntity.ok(new HashMap<>());
        }
        
        Map<String, Object> m = new HashMap<>();
        m.put("id", post.getId());
        m.put("title", post.getTitle());
        m.put("commentsCount", post.getCommentsCount());
        m.put("likesCount", post.getLikesCount());
        m.put("authorId", post.getAuthor().getId());
        m.put("authorName", post.getAuthor().getUsername());
        m.put("authorImage", post.getAuthor().getImageUrl());
        
        return ResponseEntity.ok(m);
    }

    @GetMapping(value = "/api/sidebar/most-viewed", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getSidebarMostViewed() {
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        PublicationEntity post = publicationService.getMostViewedPostToday(startOfDay);
        
        if (post == null) {
            return ResponseEntity.ok(new HashMap<>());
        }
        
        Map<String, Object> m = new HashMap<>();
        m.put("id", post.getId());
        m.put("title", post.getTitle());
        m.put("viewsCount", post.getViewsCount());
        m.put("likesCount", post.getLikesCount());
        m.put("authorId", post.getAuthor().getId());
        m.put("authorName", post.getAuthor().getUsername());
        m.put("authorImage", post.getAuthor().getImageUrl());
        
        return ResponseEntity.ok(m);
    }

    @GetMapping(value = "/api/sidebar/top-viewed", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getSidebarTopViewed() {
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
        List<PublicationEntity> posts = publicationRepository.findTopByOrderByViewsCountDesc(
            startOfDay, org.springframework.data.domain.PageRequest.of(0, 3));
        
        List<Map<String, Object>> result = posts.stream().map(post -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", post.getId());
            m.put("title", post.getTitle());
            m.put("viewsCount", post.getViewsCount());
            m.put("likesCount", post.getLikesCount());
            m.put("authorId", post.getAuthor().getId());
            m.put("authorName", post.getAuthor().getUsername());
            m.put("authorImage", post.getAuthor().getImageUrl());
            return m;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }


    // ====== HELPER METHODS ======

    private Pageable createPageable(int page, int size, String sort) {
        Sort sortObj = Sort.by(Sort.Direction.DESC, "created");

        switch (sort) {
            case "date-asc":
                sortObj = Sort.by(Sort.Direction.ASC, "created");
                break;
            case "likes":
                sortObj = Sort.by(Sort.Direction.DESC, "likesCount");
                break;
            case "dislikes":
                sortObj = Sort.by(Sort.Direction.ASC, "dislikesCount");
                break;
            case "views":
                sortObj = Sort.by(Sort.Direction.DESC, "viewsCount");
                break;
            case "comments":
                sortObj = Sort.by(Sort.Direction.DESC, "commentsCount");
                break;
            default:
                break;
        }

        return PageRequest.of(page, size, sortObj);
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }

    private Map<String, Object> createErrorResponse(String message, int page) {
        Map<String, Object> response = createErrorResponse(message);
        response.put("publications", List.of());
        response.put("totalElements", 0);
        response.put("totalPages", 0);
        response.put("currentPage", page);
        response.put("hasNext", false);
        response.put("hasPrevious", false);
        return response;
    }

    // ====== PUBLICATION DETAIL API ======

    @GetMapping(value = "/detail/api/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<?> getPublicationDetail(
            @PathVariable Long id,
            Authentication auth) {

        try {
            PublicationResponseDTO dto = publicationDetailService.getPublicationForModal(id, auth);

            // Wrap in success response for consistency with existing API
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("publication", dto);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð°")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("Ð¿Ñ€Ð°Ð²Ð°")) {
                return ResponseEntity.status(403).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(500).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½ÐµÑ‚Ð¾ Ð½Ð° Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ†Ð¸ÑÑ‚Ð°"));
        }
    }


    // ===== HELPER METHODS FOR ACTIVITY LOGGING =====

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
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
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String userAgent = request.getHeader("User-Agent");
                    return userAgent != null ? userAgent : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

}