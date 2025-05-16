package smolyanVote.smolyanVote.services;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;

/**
 * Service for generating confirmation links for user accounts.
 */
@Service
public class ConfirmationLinkService {

    private String serverUrl = "http://165.232.69.250:2662";

    public String generateConfirmationLink(Long userId, String code) {
        // Създаване на линк за потвърждение с userId и код
        return serverUrl + "/confirm?userId=" + userId + "&code=" + code;
    }
}
//https://213.91.128.33:2662
//https://192.168.1.3:2662