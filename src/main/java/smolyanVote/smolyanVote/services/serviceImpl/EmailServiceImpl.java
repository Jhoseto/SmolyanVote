package smolyanVote.smolyanVote.services.serviceImpl;

import com.mailjet.client.ClientOptions;
import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import jakarta.annotation.PostConstruct;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.config.FrontendProperties;
import smolyanVote.smolyanVote.models.PodcastEpisodeEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.ConfirmationLinkService;
import smolyanVote.smolyanVote.services.interfaces.EmailService;
import smolyanVote.smolyanVote.services.support.ClasspathHtmlTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final MailjetClient client;
    private final ClasspathHtmlTemplate htmlTemplate;
    private final ConfirmationLinkService confirmationLinkService;
    private final UserRepository userRepository;
    private final FrontendProperties frontendProperties;
    private final String apiKey;
    private final String apiSecret;
    private final String senderEmail;
    private final String senderName;
    private final Environment environment;

    public EmailServiceImpl(@Value("${mailjet.api.key}") String apiKey,
                            @Value("${mailjet.api.secret}") String apiSecret,
                            @Value("${mailjet.sender.email}") String senderEmail,
                            @Value("${mailjet.sender.name}") String senderName,
                            ClasspathHtmlTemplate htmlTemplate,
                            ConfirmationLinkService confirmationLinkService,
                            UserRepository userRepository,
                            FrontendProperties frontendProperties,
                            Environment environment) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.apiSecret = apiSecret == null ? "" : apiSecret.trim();
        this.senderEmail = senderEmail;
        this.senderName = senderName;
        ClientOptions options = ClientOptions.builder()
                .apiKey(this.apiKey)
                .apiSecretKey(this.apiSecret)
                .build();
        this.client = new MailjetClient(options);
        this.htmlTemplate = htmlTemplate;
        this.confirmationLinkService = confirmationLinkService;
        this.userRepository = userRepository;
        this.frontendProperties = frontendProperties;
        this.environment = environment;
    }

    @PostConstruct
    void validateMailjetConfig() {
        if (apiKey.isBlank() || apiSecret.isBlank()) {
            throw new IllegalStateException(
                    "Mailjet API keys are missing. Put MAILJET_API_KEY / MAILJET_API_SECRET in "
                            + "src/main/resources/.env (loaded via spring-dotenv classpath fallback) "
                            + "or as real environment variables.");
        }
        if (senderEmail == null || senderEmail.isBlank()) {
            throw new IllegalStateException("mailjet.sender.email is not configured");
        }
        log.info("Mailjet configured: sender={} frontendOrigin={} apiKeyLen={}",
                senderEmail, frontendProperties.origin(), apiKey.length());
    }

    @Override
    public void sendConfirmationEmail(String recipientEmail) {
        UserEntity user = userRepository.findByEmail(recipientEmail)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));

        if (user.getStatus().equals(UserStatusEnum.ACTIVE)) {
            throw new IllegalStateException("Потребителят вече е активиран");
        }

        String confirmationLink = confirmationLinkService.generateConfirmationLink(
                user.getId(), user.getUserConfirmationCode());
        logDevLink("confirmation", confirmationLink);

        String htmlContent = htmlTemplate.render("email/confirm.html", Map.of(
                "confirmationLink", confirmationLink));

        sendHtmlEmail(
                recipientEmail,
                "SmolyanVote.bg - Потвърждение на регистрация",
                htmlContent,
                "Моля, кликнете на линка за потвърждение: " + confirmationLink);
    }

    @Override
    public void sendPasswordResetEmail(String recipientEmail, String token) {
        String resetLink = frontendProperties.origin()
                + "/reset-password?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
        logDevLink("password-reset", resetLink);

        String htmlContent = htmlTemplate.render("email/password-reset.html", Map.of(
                "resetLink", resetLink));

        sendHtmlEmail(
                recipientEmail,
                "SmolyanVote.bg - Възстановяване на парола",
                htmlContent,
                "Моля, кликнете на линка за възстановяване на парола: " + resetLink);
    }

    private void logDevLink(String kind, String link) {
        if (environment.matchesProfiles("dev")) {
            log.info("DEV {} link (use this if the mailbox blocks localhost): {}", kind, link);
        }
    }

    @Override
    public void sendPodcastNotification(UserEntity user, Object podcastEpisode) {
        if (!(podcastEpisode instanceof PodcastEpisodeEntity episode)) {
            throw new IllegalArgumentException("Expected PodcastEpisodeEntity");
        }

        String episodeLink = frontendProperties.origin() + "/podcast?episode=" + episode.getId();
        String username = user.getUsername() == null ? "" : user.getUsername();
        String description = episode.getDescription() == null ? "" : episode.getDescription();

        String htmlContent = htmlTemplate.render("email/podcast-notification.html", Map.of(
                "episodeTitle", episode.getTitle() == null ? "Нов епизод" : episode.getTitle(),
                "usernameSuffix", username.isBlank() ? "" : ", " + username,
                "episodeDescription", description,
                "episodeLink", episodeLink));

        sendHtmlEmail(
                user.getEmail(),
                "Нов епизод: " + episode.getTitle(),
                htmlContent,
                "Нов епизод от SmolyanVote подкаста: " + episode.getTitle() + " — " + episodeLink);
    }

    /**
     * Single Mailjet send path — confirmation, reset and podcast all go through here.
     */
    private void sendHtmlEmail(String recipientEmail, String subject, String htmlContent, String textContent) {
        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", senderEmail)
                                            .put("Name", senderName))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", recipientEmail)))
                                    .put(Emailv31.Message.SUBJECT, subject)
                                    .put(Emailv31.Message.HTMLPART, htmlContent)
                                    .put(Emailv31.Message.TEXTPART, textContent)));

            MailjetResponse response = client.post(request);
            assertMailjetAccepted(response, recipientEmail, subject);
            log.info("Mailjet accepted email subject='{}' toDomain={}",
                    subject, emailDomain(recipientEmail));
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Error sending email via Mailjet: " + e.getMessage(), e);
        }
    }

    private static void assertMailjetAccepted(MailjetResponse response, String recipientEmail, String subject) {
        int status = response.getStatus();
        String body = response.getData() == null ? "" : response.getData().toString();

        if (status < 200 || status >= 300) {
            throw new RuntimeException(
                    "Mailjet HTTP " + status + " for subject='" + subject
                            + "' toDomain=" + emailDomain(recipientEmail) + " body=" + truncate(body, 500));
        }

        // v3.1 can return HTTP 200 with Messages[].Status=error
        if (body.contains("\"Status\":\"error\"") || body.contains("\"Status\": \"error\"")) {
            throw new RuntimeException(
                    "Mailjet rejected message for subject='" + subject
                            + "' toDomain=" + emailDomain(recipientEmail) + " body=" + truncate(body, 500));
        }
    }

    private static String emailDomain(String email) {
        if (email == null) return "?";
        int at = email.indexOf('@');
        return at >= 0 ? email.substring(at + 1) : "?";
    }

    private static String truncate(String value, int max) {
        if (value == null) return "";
        return value.length() <= max ? value : value.substring(0, max) + "...";
    }

    @Override
    public void sendElectionUpdate(UserEntity user, Object election) {
        // TODO: Implement later
    }

    @Override
    public void sendCityNews(UserEntity user, Object newsItem) {
        // TODO: Implement later
    }

    @Override
    public void sendBulkEmail(List<UserEntity> recipients, String subject, String templateName, Map<String, Object> variables) {
        // TODO: Implement later
    }

    @Override
    public void sendNewsletterEmail(UserEntity user, Map<String, Object> content) {
        // TODO: Implement later
    }

    @Override
    public void sendSubscriptionConfirmation(UserEntity user, Set<SubscriptionType> subscriptions) {

    }

    @Override
    public void sendUnsubscribeConfirmation(UserEntity user, SubscriptionType type) {
        // TODO: Implement later
    }
}
