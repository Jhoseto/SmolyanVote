package smolyanVote.virtualMajor.viewsAndDTO;

import java.util.List;

/**
 * DTO representing the complete game state.
 * Mirrors the frontend GameState interface for seamless communication.
 */
public class GameStateDTO {

    private Integer month;
    private Integer year;
    private CityResourcesDTO resources;
    private TaxesDTO taxes;
    private BudgetsDTO budgets;
    private List<InvestmentDTO> investments;
    private List<InvestmentDTO> availableProjects;
    private List<CityResourcesDTO> history;
    private Integer consecutiveNegativeBudget;
    private Boolean isGameOver;
    private String gameOverReason;
    private List<String> logs;

    // For region states (will be part of JSON in entity, but exposed here for
    // frontend)
    private List<RegionDTO> regions;

    // ===== NESTED DTOs =====

    public static class TaxesDTO {
        private Double property;
        private Double vehicle;
        private Double waste;

        public TaxesDTO() {
        }

        public TaxesDTO(Double property, Double vehicle, Double waste) {
            this.property = property;
            this.vehicle = vehicle;
            this.waste = waste;
        }

        public Double getProperty() {
            return property;
        }

        public void setProperty(Double property) {
            this.property = property;
        }

        public Double getVehicle() {
            return vehicle;
        }

        public void setVehicle(Double vehicle) {
            this.vehicle = vehicle;
        }

        public Double getWaste() {
            return waste;
        }

        public void setWaste(Double waste) {
            this.waste = waste;
        }
    }

    public static class BudgetsDTO {
        private Integer culture;
        private Integer sport;

        public BudgetsDTO() {
        }

        public BudgetsDTO(Integer culture, Integer sport) {
            this.culture = culture;
            this.sport = sport;
        }

        public Integer getCulture() {
            return culture;
        }

        public void setCulture(Integer culture) {
            this.culture = culture;
        }

        public Integer getSport() {
            return sport;
        }

        public void setSport(Integer sport) {
            this.sport = sport;
        }
    }

    // ===== CONSTRUCTORS =====

    public GameStateDTO() {
    }

    // ===== GETTERS AND SETTERS =====

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public CityResourcesDTO getResources() {
        return resources;
    }

    public void setResources(CityResourcesDTO resources) {
        this.resources = resources;
    }

    public TaxesDTO getTaxes() {
        return taxes;
    }

    public void setTaxes(TaxesDTO taxes) {
        this.taxes = taxes;
    }

    public BudgetsDTO getBudgets() {
        return budgets;
    }

    public void setBudgets(BudgetsDTO budgets) {
        this.budgets = budgets;
    }

    public List<InvestmentDTO> getInvestments() {
        return investments;
    }

    public void setInvestments(List<InvestmentDTO> investments) {
        this.investments = investments;
    }

    public List<InvestmentDTO> getAvailableProjects() {
        return availableProjects;
    }

    public void setAvailableProjects(List<InvestmentDTO> availableProjects) {
        this.availableProjects = availableProjects;
    }

    public List<CityResourcesDTO> getHistory() {
        return history;
    }

    public void setHistory(List<CityResourcesDTO> history) {
        this.history = history;
    }

    public Integer getConsecutiveNegativeBudget() {
        return consecutiveNegativeBudget;
    }

    public void setConsecutiveNegativeBudget(Integer consecutiveNegativeBudget) {
        this.consecutiveNegativeBudget = consecutiveNegativeBudget;
    }

    public Boolean getIsGameOver() {
        return isGameOver;
    }

    public void setIsGameOver(Boolean isGameOver) {
        this.isGameOver = isGameOver;
    }

    public String getGameOverReason() {
        return gameOverReason;
    }

    public void setGameOverReason(String gameOverReason) {
        this.gameOverReason = gameOverReason;
    }

    public List<String> getLogs() {
        return logs;
    }

    public void setLogs(List<String> logs) {
        this.logs = logs;
    }

    public List<RegionDTO> getRegions() {
        return regions;
    }

    public void setRegions(List<RegionDTO> regions) {
        this.regions = regions;
    }
}
