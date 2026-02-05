package smolyanVote.virtualMajor.viewsAndDTO;

/**
 * DTO representing user's game statistics.
 * Contains aggregated data across all completed games.
 */
public class GameStatisticsDTO {

    private Integer totalGamesPlayed;
    private Integer totalGamesWon;
    private Integer totalGamesLost;
    private Integer longestGameMonths;
    private Integer highestPopulation;
    private Integer highestBudget;
    private Integer highestTrust;
    private Integer highestInnovation;

    // ===== CONSTRUCTORS =====

    public GameStatisticsDTO() {
    }

    // ===== GETTERS AND SETTERS =====

    public Integer getTotalGamesPlayed() {
        return totalGamesPlayed;
    }

    public void setTotalGamesPlayed(Integer totalGamesPlayed) {
        this.totalGamesPlayed = totalGamesPlayed;
    }

    public Integer getTotalGamesWon() {
        return totalGamesWon;
    }

    public void setTotalGamesWon(Integer totalGamesWon) {
        this.totalGamesWon = totalGamesWon;
    }

    public Integer getTotalGamesLost() {
        return totalGamesLost;
    }

    public void setTotalGamesLost(Integer totalGamesLost) {
        this.totalGamesLost = totalGamesLost;
    }

    public Integer getLongestGameMonths() {
        return longestGameMonths;
    }

    public void setLongestGameMonths(Integer longestGameMonths) {
        this.longestGameMonths = longestGameMonths;
    }

    public Integer getHighestPopulation() {
        return highestPopulation;
    }

    public void setHighestPopulation(Integer highestPopulation) {
        this.highestPopulation = highestPopulation;
    }

    public Integer getHighestBudget() {
        return highestBudget;
    }

    public void setHighestBudget(Integer highestBudget) {
        this.highestBudget = highestBudget;
    }

    public Integer getHighestTrust() {
        return highestTrust;
    }

    public void setHighestTrust(Integer highestTrust) {
        this.highestTrust = highestTrust;
    }

    public Integer getHighestInnovation() {
        return highestInnovation;
    }

    public void setHighestInnovation(Integer highestInnovation) {
        this.highestInnovation = highestInnovation;
    }
}
