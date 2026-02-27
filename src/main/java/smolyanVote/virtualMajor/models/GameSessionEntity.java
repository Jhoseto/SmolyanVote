package smolyanVote.virtualMajor.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * Entity representing a game session for the Virtual Major game.
 * Each user can have one active game session at a time.
 * Stores the complete game state including resources, investments, and game
 * progress.
 */
@Entity
@Table(name = "game_sessions")
public class GameSessionEntity extends BaseEntity {

    /**
     * The user who owns this game session
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /**
     * Optional name for the game session (e.g., "First Campaign", "Expert Run")
     */
    @Column(name = "session_name", length = 100)
    private String sessionName;

    /**
     * Current month in the game (1-12)
     */
    @Column(name = "current_month", nullable = false)
    private Integer currentMonth;

    /**
     * Current year in the game
     */
    @Column(name = "current_year", nullable = false)
    private Integer currentYear;

    /**
     * Last time the game was played
     */
    @Column(name = "last_played")
    private Instant lastPlayed;

    /**
     * When the game session was created
     */
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /**
     * Whether this is the active game session for the user
     * Only one active session per user allowed
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    // ===== GAME RESOURCES =====

    /**
     * City budget in euros
     */
    @Column(name = "budget", nullable = false)
    private Integer budget;

    /**
     * Trust level of citizens (0-100)
     */
    @Column(name = "trust", nullable = false)
    private Integer trust;

    /**
     * Infrastructure level (0-100)
     */
    @Column(name = "infrastructure", nullable = false)
    private Integer infrastructure;

    /**
     * Ecology/environment level (0-100)
     */
    @Column(name = "eco", nullable = false)
    private Integer eco;

    /**
     * City population count
     */
    @Column(name = "population", nullable = false)
    private Integer population;

    /**
     * Innovation level (0-100)
     */
    @Column(name = "innovation", nullable = false)
    private Integer innovation;

    // ===== TAXES =====

    /**
     * Property tax rate
     */
    @Column(name = "property_tax", nullable = false)
    private Double propertyTax;

    /**
     * Vehicle tax rate
     */
    @Column(name = "vehicle_tax", nullable = false)
    private Double vehicleTax;

    /**
     * Waste tax rate
     */
    @Column(name = "waste_tax", nullable = false)
    private Double wasteTax;

    // ===== BUDGETS =====

    /**
     * Budget allocated to culture
     */
    @Column(name = "culture_budget", nullable = false)
    private Integer cultureBudget;

    /**
     * Budget allocated to sport
     */
    @Column(name = "sport_budget", nullable = false)
    private Integer sportBudget;

    // ===== COMPLEX DATA AS JSON =====

    /**
     * JSON array of active investment projects in progress
     * Structure: [{id, name, cost, currentStep, totalSteps, ...}]
     */
    @Column(name = "investments_json", columnDefinition = "JSON")
    private String investmentsJson;

    /**
     * JSON array of available projects that can be purchased
     * Structure: [{id, name, cost, tier, description, ...}]
     */
    @Column(name = "available_projects_json", columnDefinition = "JSON")
    private String availableProjectsJson;

    /**
     * JSON object representing the state of all 9 city regions
     * Structure: {regionId: {status, activeIntervention, ...}, ...}
     */
    @Column(name = "regions_state_json", columnDefinition = "JSON")
    private String regionsStateJson;

    /**
     * JSON array of game event logs
     * Structure: ["Month 1: Event description", ...]
     */
    @Column(name = "logs_json", columnDefinition = "TEXT")
    private String logsJson;

    // ===== GAME STATUS =====

    /**
     * Number of consecutive months with negative budget
     * Used for game over condition
     */
    @Column(name = "consecutive_negative_budget", nullable = false)
    private Integer consecutiveNegativeBudget;

    /**
     * Whether the game has ended
     */
    @Column(name = "is_game_over", nullable = false)
    private Boolean isGameOver;

    /**
     * Reason why the game ended (if applicable)
     */
    @Column(name = "game_over_reason", length = 500)
    private String gameOverReason;

    // ===== CONSTRUCTORS =====

    public GameSessionEntity() {
        this.createdAt = Instant.now();
        this.lastPlayed = Instant.now();
        this.isActive = true;
        this.isGameOver = false;
        this.consecutiveNegativeBudget = 0;
    }

    // ===== GETTERS AND SETTERS =====

    public UserEntity getUser() {
        return user;
    }

    public GameSessionEntity setUser(UserEntity user) {
        this.user = user;
        return this;
    }

    public String getSessionName() {
        return sessionName;
    }

    public GameSessionEntity setSessionName(String sessionName) {
        this.sessionName = sessionName;
        return this;
    }

    public Integer getCurrentMonth() {
        return currentMonth;
    }

    public GameSessionEntity setCurrentMonth(Integer currentMonth) {
        this.currentMonth = currentMonth;
        return this;
    }

    public Integer getCurrentYear() {
        return currentYear;
    }

    public GameSessionEntity setCurrentYear(Integer currentYear) {
        this.currentYear = currentYear;
        return this;
    }

    public Instant getLastPlayed() {
        return lastPlayed;
    }

    public GameSessionEntity setLastPlayed(Instant lastPlayed) {
        this.lastPlayed = lastPlayed;
        return this;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public GameSessionEntity setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
        return this;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public GameSessionEntity setIsActive(Boolean isActive) {
        this.isActive = isActive;
        return this;
    }

    public Integer getBudget() {
        return budget;
    }

    public GameSessionEntity setBudget(Integer budget) {
        this.budget = budget;
        return this;
    }

    public Integer getTrust() {
        return trust;
    }

    public GameSessionEntity setTrust(Integer trust) {
        this.trust = trust;
        return this;
    }

    public Integer getInfrastructure() {
        return infrastructure;
    }

    public GameSessionEntity setInfrastructure(Integer infrastructure) {
        this.infrastructure = infrastructure;
        return this;
    }

    public Integer getEco() {
        return eco;
    }

    public GameSessionEntity setEco(Integer eco) {
        this.eco = eco;
        return this;
    }

    public Integer getPopulation() {
        return population;
    }

    public GameSessionEntity setPopulation(Integer population) {
        this.population = population;
        return this;
    }

    public Integer getInnovation() {
        return innovation;
    }

    public GameSessionEntity setInnovation(Integer innovation) {
        this.innovation = innovation;
        return this;
    }

    public Double getPropertyTax() {
        return propertyTax;
    }

    public GameSessionEntity setPropertyTax(Double propertyTax) {
        this.propertyTax = propertyTax;
        return this;
    }

    public Double getVehicleTax() {
        return vehicleTax;
    }

    public GameSessionEntity setVehicleTax(Double vehicleTax) {
        this.vehicleTax = vehicleTax;
        return this;
    }

    public Double getWasteTax() {
        return wasteTax;
    }

    public GameSessionEntity setWasteTax(Double wasteTax) {
        this.wasteTax = wasteTax;
        return this;
    }

    public Integer getCultureBudget() {
        return cultureBudget;
    }

    public GameSessionEntity setCultureBudget(Integer cultureBudget) {
        this.cultureBudget = cultureBudget;
        return this;
    }

    public Integer getSportBudget() {
        return sportBudget;
    }

    public GameSessionEntity setSportBudget(Integer sportBudget) {
        this.sportBudget = sportBudget;
        return this;
    }

    public String getInvestmentsJson() {
        return investmentsJson;
    }

    public GameSessionEntity setInvestmentsJson(String investmentsJson) {
        this.investmentsJson = investmentsJson;
        return this;
    }

    public String getAvailableProjectsJson() {
        return availableProjectsJson;
    }

    public GameSessionEntity setAvailableProjectsJson(String availableProjectsJson) {
        this.availableProjectsJson = availableProjectsJson;
        return this;
    }

    public String getRegionsStateJson() {
        return regionsStateJson;
    }

    public GameSessionEntity setRegionsStateJson(String regionsStateJson) {
        this.regionsStateJson = regionsStateJson;
        return this;
    }

    public String getLogsJson() {
        return logsJson;
    }

    public GameSessionEntity setLogsJson(String logsJson) {
        this.logsJson = logsJson;
        return this;
    }

    public Integer getConsecutiveNegativeBudget() {
        return consecutiveNegativeBudget;
    }

    public GameSessionEntity setConsecutiveNegativeBudget(Integer consecutiveNegativeBudget) {
        this.consecutiveNegativeBudget = consecutiveNegativeBudget;
        return this;
    }

    public Boolean getIsGameOver() {
        return isGameOver;
    }

    public GameSessionEntity setIsGameOver(Boolean isGameOver) {
        this.isGameOver = isGameOver;
        return this;
    }

    public String getGameOverReason() {
        return gameOverReason;
    }

    public GameSessionEntity setGameOverReason(String gameOverReason) {
        this.gameOverReason = gameOverReason;
        return this;
    }
}
