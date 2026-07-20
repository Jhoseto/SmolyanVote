package smolyanVote.smolyanVote.controllers;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import smolyanVote.smolyanVote.config.FrontendProperties;

import java.io.IOException;

@Controller
public class CustomErrorController implements ErrorController {

    private final FrontendProperties frontendProperties;

    public CustomErrorController(FrontendProperties frontendProperties) {
        this.frontendProperties = frontendProperties;
    }

    @GetMapping("/error")
    public void handleError(HttpServletResponse response) throws IOException {
        response.setHeader("Cache-Control", "no-store");
        response.sendRedirect(frontendProperties.origin() + "/");
    }
}
