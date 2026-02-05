package smolyanVote.virtualMajor.services.interfaces;

import smolyanVote.virtualMajor.viewsAndDTO.GameSessionDTO;
import smolyanVote.virtualMajor.viewsAndDTO.GameStateDTO;
import smolyanVote.virtualMajor.viewsAndDTO.LoadGameResponse;

/**
 * Service interface for managing game sessions.
 * Handles creation, saving, loading, and deletion of game sessions.
 */
public interface GameSessionService {

    /**
     * Create a new game session for a user with default initial values.
     *
     * @param userId the ID of the user
     * @return GameSessionDTO containing the new game state
     */
    GameSessionDTO createNewGame(Long userId);

    /**
     * Create a new game session for a user with default initial values.
     *
     * @param userEmail the email of the user
     * @return GameSessionDTO containing the new game state
     */
    GameSessionDTO createNewGameByEmail(String userEmail);

    /**
     * Save the current game state for a user.
     * Updates the existing active session or creates a new one if none exists.
     *
     * @param userId    the ID of the user
     * @param gameState the current game state to save
     * @return GameSessionDTO confirming the save operation
     */
    GameSessionDTO saveGame(Long userId, GameStateDTO gameState);

    /**
     * Save the current game state for a user.
     * Updates the existing active session or creates a new one if none exists.
     *
     * @param userEmail the email of the user
     * @param gameState the current game state to save
     * @return GameSessionDTO confirming the save operation
     */
    GameSessionDTO saveGameByEmail(String userEmail, GameStateDTO gameState);

    /**
     * Load the active game session for a user.
     *
     * @param userId the ID of the user
     * @return LoadGameResponse indicating if a game exists and providing the game
     *         state
     */
    LoadGameResponse loadGame(Long userId);

    /**
     * Load the active game session for a user.
     *
     * @param userEmail the email of the user
     * @return LoadGameResponse indicating if a game exists and providing the game
     *         state
     */
    LoadGameResponse loadGameByEmail(String userEmail);

    /**
     * Delete a game session.
     *
     * @param sessionId the ID of the game session to delete
     * @param userId    the ID of the user (for authorization check)
     */
    void deleteGame(Long sessionId, Long userId);

    /**
     * Mark a game session as ended and update statistics.
     *
     * @param sessionId the ID of the game session
     * @param userId    the ID of the user (for authorization check)
     * @param won       whether the game was won or lost
     */
    void endGame(Long sessionId, Long userId, Boolean won);

    /**
     * Convert GameStateDTO to Entity for persistence.
     *
     * @param gameState the game state DTO
     * @param session   the session entity to update
     */
    void updateEntityFromDTO(GameStateDTO gameState, smolyanVote.virtualMajor.models.GameSessionEntity session);

    /**
     * Convert Entity to GameStateDTO for response.
     *
     * @param session the session entity
     * @return GameStateDTO representation
     */
    GameStateDTO convertToDTO(smolyanVote.virtualMajor.models.GameSessionEntity session);
}
