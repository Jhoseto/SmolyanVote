package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.EmailSubscriptionEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailSubscriptionRepository extends JpaRepository<EmailSubscriptionEntity, Long> {

    // Основни query методи
    List<EmailSubscriptionEntity> findByUser(UserEntity user);

    List<EmailSubscriptionEntity> findAllByUser(UserEntity user);

    @Query("SELECT e FROM EmailSubscriptionEntity e WHERE e.user = :user AND e.isActive = true")
    List<EmailSubscriptionEntity> findActiveByUser(@Param("user") UserEntity user);

    Optional<EmailSubscriptionEntity> findByUserAndType(UserEntity user, SubscriptionType type);

    @Query("SELECT e FROM EmailSubscriptionEntity e WHERE e.user = :user AND e.type = :type AND e.isActive = true")
    Optional<EmailSubscriptionEntity> findActiveByUserAndType(@Param("user") UserEntity user, @Param("type") SubscriptionType type);

    // Намира всички активни абонати за определен тип
    @Query("SELECT DISTINCT e.user FROM EmailSubscriptionEntity e WHERE e.type = :type AND e.isActive = true")
    List<UserEntity> findActiveSubscribersByType(@Param("type") SubscriptionType type);

    // Token операции
    Optional<EmailSubscriptionEntity> findByUnsubscribeToken(String unsubscribeToken);

    // Деактивиране на абонаменти
    @Modifying
    @Query("UPDATE EmailSubscriptionEntity e SET e.isActive = false WHERE e.user = :user")
    void deactivateAllByUser(@Param("user") UserEntity user);

    @Modifying
    @Query("UPDATE EmailSubscriptionEntity e SET e.isActive = false WHERE e.user = :user AND e.type = :type")
    void deactivateByUserAndType(@Param("user") UserEntity user, @Param("type") SubscriptionType type);

    // Изтриване
    void deleteByUser(UserEntity user);

    void deleteByUserAndType(UserEntity user, SubscriptionType type);

    // Статистики и броене
    @Query("SELECT COUNT(DISTINCT e.user) FROM EmailSubscriptionEntity e WHERE e.isActive = true")
    long countDistinctActiveSubscribers();

    @Query("SELECT COUNT(e) FROM EmailSubscriptionEntity e WHERE e.type = :type AND e.isActive = true")
    long countActiveByType(@Param("type") SubscriptionType type);

    @Query("SELECT COUNT(e) FROM EmailSubscriptionEntity e WHERE e.user = :user AND e.isActive = true")
    long countActiveByUser(@Param("user") UserEntity user);

    boolean existsByUserAndTypeAndIsActive(UserEntity user, SubscriptionType type, boolean isActive);

    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM EmailSubscriptionEntity e WHERE e.user = :user AND e.type = :type AND e.isActive = true")
    boolean existsActiveByUserAndType(@Param("user") UserEntity user, @Param("type") SubscriptionType type);
}