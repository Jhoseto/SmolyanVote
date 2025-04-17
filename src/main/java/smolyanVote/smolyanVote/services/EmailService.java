package smolyanVote.smolyanVote.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service responsible for sending emails for user-related actions.
 */
@Service
public class EmailService {
    private final JavaMailSender emailSender;


    @Autowired
    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
    }

    /**
     * Sends a confirmation email with a provided confirmation link to the recipient.
     *
     * @param recipientEmail   The email address of the recipient
     * @param confirmationLink  The confirmation link to include in the email
     * @throws MailException   If an error occurs during email sending
     */
    public void sendConfirmationEmail(String recipientEmail, String confirmationLink) throws MailException {
        SimpleMailMessage mailMessage = new SimpleMailMessage();

        mailMessage.setTo(recipientEmail);
        mailMessage.setSubject("SmolyanVote.bg - Потвърждение на регистрация");
        mailMessage.setText("Кликнете на линка за да потвърдите вашият Email адрес.\n"+confirmationLink);

        emailSender.send(mailMessage);
    }

    /**
     * Sends a forgotten password email with a provided confirmation link to the recipient.
     *
     * @param recipientEmail   The email address of the recipient
     * @param confirmationLink  The link for password reset to include in the email
     * @throws MailException   If an error occurs during email sending
     */
    //TODO forgotten password email
    public void sendForgottenPasswordEmail(String recipientEmail, String confirmationLink) throws MailException {
        SimpleMailMessage mailMessage = new SimpleMailMessage();

        mailMessage.setTo(recipientEmail);
        mailMessage.setSubject("SmolyanVote.bg - Потвърждение на регистрация");
        mailMessage.setText("Кликнете на линка за да потвърдите вашият Email адрес.\n"+confirmationLink);

        emailSender.send(mailMessage);
    }
}
