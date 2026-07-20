package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;
import smolyanVote.smolyanVote.services.interfaces.SubscriptionService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SubscriptionRequest;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.SubscriptionResponse;

import java.util.Set;

/**
 * Тънък JSON контролер за footer newsletter (email subscriptions), ползван
 * от новия Next.js frontend. Изисква authentication (JWT) — LoginGate на
 * frontend-а пренасочва анонимните потребители преди извикване. Делегира
 * към {@link SubscriptionService}, без нова бизнес логика тук.
 */
@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserService userService;

    public SubscriptionController(SubscriptionService subscriptionService, UserService userService) {
        this.subscriptionService = subscriptionService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<SubscriptionResponse> current() {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        return ResponseEntity.ok(new SubscriptionResponse(true, subscriptionService.getUserSubscriptions(user)));
    }

    @PostMapping
    public ResponseEntity<SubscriptionResponse> update(@RequestBody SubscriptionRequest request) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        Set<SubscriptionType> types = request.types() != null ? request.types() : Set.of();
        subscriptionService.updateUserSubscriptions(user, types);

        return ResponseEntity.ok(new SubscriptionResponse(true, types));
    }
}
