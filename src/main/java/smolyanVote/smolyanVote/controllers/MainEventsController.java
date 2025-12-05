package smolyanVote.smolyanVote.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Controller
public class MainEventsController {

    private static final Logger logger = LoggerFactory.getLogger(MainEventsController.class);

    private final MainEventsService mainEventsService;
    private final UserService userService;
    private final ActivityLogService activityLogService;

    @Autowired
    public MainEventsController(MainEventsService mainEventsService,
                                UserService userService,
                                ActivityLogService activityLogService) {
        this.mainEventsService = mainEventsService;
        this.userService = userService;
        this.activityLogService = activityLogService;
    }

    @GetMapping("/mainEvents")
    public String getEvents(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "dateFrom", required = false) String dateFrom,
            @RequestParam(value = "dateTo", required = false) String dateTo,
            @RequestParam(value = "datePeriod", required = false) String datePeriod,
            @RequestParam(value = "popularity", required = false) String popularity,
            @RequestParam(value = "quickFilter", required = false) String quickFilter,
            @RequestParam(value = "viewMode", required = false) String viewMode,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "8") int size,
            @RequestParam(value = "reset", required = false) String reset,
            Model model) {

        // Ако има reset параметър, пренасочваме без параметри
        if ("true".equals(reset)) {
            return "redirect:/mainEvents";
        }

        // Обработка на бързи филтри (currentUser ще бъде дефиниран по-късно)
        if (quickFilter != null) {
            switch (quickFilter) {
                case "my-events":
                    // Ще се обработи по-късно след получаване на currentUser
                    break;
                case "new-events":
                    datePeriod = "last-7-days";
                    break;
                case "following":
                    // Това ще се обработи по-късно в service слоя
                    break;
                case "not-voted":
                case "voted":
                    // Това ще се обработи по-късно в service слоя
                    break;
            }
        }

        // Валидация и нормализиране на параметрите
        search = cleanParam(search);
        if (search != null && search.length() > 100) {
            search = search.substring(0, 100);
        }

        // Валидация на локацията
        if (location != null && !location.trim().isEmpty()) {
            try {
                Locations.valueOf(location.toUpperCase());
            } catch (IllegalArgumentException e) {
                location = null;
            }
        } else {
            location = null;
        }

        // Валидация на типа и конвертиране към EventType enum
        type = cleanParam(type);
        EventType eventTypeEnum = null;
        if (type != null && isValidType(type)) {
            try {
                eventTypeEnum = switch (type.toLowerCase()) {
                    case "event" -> EventType.SIMPLEEVENT;
                    case "referendum" -> EventType.REFERENDUM;
                    case "poll" -> EventType.MULTI_POLL;
                    default -> null;
                };
            } catch (Exception e) {
                type = null;
            }
        } else if (type != null) {
            type = null;
        }

        // Валидация на статуса и конвертиране към EventStatus enum
        status = cleanParam(status);
        EventStatus eventStatusEnum = null;
        if (status != null && isValidStatus(status)) {
            try {
                eventStatusEnum = status.equalsIgnoreCase("active") ? EventStatus.ACTIVE : EventStatus.INACTIVE;
            } catch (Exception e) {
                status = null;
            }
        } else if (status != null) {
            status = null;
        }

        // Валидация на сортирането
        sort = cleanParam(sort);
        if (sort != null && !isValidSort(sort)) {
            sort = null;
        }

        // Парсване на дати
        Instant parsedDateFrom = parseDate(dateFrom, datePeriod, true);
        Instant parsedDateTo = parseDate(dateTo, datePeriod, false);


        // Валидация на popularity filter
        String cleanPopularity = cleanParam(popularity);
        if (cleanPopularity != null && !isValidPopularityFilter(cleanPopularity)) {
            cleanPopularity = null;
        }

        // Валидация на пагинацията
        page = Math.max(0, page);
        size = Math.max(8, Math.min(64, size));

        // Създаване на сортировка
        // Ако има popularity filter, той има приоритет над sort параметъра
        Sort sortObj;
        if (cleanPopularity != null && !cleanPopularity.trim().isEmpty()) {
            sortObj = getPopularitySort(cleanPopularity);
            // Ако има и sort параметър, добавяме го като вторичен критерий
            if (sort != null && !sort.trim().isEmpty()) {
                Sort secondarySort = getSort(sort);
                if (!secondarySort.isEmpty()) {
                    sortObj = sortObj.and(secondarySort);
                }
            }
        } else {
            sortObj = getSort(sort);
        }

        // Създаване на Pageable
        Pageable pageable = PageRequest.of(page, size, sortObj);

        try {
            logger.debug("Searching for events with params: search={}, location={}, type={}, status={}, dateFrom={}, dateTo={}, popularity={}, page={}, size={}",
                    search, location, type, status, parsedDateFrom, parsedDateTo, cleanPopularity, page, size);

            // Получаване на текущия потребител
            UserEntity currentUser = userService.getCurrentUser();

            // Обработка на my-events quickFilter
            String cleanCreator = null;
            if ("my-events".equals(quickFilter) && currentUser != null) {
                cleanCreator = currentUser.getUsername();
            }

            // Извличане на събития
            Long currentUserId = currentUser != null ? currentUser.getId() : null;
            Page<EventSimpleViewDTO> events = mainEventsService.findAllEvents(
                    search, location, eventTypeEnum, eventStatusEnum, 
                    parsedDateFrom, parsedDateTo, null, null, 
                    cleanCreator, cleanPopularity, quickFilter, currentUserId, pageable);

            // ✅ ЛОГИРАНЕ НА SEARCH_CONTENT / FILTER_CONTENT
            try {
                if (currentUser != null) {
                    boolean hasSearch = search != null && !search.trim().isEmpty();
                    boolean hasFilters = location != null || type != null || status != null 
                            || parsedDateFrom != null || parsedDateTo != null || cleanPopularity != null 
                            || quickFilter != null;
                    
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
                        if (location != null) filterDetails.append("location=").append(location).append(", ");
                        if (type != null) filterDetails.append("type=").append(type).append(", ");
                        if (status != null) filterDetails.append("status=").append(status).append(", ");
                        if (cleanPopularity != null) filterDetails.append("popularity=").append(cleanPopularity).append(", ");
                        if (quickFilter != null) filterDetails.append("quickFilter=").append(quickFilter);
                        String details = filterDetails.toString().replaceAll(", $", "");
                        activityLogService.logActivity(ActivityActionEnum.FILTER_CONTENT, currentUser,
                                null, null, details, ipAddress, userAgent);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to log search/filter activity: " + e.getMessage());
            }

            // Основни атрибути за události
            model.addAttribute("events", events);
            model.addAttribute("currentUser", currentUser);
            model.addAttribute("currentPage", page);
            model.addAttribute("size", size);
            model.addAttribute("totalPages", events.getTotalPages());
            model.addAttribute("totalElements", events.getTotalElements());

            // Текущи стойности на филтрите
            model.addAttribute("currentSearch", search);
            model.addAttribute("currentLocation", location);
            model.addAttribute("currentType", type);
            model.addAttribute("currentStatus", status);
            model.addAttribute("currentSort", sort);
            model.addAttribute("currentDateFrom", dateFrom);
            model.addAttribute("currentDateTo", dateTo);
            model.addAttribute("currentDatePeriod", datePeriod);
            model.addAttribute("currentPopularity", cleanPopularity);
            model.addAttribute("currentQuickFilter", quickFilter);
            
            // View mode
            String cleanViewMode = cleanParam(viewMode);
            if (cleanViewMode != null && !cleanViewMode.equals("grid") && !cleanViewMode.equals("list")) {
                cleanViewMode = null;
            }
            model.addAttribute("viewMode", cleanViewMode);

            // За backward compatibility
            model.addAttribute("param.search", search);
            model.addAttribute("param.location", location);
            model.addAttribute("param.type", type);
            model.addAttribute("param.status", status);
            model.addAttribute("param.sort", sort);

            // Флаг дали има активни филтри
            boolean hasActiveFilters = search != null || location != null ||
                    type != null || status != null || sort != null ||
                    parsedDateFrom != null || parsedDateTo != null || datePeriod != null ||
                    cleanPopularity != null;
            model.addAttribute("hasActiveFilters", hasActiveFilters);

            // Пагинация информация за HTML
            addPaginationInfo(model, events, page);

            // Статистики за събитията
            try {
                Map<String, Object> statistics = mainEventsService.getEventsStatistics();
                model.addAttribute("statistics", statistics);
            } catch (Exception e) {
                logger.error("Error retrieving statistics", e);
                // Продължаваме без статистики
            }

            // Препоръчани събития (ако потребителят е влязъл)
            if (currentUser != null) {
                try {
                    List<EventSimpleViewDTO> recommendedEvents = mainEventsService.getRecommendedEvents(currentUser.getId(), 6);
                    model.addAttribute("recommendedEvents", recommendedEvents);
                } catch (Exception e) {
                    logger.error("Error retrieving recommended events", e);
                    // Продължаваме без препоръчани събития
                }
            }

            // Съобщение при липса на резултати
            if (events.isEmpty()) {
                String noResultsMessage = hasActiveFilters ?
                        "Няма намерени събития със зададените филтри. Опитайте да промените критериите за търсене." :
                        "Все още няма създадени събития.";
                model.addAttribute("noResultsMessage", noResultsMessage);
            }


        } catch (Exception e) {
            logger.error("Error retrieving events", e);
            model.addAttribute("error", "Възникна грешка при зареждането на събитията. Моля, опитайте отново.");
            // Добавяме празна страница при грешка
            model.addAttribute("events", Page.empty());
            model.addAttribute("currentPage", 0);
            model.addAttribute("totalPages", 0);
            model.addAttribute("totalElements", 0L);

            // Задаваме безопасни стойности за пагинацията при грешка
            model.addAttribute("startPage", 0);
            model.addAttribute("endPage", 0);
            model.addAttribute("isFirstPage", true);
            model.addAttribute("isLastPage", true);
            model.addAttribute("hasNextPage", false);
            model.addAttribute("hasPreviousPage", false);
            model.addAttribute("startResult", 0L);
            model.addAttribute("endResult", 0L);
        }

        return "mainEventsPage";
    }

    /**
     * Добавя информация за пагинацията в модела
     */
    private void addPaginationInfo(Model model, Page<EventSimpleViewDTO> events, int currentPage) {
        // Пагинация flags
        model.addAttribute("isFirstPage", events.isFirst());
        model.addAttribute("isLastPage", events.isLast());
        model.addAttribute("hasNextPage", events.hasNext());
        model.addAttribute("hasPreviousPage", events.hasPrevious());

        // Изчисляване на видимите страници за пагинацията
        int totalPages = events.getTotalPages();

        // Защита срещу null или негативни стойности
        if (totalPages <= 0) {
            model.addAttribute("startPage", 0);
            model.addAttribute("endPage", 0);
            model.addAttribute("startResult", 0L);
            model.addAttribute("endResult", 0L);
            return;
        }

        int startPage = Math.max(0, currentPage - 2);
        int endPage = Math.min(totalPages - 1, currentPage + 2);

        // Ако има малко страници, показваме всички
        if (totalPages <= 5) {
            startPage = 0;
            endPage = Math.max(0, totalPages - 1); // Защита срещу негативни стойности
        }

        // Финална защита за валидни стойности
        endPage = Math.max(0, Math.min(endPage, totalPages - 1));

        // Осигуряваме че startPage <= endPage
        if (startPage > endPage) {
            startPage = endPage;
        }

        model.addAttribute("startPage", startPage);
        model.addAttribute("endPage", endPage);

        // Информация за текущите резултати
        if (!events.isEmpty()) {
            long startResult = (long) currentPage * events.getSize() + 1;
            long endResult = Math.min(startResult + events.getSize() - 1, events.getTotalElements());

            model.addAttribute("startResult", startResult);
            model.addAttribute("endResult", endResult);
        } else {
            model.addAttribute("startResult", 0L);
            model.addAttribute("endResult", 0L);
        }
    }

    /**
     * Почиства параметър от null и празни стойности
     */
    private String cleanParam(String param) {
        return param == null || param.trim().isEmpty() ? null : param.trim();
    }

    /**
     * Валидира типа на събитието
     */
    private boolean isValidType(String type) {
        return ("event".equalsIgnoreCase(type) ||
                "referendum".equalsIgnoreCase(type) ||
                "poll".equalsIgnoreCase(type));
    }

    /**
     * Валидира статуса на събитието
     */
    private boolean isValidStatus(String status) {
        return ("active".equalsIgnoreCase(status) ||
                "inactive".equalsIgnoreCase(status));
    }

    /**
     * Валидира сортировката
     */
    private boolean isValidSort(String sort) {
        return ("date-desc".equals(sort) ||
                "date-asc".equals(sort) ||
                "popularity".equals(sort) ||
                "name".equals(sort));
    }

    /**
     * Валидира popularity филтъра
     */
    private boolean isValidPopularityFilter(String popularity) {
        return ("most-voted".equalsIgnoreCase(popularity) ||
                "most-viewed".equalsIgnoreCase(popularity) ||
                "most-commented".equalsIgnoreCase(popularity));
    }

    /**
     * Парсва дата от string или от datePeriod (last-7-days, last-month, last-year)
     */
    private Instant parseDate(String dateString, String datePeriod, boolean isFrom) {
        // Ако има datePeriod, използваме него
        if (datePeriod != null && !datePeriod.trim().isEmpty()) {
            return parseDatePeriod(datePeriod, isFrom);
        }

        // Иначе парсваме dateString
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }

        try {
            // Опитваме се да парснем като ISO date (YYYY-MM-DD)
            LocalDate localDate = LocalDate.parse(dateString.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            return localDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException e) {
            logger.warn("Failed to parse date: {}", dateString);
            return null;
        }
    }

    /**
     * Парсва datePeriod в Instant
     */
    private Instant parseDatePeriod(String datePeriod, boolean isFrom) {
        LocalDate now = LocalDate.now();
        LocalDate targetDate;

        switch (datePeriod.toLowerCase()) {
            case "last-7-days":
                targetDate = isFrom ? now.minusDays(7) : now;
                break;
            case "last-month":
                targetDate = isFrom ? now.minusMonths(1) : now;
                break;
            case "last-year":
                targetDate = isFrom ? now.minusYears(1) : now;
                break;
            default:
                return null;
        }

        return targetDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
    }

    /**
     * Създава Sort обект от string параметър
     */
    private Sort getSort(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sort) {
            case "date-desc" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "date-asc" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "popularity" -> Sort.by(Sort.Direction.DESC, "totalVotes");
            case "name" -> Sort.by(Sort.Direction.ASC, "title");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    /**
     * Създава Sort обект от popularity filter
     */
    private Sort getPopularitySort(String popularity) {
        if (popularity == null || popularity.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (popularity.toLowerCase()) {
            case "most-voted" -> Sort.by(Sort.Direction.DESC, "totalVotes");
            case "most-viewed" -> Sort.by(Sort.Direction.DESC, "viewCounter");
            case "most-commented" -> Sort.by(Sort.Direction.DESC, "totalVotes"); // За сега използваме гласове
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
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