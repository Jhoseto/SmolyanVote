package smolyanVote.virtualMajor.viewsAndDTO;

/**
 * DTO representing city resources in the game.
 * Mirrors the frontend CityResources interface.
 */
public class CityResourcesDTO {

    private Integer budget;
    private Integer trust;
    private Integer infrastructure;
    private Integer eco;
    private Integer population;
    private Integer innovation;

    // ===== CONSTRUCTORS =====

    public CityResourcesDTO() {
    }

    public CityResourcesDTO(Integer budget, Integer trust, Integer infrastructure,
            Integer eco, Integer population, Integer innovation) {
        this.budget = budget;
        this.trust = trust;
        this.infrastructure = infrastructure;
        this.eco = eco;
        this.population = population;
        this.innovation = innovation;
    }

    // ===== GETTERS AND SETTERS =====

    public Integer getBudget() {
        return budget;
    }

    public void setBudget(Integer budget) {
        this.budget = budget;
    }

    public Integer getTrust() {
        return trust;
    }

    public void setTrust(Integer trust) {
        this.trust = trust;
    }

    public Integer getInfrastructure() {
        return infrastructure;
    }

    public void setInfrastructure(Integer infrastructure) {
        this.infrastructure = infrastructure;
    }

    public Integer getEco() {
        return eco;
    }

    public void setEco(Integer eco) {
        this.eco = eco;
    }

    public Integer getPopulation() {
        return population;
    }

    public void setPopulation(Integer population) {
        this.population = population;
    }

    public Integer getInnovation() {
        return innovation;
    }

    public void setInnovation(Integer innovation) {
        this.innovation = innovation;
    }
}
