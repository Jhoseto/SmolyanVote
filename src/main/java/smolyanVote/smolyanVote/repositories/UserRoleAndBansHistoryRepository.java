package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;

import java.util.List;

@Repository
public interface UserRoleAndBansHistoryRepository extends JpaRepository<UserRoleAndBansHistoryEntity, Long> {

    @Query("SELECT h FROM UserRoleAndBansHistoryEntity h ORDER BY h.actionTimestamp DESC")
    List<UserRoleAndBansHistoryEntity> findAllOrderByTimestampDesc();

    @Query("SELECT h FROM UserRoleAndBansHistoryEntity h WHERE h.targetUsername = :username ORDER BY h.actionTimestamp DESC")
    List<UserRoleAndBansHistoryEntity> findByTargetUsernameOrderByActionTimestampDesc(@Param("username") String username);

    @Query(value = "SELECT * FROM user_role_and_bans_history ORDER BY action_timestamp DESC LIMIT :limit", nativeQuery = true)
    List<UserRoleAndBansHistoryEntity> findRecentHistory(@Param("limit") int limit);
}