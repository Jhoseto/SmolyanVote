package smolyanVote.smolyanVote.controllers;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.time.Instant;

@Slf4j
@RestController
public class HeartbeatController {

    private final UserRepository userRepository;
    private final UserService userService;

    public HeartbeatController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<String> heartbeat() {
        UserEntity currentUser = userService.getCurrentUser();

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        currentUser.setOnlineStatus(1);
        currentUser.setLastOnline(Instant.now());
        userRepository.save(currentUser);

        return ResponseEntity.ok("OK");
    }
}