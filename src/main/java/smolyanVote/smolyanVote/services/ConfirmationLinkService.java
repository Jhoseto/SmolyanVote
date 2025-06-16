package smolyanVote.smolyanVote.services;


import org.springframework.stereotype.Service;

/**
 * Service for generating confirmation links for user accounts.
 */
@Service
public class ConfirmationLinkService {

    public String generateConfirmationLink(Long userId, String code) {
        // Създаване на линк за потвърждение с userId и код
        String serverUrl = "https://smolyanvote.com";

        return serverUrl + "/confirm?userId=" + userId + "&code=" + code;
    }
}
