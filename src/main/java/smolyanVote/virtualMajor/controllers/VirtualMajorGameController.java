package smolyanVote.virtualMajor.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.virtualMajor.services.interfaces.GameSessionService;
import smolyanVote.virtualMajor.services.interfaces.VirtualMajorGameService;
import smolyanVote.virtualMajor.viewsAndDTO.*;

/**
 * REST Controller for Virtual Major game operations.
 * Handles game session management and turn processing.
 */
@RestController
@RequestMapping("/api/virtualmajor")
@CrossOrigin(origins = "*") // Adjust in production
public class VirtualMajorGameController {

    private final GameSessionService gameSessionService;
    private final VirtualMajorGameService virtualMajorGameService;

    public VirtualMajorGameController(GameSessionService gameSessionService,
            VirtualMajorGameService virtualMajorGameService) {
        this.gameSessionService = gameSessionService;
        this.virtualMajorGameService = virtualMajorGameService;
    }

    /**
     * Create a new game session for the authenticated user.
     * Automatically deactivates any existing active session.
     *
     * @param user the authenticated user
     * @return GameSessionDTO containing the initial game state
     */
    @PostMapping("/new-game")
    public ResponseEntity<GameSessionDTO> createNewGame(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        GameSessionDTO session = gameSessionService.createNewGame(user.getId());
        return ResponseEntity.ok(session);
    }

    /**
     * Load the active game session for the authenticated user.
     *
     * @param user the authenticated user
     * @return LoadGameResponse indicating if a game exists and providing the game
     *         state
     */
    @GetMapping("/load-game")
    public ResponseEntity<LoadGameResponse> loadGame(@AuthenticationPrincipal UserEntity user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        LoadGameResponse response = gameSessionService.loadGame(user.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Save the current game state for the authenticated user.
     *
     * @param user    the authenticated user
     * @param request the game state to save
     * @return GameSessionDTO confirming the save operation
     */
    @PostMapping("/save-game")
    public ResponseEntity<GameSessionDTO> saveGame(@AuthenticationPrincipal UserEntity user,
            @RequestBody SaveGameRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        GameSessionDTO session = gameSessionService.saveGame(user.getId(), request.getGameState());
        return ResponseEntity.ok(session);
    }

    /**
     * Process a game turn with AI-generated events.
     * This is the main endpoint for advancing the game by one month.
     *
     * @param user    the authenticated user
     * @param request the current game state
     * @return AIResponseDTO containing new events and analysis
     */
    @PostMapping("/process-turn")
    public ResponseEntity<AIResponseDTO> processTurn(@AuthenticationPrincipal UserEntity user,
            @RequestBody ProcessTurnRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        AIResponseDTO aiResponse = virtualMajorGameService.processTurn(user.getId(), request.getGameState());

        // Save the updated state after processing
        gameSessionService.saveGame(user.getId(), request.getGameState());

        return ResponseEntity.ok(aiResponse);
    }

    /**
     * Delete the current game session.
     *
     * @param user the authenticated user
     * @return 204 No Content on success
     */
    @DeleteMapping("/delete-game")
    public ResponseEntity<Void> deleteGame(@AuthenticationPrincipal UserEntity user,
            @RequestParam Long sessionId) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        gameSessionService.deleteGame(sessionId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * End the current game and update statistics.
     *
     * @param user      the authenticated user
     * @param sessionId the session ID to end
     * @param won       whether the game was won or lost
     * @return 200 OK on success
     */
    @PostMapping("/end-game")
    public ResponseEntity<Void> endGame(@AuthenticationPrincipal UserEntity user,
            @RequestParam Long sessionId,
            @RequestParam Boolean won) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        gameSessionService.endGame(sessionId, user.getId(), won);
        return ResponseEntity.ok().build();
    }
}
