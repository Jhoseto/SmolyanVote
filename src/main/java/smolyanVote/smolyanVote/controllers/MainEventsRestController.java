package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.SimpleEventService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

@Controller
public class MainEventsRestController {


    private final UserService userService;
    private final SimpleEventService simpleEventService;

    @Autowired
    public MainEventsRestController(UserService userService,
                                    SimpleEventService simpleEventService) {
        this.userService = userService;
        this.simpleEventService = simpleEventService;
    }





    @GetMapping("/mainEvents")
    public String getEventsPage(@RequestParam(defaultValue = "0") int page,
                                @RequestParam(defaultValue = "6") int size,
                                Model model) {
        UserEntity currentUser = userService.getCurrentUser();

        //TODO
        //turkane na vsichki komentari
        //commentsService.deleteAllComments();

        Page<EventSimpleViewDTO> eventPage = simpleEventService.getPaginatedEvents(page, size);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("events", eventPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("size", size);
        return "mainEventPage";
    }
}
