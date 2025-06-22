package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.EmailSubscriptionEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface SubscriptionService {

    // Основни операции
    void updateUserSubscriptions(UserEntity user, Set<SubscriptionType> types);
    Set<SubscriptionType> getUserSubscriptions(UserEntity user);
    List<UserEntity> getSubscribersForType(SubscriptionType type);

    // Token операции
    String getUnsubscribeToken(UserEntity user, SubscriptionType type);
    boolean unsubscribeByToken(String token);

    // Статистики
    Map<SubscriptionType, Long> getSubscriptionStats();
    long getTotalSubscribersCount();

    // Async notification методи
    void sendPodcastNotificationToSubscribers(Object podcastEpisode);
    void sendElectionUpdateToSubscribers(Object election);
    void sendCityNewsToSubscribers(Object newsItem);

    // Utility методи
    boolean isUserSubscribedTo(UserEntity user, SubscriptionType type);
    void subscribeUserTo(UserEntity user, SubscriptionType type);
    void unsubscribeUserFrom(UserEntity user, SubscriptionType type);

    // GDPR методи
    void deleteAllUserSubscriptions(UserEntity user);
    List<EmailSubscriptionEntity> exportUserSubscriptionData(UserEntity user);
}