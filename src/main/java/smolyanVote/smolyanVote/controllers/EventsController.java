package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.CommentVoteEntity;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.services.interfaces.*;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

import java.util.List;
import java.util.Map;

@Controller
public class EventsController {

    private final SimpleEventService simpleEventService;
    private final CommentsService commentsService;
    private final UserService userService;
    private final VoteService voteService;
    private final SimpleEventRepository simpleEventRepository;
    private final DeleteService deleteService;


    @Autowired
    public EventsController(SimpleEventService simpleEventService,
                            CommentsService commentsService,
                            UserService userService,
                            VoteService voteService,
                            SimpleEventRepository simpleEventRepository,
                            DeleteService deleteService) {
        this.simpleEventService = simpleEventService;
        this.commentsService = commentsService;
        this.userService = userService;
        this.voteService = voteService;
        this.simpleEventRepository = simpleEventRepository;
        this.deleteService = deleteService;
    }






    @GetMapping("/event/{id}")
    public String eventDetail(@PathVariable Long id, Model model) {
        try {
            SimpleEventDetailViewDTO pageData = simpleEventService.getSimpleEventDetails(id);
            UserEntity currentUser = userService.getCurrentUser();

            // Коментари и реакции
            List<CommentsEntity> comments = commentsService.getCommentsForTarget(id, EventType.SIMPLEEVENT);
            Map<Long, ReactionCountDto> reactionsMap = commentsService.getReactionsForAllCommentsWithReplies(comments, currentUser.getUsername());

            model.addAttribute("userVote", pageData.getCurrentUserVote());
            model.addAttribute("eventDetail", pageData);
            model.addAttribute("currentUser", currentUser);
            model.addAttribute("comments", comments);
            model.addAttribute("reactionsMap", reactionsMap);

            return "simpleEventDetailView";
        } catch (IllegalArgumentException e) {
            return "error/404";
        }
    }


    @GetMapping("/createNewEvent")
    public String showCreateEvent(Model model) {
        model.addAttribute("locations", Locations.values()); // enum стойности

        return "createEvent";
    }

    @PostMapping("/create")
    public String createEvent(@ModelAttribute CreateEventView createEventDto,
                              @RequestParam String positiveLabel,
                              @RequestParam String negativeLabel,
                              @RequestParam String neutralLabel,
                              RedirectAttributes redirectAttributes) {

        try {
            // Проверка за изображенията
            MultipartFile[] files = {createEventDto.getImage1(), createEventDto.getImage2(), createEventDto.getImage3()};

            // Логика за създаване на събитието и съхранение на изображенията
            List<String> imagePaths = simpleEventService.createEvent(createEventDto, files, positiveLabel, negativeLabel, neutralLabel);

            // Ако всичко е успешно, добавяме съобщение за успех
            redirectAttributes.addFlashAttribute("successMessage", "Събитието беше създадено успешно!");

        } catch (Exception e) {
            // В случай на грешка добавяме съобщение за грешка
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при създаване на събитието: " + e.getMessage());
        }

        return "redirect:/createNewEvent";
    }



    @PostMapping("/event/{id}/delete")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteEvent(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        deleteService.deleteEvent(id);
        redirectAttributes.addFlashAttribute("successMessage", "Събитието беше изтрито успешно.");
        return "redirect:/mainEvents";
    }






}
