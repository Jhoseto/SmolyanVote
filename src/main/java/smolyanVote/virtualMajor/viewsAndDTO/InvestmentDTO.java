package smolyanVote.virtualMajor.viewsAndDTO;

import java.util.Map;

/**
 * DTO representing an investment project in the game.
 * Mirrors the frontend Investment interface.
 */
public class InvestmentDTO {

    private String id;
    private String name;
    private Integer cost;
    private String description;
    private Map<String, Integer> impact; // Resource impacts as map
    private Integer tier; // 1, 2, or 3
    private Boolean built;
    private Integer currentStep;
    private Integer totalSteps;
    private Boolean isStarted;
    private String regionId; // Optional: project may be localized to a region

    // ===== CONSTRUCTORS =====

    public InvestmentDTO() {
    }

    // ===== GETTERS AND SETTERS =====

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getCost() {
        return cost;
    }

    public void setCost(Integer cost) {
        this.cost = cost;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Integer> getImpact() {
        return impact;
    }

    public void setImpact(Map<String, Integer> impact) {
        this.impact = impact;
    }

    public Integer getTier() {
        return tier;
    }

    public void setTier(Integer tier) {
        this.tier = tier;
    }

    public Boolean getBuilt() {
        return built;
    }

    public void setBuilt(Boolean built) {
        this.built = built;
    }

    public Integer getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(Integer currentStep) {
        this.currentStep = currentStep;
    }

    public Integer getTotalSteps() {
        return totalSteps;
    }

    public void setTotalSteps(Integer totalSteps) {
        this.totalSteps = totalSteps;
    }

    public Boolean getIsStarted() {
        return isStarted;
    }

    public void setIsStarted(Boolean isStarted) {
        this.isStarted = isStarted;
    }

    public String getRegionId() {
        return regionId;
    }

    public void setRegionId(String regionId) {
        this.regionId = regionId;
    }
}
