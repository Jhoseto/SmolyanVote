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
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

@Controller
public class MainEventsController {

    private final MainEventsService mainEventsService;
    private final UserService userService;

    @Autowired
    public MainEventsController(MainEventsService mainEventsService,
                                UserService userService) {
        this.mainEventsService = mainEventsService;
        this.userService = userService;
    }

    @GetMapping("/mainEvents")
    public String getEvents(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "6") int size,
            @RequestParam(value = "reset", required = false) String reset,
            Model model) {

        // Ако има reset параметър, пренасочваме без параметри
        if ("true".equals(reset)) {
            return "redirect:/mainEvents";
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

        // Валидация на пагинацията
        page = Math.max(0, page);
        size = Math.max(6, Math.min(50, size));

        // Създаване на сортировка
        Sort sortObj = getSort(sort);

        // Създаване на Pageable
        Pageable pageable = PageRequest.of(page, size, sortObj);

        try {
            // Извличане на събития
            Page<EventSimpleViewDTO> events = mainEventsService.findAllEvents(
                    search, location, eventTypeEnum, eventStatusEnum, pageable);
            UserEntity currentUser = userService.getCurrentUser();

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

            // За backward compatibility
            model.addAttribute("param.search", search);
            model.addAttribute("param.location", location);
            model.addAttribute("param.type", type);
            model.addAttribute("param.status", status);
            model.addAttribute("param.sort", sort);

            // Флаг дали има активни филтри
            boolean hasActiveFilters = search != null || location != null ||
                    type != null || status != null || sort != null;
            model.addAttribute("hasActiveFilters", hasActiveFilters);

            // Пагинация информация за HTML
            addPaginationInfo(model, events, page);

            // Съобщение при липса на резултати
            if (events.isEmpty()) {
                String noResultsMessage = hasActiveFilters ?
                        "Няма намерени събития със зададените филтри. Опитайте да промените критериите за търсене." :
                        "Все още няма създадени събития.";
                model.addAttribute("noResultsMessage", noResultsMessage);
            }


        } catch (Exception e) {
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
     * Създава Sort обект от string параметър
     */
    private Sort getSort(String sort) {
        if (sort == null) {
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
}