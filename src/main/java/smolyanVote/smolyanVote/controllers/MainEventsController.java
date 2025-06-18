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
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

@Controller
public class MainEventsController {
    private static final Logger logger = LoggerFactory.getLogger(MainEventsController.class);

    private final MainEventsService mainEventsService;

    @Autowired
    public MainEventsController(MainEventsService mainEventsService) {
        this.mainEventsService = mainEventsService;
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
            Model model) {
        logger.info("Search query: search={}, location={}, type={}, status={}, sort={}, page={}, size={}",
                search, location, type, status, sort, page, size);

        // Валидация и нормализиране на параметрите
        search = cleanParam(search);
        if (search != null && search.length() > 50) {
            search = search.substring(0, 50); // Ограничаване на дължината
        }

        // Валидация на локацията
        if (location != null && !location.trim().isEmpty()) {
            try {
                Locations.valueOf(location.toUpperCase());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid location: {}", location);
                location = null;
            }
        } else {
            location = null;
        }

        // Валидация на типа
        type = cleanParam(type);
        if (type != null && !isValidType(type)) {
            logger.warn("Invalid type: {}", type);
            type = null;
        }

        // Валидация на статуса
        status = cleanParam(status);
        if (status != null && !isValidStatus(status)) {
            logger.warn("Invalid status: {}", status);
            status = null;
        }

        // Валидация на сортирането
        sort = cleanParam(sort);
        if (sort != null && !isValidSort(sort)) {
            logger.warn("Invalid sort: {}", sort);
            sort = null;
        }

        // Валидация на пагинацията
        page = Math.max(0, page);
        size = Math.max(6, Math.min(50, size));

        // Създаване на сортировка
        Sort sortObj = getSort(sort);

        // Създаване на Pageable
        Pageable pageable = PageRequest.of(page, size, sortObj);

        // Извличане на събития
        long startTime = System.currentTimeMillis();
        Page<EventSimpleViewDTO> events = mainEventsService.findAllEvents(search, location, type, status, pageable);
        logger.info("Query executed in {} ms", System.currentTimeMillis() - startTime);

        // Добавяне на атрибути в модела
        model.addAttribute("events", events);
        model.addAttribute("currentPage", page);
        model.addAttribute("size", size);
        model.addAttribute("totalPages", events.getTotalPages());
        model.addAttribute("param.search", search);
        model.addAttribute("param.location", location);
        model.addAttribute("param.type", type);
        model.addAttribute("param.status", status);
        model.addAttribute("param.sort", sort);

        return "mainEventsPage"; // Името на Thymeleaf шаблона
    }

    private String cleanParam(String param) {
        return param == null || param.trim().isEmpty() ? null : param.trim();
    }

    private boolean isValidType(String type) {
        return type != null && ("event".equalsIgnoreCase(type) || "referendum".equalsIgnoreCase(type) || "poll".equalsIgnoreCase(type));
    }

    private boolean isValidStatus(String status) {
        return status != null && ("active".equalsIgnoreCase(status) || "inactive".equalsIgnoreCase(status));
    }

    private boolean isValidSort(String sort) {
        return sort != null && ("date-desc".equals(sort) || "date-asc".equals(sort) || "popularity".equals(sort) || "name".equals(sort));
    }

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