package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;

import java.util.List;

@Repository
public interface UserRoleAndBansHistoryRepository extends JpaRepository<UserRoleAndBansHistoryEntity, Long> {


    List<UserRoleAndBansHistoryEntity> findAllOrderByTimestampDesc();

    List<UserRoleAndBansHistoryEntity> findByTargetUsernameOrderByActionTimestampDesc(String username);

    List<UserRoleAndBansHistoryEntity> findRecentHistory(int limit);
}
