package smolyanVote.smolyanVote.controllers;

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
import smolyanVote.smolyanVote.services.interfaces.PublicationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.serviceImpl.ImageCloudinaryServiceImpl;
import smolyanVote.smolyanVote.viewsAndDTO.PublicationRequestDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/publications")
public class PublicationsController {

    private final PublicationService publicationService;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageService;

    @Autowired
    public PublicationsController(PublicationService publicationService,
                                  UserService userService,
                                  ImageCloudinaryServiceImpl imageService) {
        this.publicationService = publicationService;
        this.userService = userService;
        this.imageService = imageService;
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
            model.addAttribute("recentAuthors", publicationService.getActiveAuthors(5));
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
            model.addAttribute("recentAuthors", List.of());
            model.addAttribute("todayPublications", 0);
            model.addAttribute("weekPublications", 0);
            model.addAttribute("activeUsers", 0);
        }

        return "publications";
    }

    @GetMapping("/{id}")
    public String publicationDetail(@PathVariable Long id, Model model, Authentication auth) {
        PublicationEntity publication = publicationService.findById(id);
        if (publication == null) {
            return "redirect:/publications";
        }

        if (!publicationService.canViewPublication(publication, auth)) {
            return "redirect:/publications";
        }

        publicationService.incrementViewCount(id);
        model.addAttribute("publication", publication);
        return "publicationDetail";
    }


    @Transactional(readOnly = true)
    @GetMapping("/{id}/edit")
    public String editPublicationPage(@PathVariable Long id, Model model, Authentication auth) {
        if (auth == null) {
            return "redirect:/login?returnUrl=/publications/" + id + "/edit";
        }

        PublicationEntity publication = publicationService.findById(id);
        if (publication == null || !publicationService.canEditPublication(publication, auth)) {
            return "redirect:/publications";
        }

        model.addAttribute("publication", publication);
        return "editPublication";
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth) {

        try {
            page = Math.max(0, page);
            size = Math.min(Math.max(1, size), 50);

            Pageable pageable = createPageable(page, size, sort);
            Page<PublicationEntity> publicationsPage = publicationService.findWithFilters(
                    search, category, status, time, author, pageable, auth
            );

            Map<String, Object> response = new HashMap<>();
            response.put("publications", publicationsPage.getContent());
            response.put("totalElements", publicationsPage.getTotalElements());
            response.put("totalPages", publicationsPage.getTotalPages());
            response.put("currentPage", page);
            response.put("hasNext", publicationsPage.hasNext());
            response.put("hasPrevious", publicationsPage.hasPrevious());

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
            response.put("message", "Публикацията е създадена успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
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

            if (!file.getContentType().startsWith("image/")) {
                return ResponseEntity.status(400).body(createErrorResponse("Моля, изберете снимка"));
            }

            UserEntity user = userService.getCurrentUser();
            String imageUrl = imageService.savePublicationImage(file, user.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", imageUrl);
            response.put("message", "Снимката е качена успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при качването на снимката: " + e.getMessage()));
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

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            PublicationEntity publication = publicationService.findById(id);
            if (publication == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Публикацията не е намерена"));
            }

            if (!publicationService.canEditPublication(publication, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за изтриване на тази публикация"));
            }

            publicationService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Публикацията е изтрита успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при изтриването на публикацията"));
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

            Map<String, Object> response = new HashMap<>();
            response.put("isLiked", isLiked);
            response.put("likesCount", likesCount);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при харесването"));
        }
    }

    @PostMapping(value = "/api/{id}/bookmark", produces = "application/json")
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
            response.put("message", isBookmarked ? "Добавено в любими" : "Премахнато от любими");

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

    @PostMapping(value = "/api/{id}/report", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> reportPublication(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        if (auth == null) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            String reason = request.get("reason");

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(400).body(createErrorResponse("Моля, посочете причина за докладването"));
            }

            publicationService.reportPublication(id, user, reason);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Докладът е изпратен успешно");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при докладването"));
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

            // За сега симулираме follow/unfollow логиката
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
            Map<String, Object> preferences = new HashMap<>();

            // За сега връщаме празни масиви - по-късно ще се имплементира правилно
            preferences.put("likedPosts", List.of());
            preferences.put("bookmarkedPosts", List.of());
            preferences.put("followedAuthors", List.of());

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
}