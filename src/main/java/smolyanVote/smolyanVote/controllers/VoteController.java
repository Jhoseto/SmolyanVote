package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.services.ReferendumService;
import smolyanVote.smolyanVote.services.VoteService;
import smolyanVote.smolyanVote.services.serviceImpl.ReferendumServiceImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Controller
public class VoteController {

    private final VoteService voteService;
    private final ReferendumService referendumRepository;

    @Autowired
    public VoteController(VoteService voteService,
                          ReferendumService referendumRepository) {
        this.voteService = voteService;
        this.referendumRepository = referendumRepository;
    }

    @PostMapping("/simpleVote")
    public String processVote(
            @RequestParam("eventId") Long eventId,
            @RequestParam("vote") String voteValue,
            @RequestParam("userEmail") String userEmail,
            RedirectAttributes redirectAttributes
    ) {
        voteService.recordVote(eventId, voteValue, userEmail);

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

    @PostMapping("/referendumVote")
    public String referendumProcessVote(
            @RequestParam("referendumId") Long referendumId,
            @RequestParam("vote") String voteValue,
            @RequestParam("userEmail") String userEmail,
            RedirectAttributes redirectAttributes
    ) {
        System.out.println(referendumId+" /"+voteValue+" /"+userEmail);


        Optional<ReferendumEntity> optionalReferendum = referendumRepository.findById(referendumId);
        if (optionalReferendum.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Референдумът не е намерен.");
            return "redirect:/404";
        }


        try {
            String voteLabel = voteService.recordReferendumVote(referendumId, voteValue, userEmail);
            redirectAttributes.addFlashAttribute("successMessage", "Успешно гласувахте: " + voteLabel);
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при гласуване: " + e.getMessage());
        }

        return "redirect:/referendum/" + referendumId;
    }

}