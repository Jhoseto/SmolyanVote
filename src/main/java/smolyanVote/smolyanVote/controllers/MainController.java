package smolyanVote.smolyanVote.controllers;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

/**
 * API-host utilities only. Page HTML lives in Next.js — browser navigations
 * are redirected by {@code LegacyUiIsolationFilter}.
 */
@Controller
public class MainController {

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
            String fallbackContent = "User-agent: *\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fallbackContent);
        }
    }
}
