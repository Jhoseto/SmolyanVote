package smolyanVote.virtualMajor.viewsAndDTO;

/**
 * Response DTO for loading game state.
 * Indicates whether an active game exists and provides the game state if
 * available.
 */
public class LoadGameResponse {

    private Boolean hasActiveGame;
    private GameStateDTO gameState;

    // ===== CONSTRUCTORS =====

    public LoadGameResponse() {
    }

    public LoadGameResponse(Boolean hasActiveGame, GameStateDTO gameState) {
        this.hasActiveGame = hasActiveGame;
        this.gameState = gameState;
    }

    // ===== GETTERS AND SETTERS =====

    public Boolean getHasActiveGame() {
        return hasActiveGame;
    }

    public void setHasActiveGame(Boolean hasActiveGame) {
        this.hasActiveGame = hasActiveGame;
    }

    public GameStateDTO getGameState() {
        return gameState;
    }

    public void setGameState(GameStateDTO gameState) {
        this.gameState = gameState;
    }
}
