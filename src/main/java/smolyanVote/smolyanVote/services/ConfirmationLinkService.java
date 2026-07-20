package smolyanVote.smolyanVote.services;

import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.config.FrontendProperties;

/**
 * Confirmation links point at the Next.js {@code /confirm} page (not Thymeleaf).
 */
@Service
public class ConfirmationLinkService {

    private final FrontendProperties frontendProperties;

    public ConfirmationLinkService(FrontendProperties frontendProperties) {
        this.frontendProperties = frontendProperties;
    }

    public String generateConfirmationLink(Long userId, String code) {
        return frontendProperties.origin() + "/confirm?userId=" + userId + "&code=" + code;
    }
}
