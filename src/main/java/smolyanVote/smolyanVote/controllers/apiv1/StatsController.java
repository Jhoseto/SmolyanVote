package smolyanVote.smolyanVote.controllers.apiv1;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.services.interfaces.HomeStatsService;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.HomeStatsResponse;

/**
 * Public /api/v1 endpoints consumed by the new Next.js frontend.
 * Routing only — aggregation lives in {@link HomeStatsService}.
 */
@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    private final HomeStatsService homeStatsService;

    public StatsController(HomeStatsService homeStatsService) {
        this.homeStatsService = homeStatsService;
    }

    @GetMapping("/home")
    public ResponseEntity<HomeStatsResponse> home() {
        return ResponseEntity.ok(homeStatsService.getHomeStats());
    }
}
