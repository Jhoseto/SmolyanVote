package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Controller
public class MainController {

    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;

    public MainController(SimpleEventRepository simpleEventRepository,
                         ReferendumRepository referendumRepository,
                         MultiPollRepository multiPollRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
    }

    @GetMapping("/")
    public String homePage(Model model) {
        // Броене на трите вида събития
        long simpleEventsCount = simpleEventRepository.count();
        long referendumsCount = referendumRepository.count();
        long multiPollsCount = multiPollRepository.count();

        // Предаване на статистиките в модела
        model.addAttribute("simpleEventsCount", simpleEventsCount);
        model.addAttribute("referendumsCount", referendumsCount);
        model.addAttribute("multiPollsCount", multiPollsCount);

        return "index";
    }

    @GetMapping("/about")
    public String aboutUsPage(Model model) {

        return "aboutUs";
    }

    @GetMapping("/terms-and-conditions")
    public String termsAndConditionsPage(Model model) {

        return "terms-and-conditions";
    }

    @GetMapping("/faq")
    public String showFAQPage(Model model) {
        model.addAttribute("pageTitle", "Често задавани въпроси");
        model.addAttribute("metaDescription", "Отговори на най-често задаваните въпроси за SmolyanVote платформата");

        return "faq";
    }

    @GetMapping("/error/general")
    public String showGeneralError(HttpServletRequest request, Model model) {
        String message = (String) request.getAttribute("errorMessage");
        if (message == null) {
            message = "Възникна неочаквана грешка.";
        }
        model.addAttribute("errorMessage", message);
        return "error/general_error";
    }

    @GetMapping("/error/404")
    public String showNotFoundErrorPage() {
        return "error/404";
    }

    @GetMapping("/error/403")
    public String showAccessDeniedPage() {
        return "error/403";
    }


    @GetMapping("/signals/mainView")
    public String signalsPage(HttpServletResponse response, Model model) {
        // Разрешава геолокация за signals страницата
        response.setHeader("Permissions-Policy", "geolocation=*");

        model.addAttribute("pageTitle", "Граждански сигнали - SmolyanVote");
        model.addAttribute("metaDescription", "Докладвайте проблеми в Смолянска област чрез интерактивна карта." +
                " Вашата ангажираност има значение за подобряване на общността.");

        return "signals-page";
    }

    @GetMapping("/robots.txt")
    public ResponseEntity<String> robotsTxt() {
        try {
            Resource resource = new ClassPathResource("static/robots.txt");
            String content;
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                content = reader.lines().collect(Collectors.joining("\n"));
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(content);
        } catch (IOException e) {
            // Fallback robots.txt content if file not found
            String fallbackContent = "User-agent: *\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fallbackContent);
        }
    }
}
