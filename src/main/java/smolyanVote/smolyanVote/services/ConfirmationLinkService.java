package smolyanVote.smolyanVote.services;


import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;

/**
 * Service for generating confirmation links for user accounts.
 */
@Service
public class ConfirmationLinkService {
    public String generateConfirmationLink(UserEntity user) {

        /**
         * Generates a confirmation link for a given user.
         *
         * @param user The user object for which the link is generated
         * @return Confirmation link to the user account
         */
        String confirmationLink = "http://165.232.69.250:2662/confirm?userId="+ "&code=";

        return confirmationLink;
    }
}
//https://213.91.128.33:2662
//https://192.168.1.3:2662