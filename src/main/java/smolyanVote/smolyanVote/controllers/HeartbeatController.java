package smolyanVote.smolyanVote.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.security.Principal;
import java.time.Instant;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class HeartbeatController {

    private final UserRepository userRepository;

    @PostMapping("/heartbeat")
    public ResponseEntity<Void> heartbeat(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<UserEntity> optionalUser = userRepository.findByUsername(principal.getName());
        if (optionalUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        UserEntity user = optionalUser.get();
        user.setOnlineStatus(1); 
        user.setLastOnline(Instant.now());
        userRepository.save(user);

        return ResponseEntity.ok().build();
    }
}
