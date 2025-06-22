package smolyanVote.smolyanVote.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PostsController {

    @GetMapping("/posts")
    public String showNewsPage(Model model) {

        return "posts";
    }
}
