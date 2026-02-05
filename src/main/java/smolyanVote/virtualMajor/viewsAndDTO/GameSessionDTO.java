package smolyanVote.virtualMajor.viewsAndDTO;

/**
 * Response DTO for session operations.
 * Contains the session ID for reference.
 */
public class GameSessionDTO {

    private Long sessionId;
    private GameStateDTO gameState;
    private String message;

    // ===== CONSTRUCTORS=====

    public GameSessionDTO() {
    }

    public GameSessionDTO(Long sessionId, GameStateDTO gameState, String message) {
        this.sessionId = sessionId;
        this.gameState = gameState;
        this.message = message;
    }

    // ===== GETTERS AND SETTERS =====

    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public GameStateDTO getGameState() {
        return gameState;
    }

    public void setGameState(GameStateDTO gameState) {
        this.gameState = gameState;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
