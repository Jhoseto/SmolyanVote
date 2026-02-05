package smolyanVote.virtualMajor.services.interfaces;

import smolyanVote.virtualMajor.models.enums.GameEventType;
import smolyanVote.virtualMajor.viewsAndDTO.AIResponseDTO;
import smolyanVote.virtualMajor.viewsAndDTO.GameStateDTO;

/**
 * Service interface for game logic and turn processing.
 * Handles game mechanics, resource calculations, and turn progression.
 */
public interface VirtualMajorGameService {

    /**
     * Process a complete game turn including AI events and resource updates.
     * This is the main entry point for advancing the game by one month.
     *
     * @param userId    the ID of the user
     * @param gameState the current game state
     * @return AIResponseDTO containing new events and analysis
     */
    AIResponseDTO processTurn(Long userId, GameStateDTO gameState);

    /**
     * Calculate resource changes for the current turn.
     * Includes income, expenses, population changes, etc.
     *
     * @param gameState the current game state
     */
    void calculateResourceChanges(GameStateDTO gameState);

    /**
     * Check if game over conditions have been met.
     *
     * @param gameState the current game state
     * @return true if game should end, false otherwise
     */
    boolean checkGameOverConditions(GameStateDTO gameState);

    /**
     * Log an event to the game session history.
     *
     * @param sessionId   the ID of the game session
     * @param month       the month when eventoccurred
     * @param year        the year when event occurred
     * @param eventType   the type of event
     * @param title       event title
     * @param description event description
     * @param impactJson  JSON representation of resource impacts
     */
    void logEvent(Long sessionId, Integer month, Integer year, GameEventType eventType,
            String title, String description, String impactJson);
}
