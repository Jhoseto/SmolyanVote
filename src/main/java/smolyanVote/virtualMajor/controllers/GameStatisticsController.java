package smolyanVote.virtualMajor.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.virtualMajor.services.interfaces.GameStatisticsService;
import smolyanVote.virtualMajor.viewsAndDTO.GameStatisticsDTO;

/**
 * REST Controller for game statistics operations.
 * Handles user achievement and high score tracking.
 */
@RestController
@RequestMapping("/api/virtualmajor/statistics")
@CrossOrigin(origins = "*") // Adjust in production
public class GameStatisticsController {

    private final GameStatisticsService gameStatisticsService;

    public GameStatisticsController(GameStatisticsService gameStatisticsService) {
        this.gameStatisticsService = gameStatisticsService;
    }

    /**
     * Get statistics for the authenticated user.
     *
     * @param user the authenticated user
     * @return GameStatisticsDTO containing user's statistics
     */
    @GetMapping("/user")
    public ResponseEntity<GameStatisticsDTO> getUserStatistics(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        GameStatisticsDTO statistics = gameStatisticsService.getUserStatistics(user.getId());
        return ResponseEntity.ok(statistics);
    }
}
