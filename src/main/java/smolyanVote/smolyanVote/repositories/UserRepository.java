package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    // ===== ОСНОВНИ МЕТОДИ =====

    @Query("SELECT u FROM UserEntity u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<UserEntity> findByEmail(@Param("email") String email);

    @Query("SELECT u FROM UserEntity u WHERE LOWER(u.username) = LOWER(:username)")
    Optional<UserEntity> findByUsername(@Param("username") String username);

    @Query("SELECT u FROM UserEntity u WHERE u.onlineStatus = :status AND u.lastOnline < :time ORDER BY u.lastOnline")
    List<UserEntity> findByOnlineStatusAndLastOnlineBefore(@Param("status") int status, @Param("time") Instant time);

    // ===== OPTIMIZED МЕТОД ЗА ADMIN DASHBOARD =====

    @Query("SELECT u FROM UserEntity u ORDER BY u.created DESC")
    List<UserEntity> findAllUsersForAdminDashboard();

    // ===== МЕТОДИ ЗА SVMESSENGER =====

    @Query("SELECT u FROM UserEntity u WHERE " +
            "(LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.realName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
            "ORDER BY u.username")
    List<UserEntity> findByUsernameContainingIgnoreCaseOrRealNameContainingIgnoreCase(@Param("query") String query);

    List<UserEntity> findByUsernameContainingIgnoreCase(String trim);

    // ===== ONLINE USERS COUNT =====
    long countByOnlineStatus(int status);
}