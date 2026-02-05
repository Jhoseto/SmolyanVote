package smolyanVote.virtualMajor.viewsAndDTO;

/**
 * Request DTO for saving game state.
 * Contains the complete game state to be persisted.
 */
public class SaveGameRequest {

    private GameStateDTO gameState;

    // ===== CONSTRUCTORS =====

    public SaveGameRequest() {
    }

    public SaveGameRequest(GameStateDTO gameState) {
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
