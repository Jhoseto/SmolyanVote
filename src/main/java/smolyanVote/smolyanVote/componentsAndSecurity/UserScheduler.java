package smolyanVote.smolyanVote.scheduling;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class UserScheduler {

    private final UserRepository userRepository;

    @Autowired
    public UserScheduler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // маркиране на неактивни потребители като офлайн (ако не са активни последните 2 минути)
    @Transactional
    @Scheduled(fixedRate = 120000)
    public void checkInactiveUsers() {
        System.out.println("🔍 Scheduled: Checking inactive users...");

        Instant twoMinutesAgo = Instant.now().minus(2, ChronoUnit.MINUTES);
        List<UserEntity> inactiveUsers = userRepository.findByOnlineStatusAndLastOnlineBefore(1, twoMinutesAgo);

        for (UserEntity user : inactiveUsers) {
            user.setOnlineStatus(0);
            user.setLastOnline(Instant.now());
        }

        userRepository.saveAll(inactiveUsers);
        System.out.println("✅ Неактивните потребители са отбелязани като офлайн.");
    }




}
