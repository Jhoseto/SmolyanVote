package smolyanVote.smolyanVote.services.serviceImpl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.EmailSubscriptionEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;
import smolyanVote.smolyanVote.repositories.EmailSubscriptionRepository;
import smolyanVote.smolyanVote.services.interfaces.EmailService;
import smolyanVote.smolyanVote.services.interfaces.SubscriptionService;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {

    private final EmailSubscriptionRepository emailSubscriptionRepository;

    // Lazy injection за да избегнем цикличната зависимост
    @Lazy
    @Autowired
    private EmailService emailService;

    @Autowired
    public SubscriptionServiceImpl(EmailSubscriptionRepository emailSubscriptionRepository) {
        this.emailSubscriptionRepository = emailSubscriptionRepository;
    }

    @Transactional
    @Override
    public void updateUserSubscriptions(UserEntity user, Set<SubscriptionType> types) {
        emailSubscriptionRepository.deactivateAllByUser(user);

        types.forEach(type -> {
            Optional<EmailSubscriptionEntity> existingSubscription =
                    emailSubscriptionRepository.findByUserAndType(user, type);

            EmailSubscriptionEntity subscription;
            if (existingSubscription.isPresent()) {
                // Реактивираме съществуващия
                subscription = existingSubscription.get();
                subscription.setActive(true);
                subscription.setSubscribedAt(Instant.now());
            } else {
                // Създаваме нов
                subscription = new EmailSubscriptionEntity();
                subscription.setUser(user);
                subscription.setType(type);
                subscription.setSubscribedAt(Instant.now());
                subscription.setActive(true);
                subscription.setUnsubscribeToken(UUID.randomUUID().toString());
            }

            emailSubscriptionRepository.save(subscription);
        });

        log.info("Updated subscriptions for user {}: {}", user.getEmail(), types);
    }

    @Override
    public Set<SubscriptionType> getUserSubscriptions(UserEntity user) {
        return emailSubscriptionRepository.findActiveByUser(user)
                .stream()
                .map(EmailSubscriptionEntity::getType)
                .collect(Collectors.toSet());
    }

    @Override
    public List<UserEntity> getSubscribersForType(SubscriptionType type) {
        return emailSubscriptionRepository.findActiveSubscribersByType(type);
    }

    @Override
    public String getUnsubscribeToken(UserEntity user, SubscriptionType type) {
        return emailSubscriptionRepository.findByUserAndType(user, type)
                .map(EmailSubscriptionEntity::getUnsubscribeToken)
                .orElse("");
    }

    @Transactional
    @Override
    public boolean unsubscribeByToken(String token) {
        Optional<EmailSubscriptionEntity> subscription =
                emailSubscriptionRepository.findByUnsubscribeToken(token);

        if (subscription.isPresent()) {
            EmailSubscriptionEntity sub = subscription.get();
            sub.setActive(false);
            emailSubscriptionRepository.save(sub);

            log.info("User {} unsubscribed from {} using token",
                    sub.getUser().getEmail(), sub.getType());
            return true;
        }

        log.warn("Invalid unsubscribe token attempted: {}", token);
        return false;
    }

    @Override
    public Map<SubscriptionType, Long> getSubscriptionStats() {
        Map<SubscriptionType, Long> stats = new HashMap<>();

        for (SubscriptionType type : SubscriptionType.values()) {
            long count = emailSubscriptionRepository.countActiveByType(type);
            stats.put(type, count);
        }

        return stats;
    }

    @Override
    public long getTotalSubscribersCount() {
        return emailSubscriptionRepository.countDistinctActiveSubscribers();
    }

    // Async методи за изпращане на известия
    @Async
    @Override
    public void sendPodcastNotificationToSubscribers(Object podcastEpisode) {
        List<UserEntity> subscribers = getSubscribersForType(SubscriptionType.PODCAST_EPISODES);

        log.info("Sending podcast notification to {} subscribers", subscribers.size());

        subscribers.forEach(user -> {
            try {
                emailService.sendPodcastNotification(user, podcastEpisode);
                // Rate limiting - 100ms между email-и
                Thread.sleep(100);
            } catch (Exception e) {
                log.error("Failed to send podcast notification to user: {}", user.getEmail(), e);
            }
        });

        log.info("Finished sending podcast notifications");
    }

    @Override
    public void sendElectionUpdateToSubscribers(Object election) {
        // TODO: Implement later
    }

    @Override
    public void sendCityNewsToSubscribers(Object newsItem) {
        // TODO: Implement later
    }

    // Utility методи
    @Override
    public boolean isUserSubscribedTo(UserEntity user, SubscriptionType type) {
        return emailSubscriptionRepository.findByUserAndType(user, type)
                .map(EmailSubscriptionEntity::isActive)
                .orElse(false);
    }

    @Transactional
    @Override
    public void subscribeUserTo(UserEntity user, SubscriptionType type) {
        Set<SubscriptionType> currentSubscriptions = getUserSubscriptions(user);
        currentSubscriptions.add(type);
        updateUserSubscriptions(user, currentSubscriptions);
    }

    @Transactional
    @Override
    public void unsubscribeUserFrom(UserEntity user, SubscriptionType type) {
        Optional<EmailSubscriptionEntity> subscription =
                emailSubscriptionRepository.findByUserAndType(user, type);

        if (subscription.isPresent()) {
            EmailSubscriptionEntity sub = subscription.get();
            sub.setActive(false);
            emailSubscriptionRepository.save(sub);

            log.info("User {} unsubscribed from {}", user.getEmail(), type);
        }
    }

    // GDPR методи
    @Transactional
    @Override
    public void deleteAllUserSubscriptions(UserEntity user) {
        emailSubscriptionRepository.deleteByUser(user);
        log.info("Deleted all subscriptions for user: {}", user.getEmail());
    }

    @Override
    public List<EmailSubscriptionEntity> exportUserSubscriptionData(UserEntity user) {
        return emailSubscriptionRepository.findAllByUser(user);
    }
}