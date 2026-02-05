package smolyanVote.virtualMajor.services.interfaces;

import smolyanVote.virtualMajor.viewsAndDTO.AIResponseDTO;
import smolyanVote.virtualMajor.viewsAndDTO.GameStateDTO;

/**
 * Service interface for Gemini AI integration.
 * Handles communication with Google Gemini API for game event generation and
 * analysis.
 */
public interface GeminiAIService {

    /**
     * Generate AI-driven game events based on current game state.
     * This is called during turn processing to create dynamic events for the
     * player.
     *
     * @param gameState the current game state
     * @return AIResponseDTO containing analysis and generated events
     */
    AIResponseDTO generateGameEvents(GameStateDTO gameState);

    /**
     * Analyze the current game state and provide strategic insights.
     * Used when player requests analysis from the AI assistant.
     *
     * @param gameState the current game state
     * @return Analysis text from AI
     */
    String analyzeGameState(GameStateDTO gameState);

    /**
     * Generate an end-of-year report summarizing the year's progress.
     * Called at the end of each game year (month 12).
     *
     * @param gameState the current game state
     * @return Yearly report text from AI
     */
    String generateYearlyReport(GameStateDTO gameState);
}
