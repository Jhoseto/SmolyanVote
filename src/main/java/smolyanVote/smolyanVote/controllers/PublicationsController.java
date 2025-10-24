package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.PublicationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.CategoryEnum;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.services.serviceImpl.ImageCloudinaryServiceImpl;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationResponseDTO;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/publications")
public class PublicationsController {

    private final PublicationService publicationService;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageService;
    private final PublicationDetailService publicationDetailService;
    private final ReportsService reportsService;
    private final CommentsService commentsService;

    @Autowired
    public PublicationsController(PublicationService publicationService,
                                  UserService userService,
                                  ImageCloudinaryServiceImpl imageService,
                                  PublicationDetailService publicationDetailService, ReportsService reportsService, CommentsService commentsService) {
        this.publicationService = publicationService;
        this.userService = userService;
        this.imageService = imageService;
        this.publicationDetailService = publicationDetailService;
        this.reportsService = reportsService;
        this.commentsService = commentsService;
    }

    // ====== MAIN PAGE ======
    @Transactional(readOnly = true)
    @GetMapping
    public String publicationsPage(Model model, Authentication auth) {
        try {
            if (auth != null && auth.isAuthenticated()) {
                UserEntity currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    model.addAttribute("currentUserId", currentUser.getId());
                    model.addAttribute("currentUser", currentUser);
                    model.addAttribute("currentUserImage", currentUser.getImageUrl());

                } else {
                    model.addAttribute("currentUserId", null);
                }
            } else {
                model.addAttribute("currentUserId", null);
            }

            // Статистики за филтрите
            model.addAttribute("totalPublications", publicationService.getTotalCount());
            model.addAttribute("newsCount", publicationService.getCountByCategory(CategoryEnum.NEWS));
            model.addAttribute("infrastructureCount", publicationService.getCountByCategory(CategoryEnum.INFRASTRUCTURE));
            model.addAttribute("municipalCount", publicationService.getCountByCategory(CategoryEnum.MUNICIPAL));
            model.addAttribute("initiativesCount", publicationService.getCountByCategory(CategoryEnum.INITIATIVES));
            model.addAttribute("cultureCount", publicationService.getCountByCategory(CategoryEnum.CULTURE));
            model.addAttribute("otherCount", publicationService.getCountByCategory(CategoryEnum.OTHER));

            // Допълнителни данни за страницата
            model.addAttribute("todayTopAuthors", publicationService.getActiveAuthors(5));
            model.addAttribute("todayPublications", publicationService.getTodayCount());
            model.addAttribute("weekPublications", publicationService.getWeekCount());
            model.addAttribute("activeUsers", 0);

        } catch (Exception e) {
            // Fallback values при грешка
            model.addAttribute("currentUserId", null);
            model.addAttribute("totalPublications", 0);
            model.addAttribute("newsCount", 0);
            model.addAttribute("infrastructureCount", 0);
            model.addAttribute("municipalCount", 0);
            model.addAttribute("initiativesCount", 0);
            model.addAttribute("cultureCount", 0);
            model.addAttribute("otherCount", 0);
            model.addAttribute("todayTopAuthors", List.of());
            model.addAttribute("todayPublications", 0);
            model.addAttribute("weekPublications", 0);
            model.addAttribute("activeUsers", 0);
        }

        return "publications";
    }



    // ====== REST API ENDPOINTS ======

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


            //  commentsCount за всички публикации
            List<PublicationEntity> publications = publicationsPage.getContent();
            commentsService.fillCommentsCountsForAllPublications(publications);

            Map<String, Object> response = new HashMap<>();
            response.put("publications", publicationsPage.getContent());
            response.put("totalElements", publicationsPage.getTotalElements());


            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждането на публикациите", page));
        }
    }



    @PostMapping(value = "/api", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> createPublication(
            @RequestBody PublicationRequestDTO request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
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

            // Добави author данните
            Map<String, Object> authorData = new HashMap<>();
            authorData.put("id", publication.getAuthor().getId());
            authorData.put("username", publication.getAuthor().getUsername());
            authorData.put("imageUrl", publication.getAuthor().getImageUrl());
            response.put("author", authorData);

            response.put("message", "Публикацията е създадена успешно");

            System.out.println("✅ Response готов, връщам резултат");
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            System.err.println("❌ RuntimeException в контролера: " + e.getMessage());
            e.printStackTrace();

            // ЗАЩИТА: Специално handling за rate limiting
            if (e.getMessage().contains("минута")) {
                return ResponseEntity.status(429).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при създаването на публикацията: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Exception в контролера: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при създаването на публикацията: " + e.getMessage()));
        }
    }

    // ====== IMAGE UPLOAD ENDPOINT ======

    @PostMapping(value = "/api/upload/image", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> uploadImage(
            @RequestParam("image") MultipartFile file,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.status(400).body(createErrorResponse("Не е избран файл"));
            }

            if (file.getSize() > 10 * 1024 * 1024) { // 10MB
                return ResponseEntity.status(400).body(createErrorResponse("Файлът е твърде голям (максимум 10MB)"));
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.status(400).body(createErrorResponse("Файлът трябва да е изображение"));
            }

            // 🛡️ КАЧВАМЕ СЪС МОДЕРАЦИЯ
            UserEntity user = userService.getCurrentUser();
            String imageUrl = imageService.savePublicationImage(file, user.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", imageUrl);
            response.put("message", "Снимката е качена успешно");

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при качване на снимка"));
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
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            PublicationEntity publication = publicationService.findById(id);
            if (publication == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Публикацията не е намерена"));
            }

            if (!publicationService.canEditPublication(publication, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за редактиране на тази публикация"));
            }

            publicationService.update(publication, request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Публикацията е обновена успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при обновяването на публикацията"));
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
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            PublicationEntity publication = publicationService.findById(id);

            if (publication == null) {
                System.out.println("ERROR: Publication not found with ID: " + id);
                return ResponseEntity.status(404).body(createErrorResponse("Публикацията не е намерена"));
            }

            if (!publicationService.canEditPublication(publication, auth)) {
                System.out.println("ERROR: User doesn't have edit permissions");
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за изтриване на тази публикация"));
            }

            publicationService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Публикацията е изтрита успешно");

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            System.err.println("=== DELETE PUBLICATION ERROR ===");
            System.err.println("Exception type: " + e.getClass().getName());
            System.err.println("Exception message: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            System.err.println("=== END ERROR ===");

            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при изтриването на публикацията: " + e.getMessage()));
        }
    }

    // ====== INTERACTION ENDPOINTS ======

    @PostMapping(value = "/api/{id}/like", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
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
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при харесването"));
        }
    }

    @PostMapping(value = "/api/{id}/dislike", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleDislike(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
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
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при дислайкването"));
        }
    }

    @PostMapping(value = "/api/{id}/followPublication", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @PathVariable Long id,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            boolean isBookmarked = publicationService.toggleBookmark(id, user);

            Map<String, Object> response = new HashMap<>();
            response.put("isBookmarked", isBookmarked);
            response.put("message", isBookmarked ? "Добавено са известия относно публикациата" : "Премахнати са известията за публикацията");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при bookmark-ването"));
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
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при споделянето"));
        }
    }


    // ====== FOLLOW/UNFOLLOW ENDPOINTS ======

    @PostMapping(value = "/api/users/{authorId}/follow", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleFollowAuthor(
            @PathVariable Long authorId,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();

            if (currentUser.getId().equals(authorId)) {
                return ResponseEntity.status(400).body(createErrorResponse("Не можете да следвате себе си"));
            }

            // TODO За сега симулираме follow/unfollow логиката
            // В бъдеще ще се имплементира правилно с UserFollowing entity
            boolean isFollowing = false; // Placeholder логика

            Map<String, Object> response = new HashMap<>();
            response.put("isFollowing", !isFollowing);
            response.put("message", !isFollowing ? "Сега следвате този автор" : "Не следвате този автор");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при следването"));
        }
    }

    // ====== USER PREFERENCES ENDPOINT ======

    @GetMapping(value = "/api/user/preferences", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUserPreferences(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            String username = user.getUsername();

            Map<String, Object> preferences = new HashMap<>();

            // Извличаме реалните данни на потребителя
            List<Long> likedPosts = publicationService.getLikedPublicationIdsByUsername(username);
            List<Long> dislikedPosts = publicationService.getDislikedPublicationIdsByUsername(username);
            List<Long> bookmarkedPosts = publicationService.getBookmarkedPublicationIdsByUsername(username);
            List<Long> followedAuthors = List.of(); // За сега празен, няма follow система

            preferences.put("likedPosts", likedPosts);
            preferences.put("dislikedPosts", dislikedPosts);
            preferences.put("bookmarkedPosts", bookmarkedPosts);
            preferences.put("followedAuthors", followedAuthors);

            return ResponseEntity.ok(preferences);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждането на предпочитанията"));
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
            if (e.getMessage().contains("не е намерена")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("права")) {
                return ResponseEntity.status(403).body(createErrorResponse(e.getMessage()));
            }
            return ResponseEntity.status(500).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждането на публикацията"));
        }
    }


    // ====== SHARE ======

    @GetMapping("/{id}")
    public String showPublicationWithOpenGraphForShare(
            @PathVariable Long id,
            Model model,
            Authentication auth,
            HttpServletRequest request) {

        try {
            PublicationResponseDTO publication = publicationDetailService.getPublicationForModal(id, auth);

            if (publication == null) {
                return "redirect:/publications";
            }

            String userAgent = request.getHeader("User-Agent");
            boolean isFacebookBot = userAgent != null && userAgent.contains("facebookexternalhit");

            if (isFacebookBot) {
                // ====== ЗА FACEBOOK BOT - ПОДГОТВИ OG ДАННИ ======

                String ogTitle = publication.getTitle();
                if (ogTitle == null || ogTitle.trim().isEmpty()) {
                    ogTitle = "Публикация от SmolyanVote";
                }

                String ogDescription = publication.getContent();
                if (ogDescription != null && ogDescription.length() > 160) {
                    ogDescription = ogDescription.substring(0, 160) + "...";
                }
                if (ogDescription == null) {
                    ogDescription = "Присъединете се към обсъждането в SmolyanVote.";
                }

                String ogImage = publication.getImageUrl();
                if (ogImage == null || ogImage.trim().isEmpty()) {
                    ogImage = "https://smolyanvote.com/images/logoNew.png";
                } else if (ogImage.startsWith("/")) {
                    ogImage = "https://smolyanvote.com" + ogImage;
                }

                String ogUrl = "https://smolyanvote.com/publications/" + id;

                // ====== ПОДАЙ ДАННИТЕ КЪМ TEMPLATE-А ======
                model.addAttribute("publication", publication);
                model.addAttribute("ogTitle", ogTitle);
                model.addAttribute("ogDescription", ogDescription);
                model.addAttribute("ogImage", ogImage);
                model.addAttribute("ogUrl", ogUrl);
                model.addAttribute("ogAuthor", publication.getAuthorUsername());

                return "publication-social";

            } else {
                // ====== ЗА НОРМАЛНИ ПОТРЕБИТЕЛИ ======

                // Redirect към главната страница с параметър за modal
                return "redirect:/publications?openModal=" + id;
            }

        } catch (Exception e) {
            return "redirect:/publications";
        }
    }

}