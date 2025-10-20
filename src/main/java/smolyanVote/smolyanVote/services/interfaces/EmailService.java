package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface EmailService {

    /**
     * Изпраща confirmation email на потребител при регистрация
     * @param recipientEmail email адресът на получателя
     */
    void sendConfirmationEmail(String recipientEmail);

    /**
     * Изпраща известие за нов podcast епизод
     * @param user потребителят получател
     * @param podcastEpisode епизодът (PodcastEpisodeEntity)
     */
    void sendPodcastNotification(UserEntity user, Object podcastEpisode);

    /**
     * Изпраща актуализация за избори/гласувания
     * @param user потребителят получател
     * @param election избора/гласуването
     */
    void sendElectionUpdate(UserEntity user, Object election);

    /**
     * Изпраща новини за града
     * @param user потребителят получател
     * @param newsItem новината
     */
    void sendCityNews(UserEntity user, Object newsItem);

    /**
     * Изпраща bulk email до множество получатели
     * @param recipients списък с потребители
     * @param subject темата на email-а
     * @param templateName името на template-а
     * @param variables променливи за template-а
     */
    void sendBulkEmail(List<UserEntity> recipients, String subject, String templateName, Map<String, Object> variables);

    /**
     * Изпраща newsletter email
     * @param user потребителят получател
     * @param content съдържанието на newsletter-а
     */
    void sendNewsletterEmail(UserEntity user, Map<String, Object> content);

    /**
     * Изпраща потвърждение за промяна в абонаментите
     * @param user потребителят
     * @param subscriptions новите абонаменти
     */
    void sendSubscriptionConfirmation(UserEntity user, Set<SubscriptionType> subscriptions);

    /**
     * Изпраща потвърждение за отписване от абонамент
     * @param user потребителят
     * @param type типът абонамент от който се отписва
     */
    void sendUnsubscribeConfirmation(UserEntity user, SubscriptionType type);

    /**
     * Изпраща имейл за възстановяване на парола
     * @param recipientEmail email адресът на получателя
     * @param token токенът за възстановяване
     */
    void sendPasswordResetEmail(String recipientEmail, String token);
}