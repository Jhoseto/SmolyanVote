package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.services.EventService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.util.List;

@Controller
public class EventsController {

    private final EventService eventService;

    @Autowired
    public EventsController(EventService eventService) {
        this.eventService = eventService;
    }


    @GetMapping("/mainEvents")
    public String showMainEvent(Model model) {
        List<EventView> eventViews = eventService.getAllEvents();
        model.addAttribute("events", eventViews != null ? eventViews : List.of());
        return "mainEventPage";
    }

    @GetMapping("/event/{id}")
    public String eventDetail(@PathVariable Long id, Model model) {
        EventView eventDetailView = eventService.getEventById(id);
        model.addAttribute("eventDetail", eventDetailView);
        return "eventDetail"; // Тази страница ще показва детайлите на събитието
    }

    @GetMapping("/createNewEvent")
    public String showCreateEvent(Model model) {
        return "createEvent";
    }

    @PostMapping("/create")
    public String createEvent(@ModelAttribute CreateEventView createEventDto,
                              RedirectAttributes redirectAttributes) {

        try {
            // Проверка за изображенията
            MultipartFile[] files = {createEventDto.getImage1(), createEventDto.getImage2(), createEventDto.getImage3()};

            // Логика за създаване на събитието и съхранение на изображенията
            List<String> imagePaths = eventService.createEvent(createEventDto, files);

            // Ако всичко е успешно, добавяме съобщение за успех
            redirectAttributes.addFlashAttribute("successMessage", "Събитието беше създадено успешно!");

        } catch (Exception e) {
            // В случай на грешка добавяме съобщение за грешка
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при създаване на събитието: " + e.getMessage());
        }

        return "redirect:/createNewEvent";
    }








}
