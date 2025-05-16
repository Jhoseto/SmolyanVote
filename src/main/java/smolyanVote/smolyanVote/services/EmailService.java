package smolyanVote.smolyanVote.services;

import com.mailjet.client.ClientOptions;
import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;

@Service
public class EmailService {

    private final MailjetClient client;
    private final TemplateEngine templateEngine;
    private final ConfirmationLinkService confirmationLinkService;
    private final UserRepository userRepository;

    @Value("${mailjet.sender.email}")
    private String senderEmail;

    @Value("${mailjet.sender.name}")
    private String senderName;

    public EmailService(@Value("${mailjet.api.key}") String apiKey,
                        @Value("${mailjet.api.secret}") String apiSecret,
                        TemplateEngine templateEngine,
                        ConfirmationLinkService confirmationLinkService,
                        UserRepository userRepository) {
        ClientOptions options = ClientOptions.builder()
                .apiKey(apiKey)
                .apiSecretKey(apiSecret)
                .build();
        this.client = new MailjetClient(options);
        this.templateEngine = templateEngine;
        this.confirmationLinkService = confirmationLinkService;
        this.userRepository = userRepository;
    }

    public void sendConfirmationEmail(String recipientEmail) {
        try {
            // Търсене на потребителя в базата
            UserEntity user = userRepository.findByEmail(recipientEmail)
                    .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));

            // Проверка дали е активен
            if (user.isActive()) {
                throw new IllegalStateException("Потребителят вече е активиран");
            }

            // Генериране на линк за потвърждение
            String confirmationLink = confirmationLinkService.generateConfirmationLink(user.getId(), user.getUserConfirmationCode());

            // Настройки на Thymeleaf шаблона
            Context context = new Context();
            context.setVariable("confirmationLink", confirmationLink);
            String htmlContent = templateEngine.process("emailConfirmTemplate", context);

            // Подготвяне на заявката за изпращане на имейл
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", recipientEmail)))
                                    .put(Emailv31.Message.SUBJECT, "SmolyanVote.bg - Потвърждение на регистрация")
                                    .put(Emailv31.Message.HTMLPART, htmlContent)
                                    .put(Emailv31.Message.TEXTPART,
                                            "Моля, кликнете на линка за потвърждение: " + confirmationLink)));

            MailjetResponse response = client.post(request);

            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email via Mailjet. Status: " + response.getStatus());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error sending email via Mailjet: " + e.getMessage(), e);
        }
    }
}
