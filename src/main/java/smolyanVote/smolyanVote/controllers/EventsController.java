package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.CommentsService;
import smolyanVote.smolyanVote.services.EventService;
import smolyanVote.smolyanVote.services.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.util.List;

@Controller
public class EventsController {

    private final EventService eventService;
    private final CommentsService commentsService;
    private final UserService userService;
    ;

    @Autowired
    public EventsController(EventService eventService,
                            CommentsService commentsService,
                            UserService userService) {
        this.eventService = eventService;
        this.commentsService = commentsService;
        this.userService = userService;
    }


    @GetMapping("/mainEvents")
    public String getEventsPage(@RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "6") int size,
                                Model model) {

        //TODO Delete All Comments
        //commentsService.deleteAllComments();


        Page<EventView> eventPage = eventService.getPaginatedEvents(page, size);
        model.addAttribute("events", eventPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("size", size);
        return "mainEventPage";
    }



    @GetMapping("/event/{id}")
    public String eventDetail(@PathVariable Long id, Model model) {
        // Получаваме детайлите за събитието
        EventView eventDetailView = eventService.getEventById(id);
        UserEntity user = userService.getCurrentUser();

        // Изчисляваме процента на гласовете
        int totalVotes = eventDetailView.getTotalVotes();
        if (totalVotes > 0) {
            eventDetailView.setYesPercent(eventDetailView.getYesVotes() * 100 / totalVotes);
            eventDetailView.setNoPercent(eventDetailView.getNoVotes() * 100 / totalVotes);
            eventDetailView.setNeutralPercent(eventDetailView.getNeutralVotes() * 100 / totalVotes);
        } else {
            eventDetailView.setYesPercent(0);
            eventDetailView.setNoPercent(0);
            eventDetailView.setNeutralPercent(0);
        }

        // Зареждаме коментарите за събитието
        List<CommentsEntity> comments = commentsService.getCommentsForEvent(id);

        // Добавяме коментарите в модела
        model.addAttribute("eventDetail", eventDetailView);
        model.addAttribute("currentUser", user);
        model.addAttribute("comments", comments);

        // Връщаме изгледа за събитието с коментарите
        return "eventDetailView";
    }



    @GetMapping("/createNewEvent")
    public String showCreateEvent(Model model) {
        model.addAttribute("locations", Locations.values()); // enum стойности

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
