package smolyanVote.virtualMajor.viewsAndDTO;

/**
 * Request DTO for processing a game turn.
 * Contains the current game state to process with AI.
 */
public class ProcessTurnRequest {

    private GameStateDTO gameState;

    // ===== CONSTRUCTORS =====

    public ProcessTurnRequest() {
    }

    public ProcessTurnRequest(GameStateDTO gameState) {
        this.gameState = gameState;
    }

    // ===== GETTERS AND SETTERS =====

    public GameStateDTO getGameState() {
        return gameState;
    }

    public void setGameState(GameStateDTO gameState) {
        this.gameState = gameState;
    }
}
