package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.EventService;
import smolyanVote.smolyanVote.services.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.io.IOException;
import java.util.List;

@Controller
public class UserController {

    private final UserService userService;
    private final EventService eventService;

    @Autowired
    public UserController(UserService userService,
                          EventService eventService) {
        this.userService = userService;
        this.eventService = eventService;
    }


    @GetMapping("/profile")
    public String redirectToUserProfile(Model model) {
        UserEntity currentUser = userService.getCurrentUser();
        List<EventView> userEvents = eventService.getUserEvents(currentUser.getEmail());

        model.addAttribute("locations", Locations.values());
        model.addAttribute("user", currentUser);
        model.addAttribute("userEvents", userEvents);

        return "userEditProfile";
    }


    @PostMapping("/profile/update")
    public String updateProfile(@RequestParam("profileImage") MultipartFile profileImage,
                                @RequestParam("location") Locations location,
                                @RequestParam("bio") String bio,
                                HttpSession session,
                                Model model) throws IOException {

        Long userId = userService.getCurrentUser().getId();
        userService.updateUserProfile(userId, profileImage, bio, location);
        return "redirect:/profile";
    }


}
