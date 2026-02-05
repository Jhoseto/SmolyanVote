package smolyanVote.virtualMajor.models.enums;

/**
 * Enum representing different types of events that can occur in the Virtual
 * Major game.
 * Used for categorizing and tracking game events in the event history.
 */
public enum GameEventType {
    /**
     * Event when a new investment project is started
     */
    INVESTMENT_START,

    /**
     * Event when an investment project is completed
     */
    PROJECT_COMPLETE,

    /**
     * Daily routine AI-generated event
     */
    AI_EVENT_DAILY,

    /**
     * Economic AI-generated event
     */
    AI_EVENT_ECONOMIC,

    /**
     * Strategic AI-generated event
     */
    AI_EVENT_STRATEGIC,

    /**
     * Emergency AI-generated event requiring immediate attention
     */
    AI_EVENT_EMERGENCY,

    /**
     * Event when tax rates are changed
     */
    TAX_CHANGE,

    /**
     * Event when budget allocation is modified
     */
    BUDGET_ALLOCATION,

    /**
     * Event when a region enters crisis state
     */
    REGION_CRISIS,

    /**
     * Event when an intervention is applied to a region
     */
    REGION_INTERVENTION,

    /**
     * Event when a new game is started
     */
    GAME_START,

    /**
     * Event when the game ends (win or loss)
     */
    GAME_OVER
}
