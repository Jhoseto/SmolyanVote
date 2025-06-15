package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

@Controller
@RequestMapping("/mainEvents")
public class MainEventsController {

    private final UserService userService;
    private final MainEventsService mainEventsService;

    @Autowired
    public MainEventsController(UserService userService,
                                MainEventsService mainEventsService) {
        this.userService = userService;
        this.mainEventsService = mainEventsService;
    }


    @GetMapping("/allEvents")
    public String getAllEventsPages(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "6") int size,
                                   Model model) {
        UserEntity currentUser = userService.getCurrentUser();

        Page<EventSimpleViewDTO> eventPage = mainEventsService.getPaginatedAllEvents(page, size);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("events", eventPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("size", size);
        return "mainEventPage";
    }



    @GetMapping("/simpleEvents")
    public String getSimpleEventsPages(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "6") int size,
                                   Model model) {
        UserEntity currentUser = userService.getCurrentUser();

        Page<EventSimpleViewDTO> eventPage = mainEventsService.getPaginatedSimpleEvents(page, size);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("events", eventPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("size", size);
        return "mainEventPage";
    }


    @GetMapping("/referendums")
    public String getReferendumsPages(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "6") int size,
                                      Model model) {
        UserEntity currentUser = userService.getCurrentUser();

        Page<EventSimpleViewDTO> eventPage = mainEventsService.getPaginatedReferendumEvents(page, size);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("events", eventPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("size", size);
        return "mainEventPage";
    }


    @GetMapping("/multiPolls")
    public String getMultiPollsPages(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "6") int size,
                                      Model model) {
        UserEntity currentUser = userService.getCurrentUser();

        Page<EventSimpleViewDTO> eventPage = mainEventsService.getPaginatedMultiPollEvents(page, size);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("events", eventPage);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", eventPage.getTotalPages());
        model.addAttribute("size", size);
        return "mainEventPage";
    }
}
