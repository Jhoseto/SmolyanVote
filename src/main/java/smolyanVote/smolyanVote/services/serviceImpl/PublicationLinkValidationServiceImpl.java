package smolyanVote.smolyanVote.services.serviceImpl;

import smolyanVote.smolyanVote.services.interfaces.PublicationLinkValidationService;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.net.URL;
import java.util.Set;

@Service
public class PublicationLinkValidationServiceImpl implements PublicationLinkValidationService {

    // Domain blacklist - може да се премести в база данни по-късно
    private static final Set<String> BLOCKED_DOMAINS = Set.of(
            "pornhub.com", "xvideos.com", "xnxx.com",
            "redtube.com", "youporn.com", "xhamster.com",
            "tube8.com", "drtuber.com", "spankbang.com"
            // Добавяй още при нужда
    );

    private final RestTemplate restTemplate;

    public PublicationLinkValidationServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Проверява дали URL-ът е валиден и безопасен
     */
    @Override
    public ValidationResult validateUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return new ValidationResult(false, "URL е празен");
        }

        try {
            URL urlObj = new URL(url);
            String domain = urlObj.getHost().toLowerCase();

            // 1. Проверка за блокирани домейни
            if (isBlockedDomain(domain)) {
                return new ValidationResult(false, "Този домейн е блокиран");
            }

            // 2. Проверка за валиден протокол
            if (!url.toLowerCase().startsWith("http://") &&
                    !url.toLowerCase().startsWith("https://")) {
                return new ValidationResult(false, "Поддържат се само HTTP и HTTPS протоколи");
            }

            // 3. Проверка дали URL-ът е достъпен (HTTP HEAD заявка)
            if (!isUrlAccessible(url)) {
                return new ValidationResult(false, "URL-ът не е достъпен");
            }

            return new ValidationResult(true, "URL е валиден");

        } catch (Exception e) {
            return new ValidationResult(false, "Невалиден URL формат: " + e.getMessage());
        }
    }

    /**
     * Проверява дали домейнът е в blacklist-а
     */
    @Override
    public boolean isBlockedDomain(String domain) {
        // Премахваме www. за по-точна проверка
        String cleanDomain = domain.startsWith("www.") ? domain.substring(4) : domain;

        return BLOCKED_DOMAINS.stream()
                .anyMatch(blocked -> cleanDomain.equals(blocked) || cleanDomain.endsWith("." + blocked));
    }

    /**
     * Проверява дали URL-ът е достъпен чрез HTTP HEAD заявка
     */
    @Override
    public boolean isUrlAccessible(String url) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.HEAD, null, String.class);

            // Считаме за валидни статус кодове 2xx и 3xx
            int statusCode = response.getStatusCodeValue();
            return statusCode >= 200 && statusCode < 400;

        } catch (Exception e) {
            // Ако има грешка при достъпа, считаме URL-ът за недостъпен
            return false;
        }
    }

    /**
     * Резултат от валидацията
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;

        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}
