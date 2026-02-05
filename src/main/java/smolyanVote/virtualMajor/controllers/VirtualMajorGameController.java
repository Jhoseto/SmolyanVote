package smolyanVote.virtualMajor.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.virtualMajor.services.interfaces.GameSessionService;
import smolyanVote.virtualMajor.services.interfaces.StrategicAnalysisAIService;
import smolyanVote.virtualMajor.services.interfaces.VirtualMajorGameService;
import smolyanVote.virtualMajor.viewsAndDTO.*;

/**
 * REST Controller for Virtual Major game operations.
 * Handles game session management and turn processing.
 */
@RestController
@RequestMapping("/api/virtualmajor")
public class VirtualMajorGameController {

    private final GameSessionService gameSessionService;
    private final VirtualMajorGameService virtualMajorGameService;
    private final StrategicAnalysisAIService strategicAnalysisAIService;
    private final UserService userService;

    public VirtualMajorGameController(GameSessionService gameSessionService,
            VirtualMajorGameService virtualMajorGameService,
            StrategicAnalysisAIService strategicAnalysisAIService,
            UserService userService) {
        this.gameSessionService = gameSessionService;
        this.virtualMajorGameService = virtualMajorGameService;
        this.strategicAnalysisAIService = strategicAnalysisAIService;
        this.userService = userService;
    }

    /**
     * Debug endpoint to test authentication.
     * Returns current user info or NULL if not authenticated.
     */
    @GetMapping("/debug-auth")
    public ResponseEntity<String> debugAuth() {
        UserEntity user = userService.getCurrentUser();
        if (user != null) {
            return ResponseEntity.ok("✅ Authenticated as: " + user.getEmail() + " (ID: " + user.getId() + ")");
        } else {
            return ResponseEntity.ok("❌ User is NULL - Not authenticated or session not loaded");
        }
    }

    /**
     * Create a new game session for the authenticated user.
     * Automatically deactivates any existing active session.
     *
     * @return GameSessionDTO containing the initial game state
     */
    @PostMapping("/new-game")
    public ResponseEntity<GameSessionDTO> createNewGame() {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        GameSessionDTO session = gameSessionService.createNewGameByEmail(user.getEmail());
        return ResponseEntity.ok(session);
    }

    /**
     * Load the active game session for the authenticated user.
     *
     * @return LoadGameResponse indicating if a game exists and providing the game
     *         state
     */
    @GetMapping("/load-game")
    public ResponseEntity<LoadGameResponse> loadGame() {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        LoadGameResponse response = gameSessionService.loadGameByEmail(user.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Save the current game state for the authenticated user.
     *
     * @param request the game state to save
     * @return GameSessionDTO confirming the save operation
     */
    @PostMapping("/save-game")
    public ResponseEntity<GameSessionDTO> saveGame(@RequestBody SaveGameRequest request) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        GameSessionDTO session = gameSessionService.saveGameByEmail(user.getEmail(), request.getGameState());
        return ResponseEntity.ok(session);
    }

    /**
     * Process a game turn with AI-generated events.
     * This is the main endpoint for advancing the game by one month.
     *
     * @param request the current game state
     * @return AIResponseDTO containing new events and analysis
     */
    @PostMapping("/process-turn")
    public ResponseEntity<AIResponseDTO> processTurn(@RequestBody ProcessTurnRequest request) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        AIResponseDTO aiResponse = virtualMajorGameService.processTurn(user.getId(), request.getGameState());

        // Save the updated state after processing
        gameSessionService.saveGameByEmail(user.getEmail(), request.getGameState());

        return ResponseEntity.ok(aiResponse);
    }

    /**
     * Delete the current game session.
     *
     * @param sessionId the session ID to delete
     * @return 204 No Content on success
     */
    @DeleteMapping("/delete-game")
    public ResponseEntity<Void> deleteGame(@RequestParam Long sessionId) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        gameSessionService.deleteGame(sessionId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * End the current game and update statistics.
     *
     * @param sessionId the session ID to end
     * @param won       whether the game was won or lost
     * @return 200 OK on success
     */
    @PostMapping("/end-game")
    public ResponseEntity<Void> endGame(@RequestParam Long sessionId, @RequestParam Boolean won) {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        gameSessionService.endGame(sessionId, user.getId(), won);
        return ResponseEntity.ok().build();
    }

    /**
     * Get deep strategic analysis for the current game session.
     * 
     * @return StrategicAnalysisDTO containing narrative and charts data
     */
    @GetMapping("/strategic-analysis")
    public ResponseEntity<StrategicAnalysisDTO> getStrategicAnalysis() {
        UserEntity user = userService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).build();
        }

        StrategicAnalysisDTO analysis = strategicAnalysisAIService.generateAnalysis(user.getEmail());
        return ResponseEntity.ok(analysis);
    }
}
