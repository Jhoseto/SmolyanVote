package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.services.interfaces.SimpleEventService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.io.IOException;
import java.util.List;

@Controller
public class UserController {

    private final UserService userService;
    private final SimpleEventService simpleEventService;

    @Autowired
    public UserController(UserService userService,
                          SimpleEventService simpleEventService) {
        this.userService = userService;
        this.simpleEventService = simpleEventService;
    }


    @GetMapping("/profile")
    public String redirectToUserProfile(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "6") int size,
                                        Model model) {

        UserEntity currentUser = userService.getCurrentUser();
        List<EventSimpleViewDTO> userEvents = simpleEventService.getAllUserEvents(currentUser.getEmail());

        model.addAttribute("locations", Locations.values());
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userEvents", userEvents);
        return "userEditProfile";
    }


    @GetMapping("/user/{username}")
    public String showUserProfile(@PathVariable String username, Model model) {
        UserEntity user = userService.findUserByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен"));
        UserEntity currentUser = userService.getCurrentUser();

        List<EventSimpleViewDTO> userEvents = simpleEventService.getAllUserEvents(user.getEmail());

        model.addAttribute("user", user);
        model.addAttribute("currentUser", currentUser);
        model.addAttribute("userEvents", userEvents);
        return "userProfile";
    }




    @PostMapping("/profile/update")
    public String updateProfile(@RequestParam("profileImage") MultipartFile profileImage,
                                @RequestParam("location") Locations location,
                                @RequestParam("bio") String bio) throws IOException {

        Long userId = userService.getCurrentUser().getId();
        userService.updateUserProfile(userId, profileImage, bio, location);
        return "redirect:/profile";
    }


}
