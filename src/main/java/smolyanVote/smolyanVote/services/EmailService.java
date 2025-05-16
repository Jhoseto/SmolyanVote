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

@Service
public class EmailService {

    private final MailjetClient client;
    private final TemplateEngine templateEngine;

    @Value("${mailjet.sender.email}")
    private String senderEmail;

    @Value("${mailjet.sender.name}")
    private String senderName;

    public EmailService(@Value("${mailjet.api.key}") String apiKey,
                        @Value("${mailjet.api.secret}") String apiSecret,
                        TemplateEngine templateEngine) {
        ClientOptions options = ClientOptions.builder()
                .apiKey(apiKey)
                .apiSecretKey(apiSecret)
                .build();

        this.client = new MailjetClient(options);
        this.templateEngine = templateEngine;
    }

    public void sendConfirmationEmail(String recipientEmail, String confirmationLink) {
        try {
            Context context = new Context();
            context.setVariable("confirmationLink", confirmationLink);

            String htmlContent = templateEngine.process("emailConfirmTemplate", context);

            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", recipientEmail)))
                                    .put(Emailv31.Message.SUBJECT, "SmolyanVote.com - Потвърждение на регистрация")
                                    .put(Emailv31.Message.HTMLPART, htmlContent)
                                    .put(Emailv31.Message.TEXTPART,
                                            "Благодарим ви, че се регистрирахте в нашата платформа. " +
                                                    "За да активирате своя акаунт, моля, кликнете на линка, " +
                                                    "за да потвърдите вашият Email адрес: " + confirmationLink)));

            MailjetResponse response = client.post(request);

            if (response.getStatus() != 200) {
                throw new RuntimeException("Failed to send email via Mailjet. Status: " + response.getStatus());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error sending email via Mailjet: " + e.getMessage(), e);
        }
    }

    // TODO: implement forgotten password email
    public void sendForgottenPasswordEmail(String recipientEmail, String confirmationLink) {
        // Implementation pending
    }
}
