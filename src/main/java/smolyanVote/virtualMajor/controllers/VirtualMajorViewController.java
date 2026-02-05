package smolyanVote.virtualMajor.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for serving the Virtual Major game view.
 */
@Controller
@RequestMapping("/virtual-mayor")
public class VirtualMajorViewController {

    /**
     * Serves the main game page.
     * 
     * @return the name of the Thymeleaf template for the game
     */
    @GetMapping
    public String viewGame() {
        return "virtual-mayor";
    }
}
