package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.services.VoteService;

@Controller
public class VoteController {

    private final VoteService voteService;
    private final EventsController eventsController;

    @Autowired
    public VoteController(VoteService voteService,
                          EventsController eventsController) {
        this.voteService = voteService;
        this.eventsController = eventsController;
    }

    @PostMapping("/vote")
    public String processVote(
            @RequestParam("eventId") Long eventId,
            @RequestParam("vote") String voteValue,
            RedirectAttributes redirectAttributes
    ) {
        voteService.recordVote(eventId, voteValue);

        String voteLabel;
        switch (voteValue) {
            case "1" -> voteLabel = "„За“";
            case "2" -> voteLabel = "„Против“";
            case "3" -> voteLabel = "„Въздържал се“";
            default -> voteLabel = "неизвестно";
        }

        // Добавяме съобщение към атрибутите за пренасочване
        redirectAttributes.addFlashAttribute("successMessage", "Успешно гласувахте: " + voteLabel);

        return "redirect:/event/" + eventId;
    }
}
