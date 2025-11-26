package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.services.interfaces.ReferendumService;
import smolyanVote.smolyanVote.services.interfaces.VoteService;

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
            HttpServletRequest request,
            RedirectAttributes redirectAttributes
    ) {
        String ipAddress = getClientIpAddress(request);
        try {
            voteService.recordSimpleEventVote(eventId, voteValue, userEmail, ipAddress);
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            return "redirect:/event/" + eventId;
        }

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
            HttpServletRequest request,
            RedirectAttributes redirectAttributes
    ) {
        Optional<ReferendumEntity> optionalReferendum = referendumRepository.findById(referendumId);
        if (optionalReferendum.isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMessage", "Референдумът не е намерен.");
            return "redirect:/404";
        }

        String ipAddress = getClientIpAddress(request);
        try {
            String voteLabel = voteService.recordReferendumVote(referendumId, voteValue, userEmail, ipAddress);
            redirectAttributes.addFlashAttribute("successMessage", "Успешно гласувахте: " + voteLabel);
        } catch (IllegalArgumentException | IllegalStateException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Грешка при гласуване: " + e.getMessage());
        }

        return "redirect:/referendum/" + referendumId;
    }

    /**
     * Извлича IP адреса на клиента от заявката
     * Проверява X-Forwarded-For, X-Real-IP и други headers за прокси/load balancer
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String[] headers = {"X-Forwarded-For", "X-Real-IP", "Proxy-Client-IP", "WL-Proxy-Client-IP"};
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Ако има няколко IP-та (често при прокси), вземи първото
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

}