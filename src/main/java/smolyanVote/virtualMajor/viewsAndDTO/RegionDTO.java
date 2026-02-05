package smolyanVote.virtualMajor.viewsAndDTO;

import java.util.Map;

/**
 * DTO representing a city region in the game.
 * Mirrors the frontend Region interface.
 */
public class RegionDTO {

    private String id;
    private String name;
    private String description;
    private Map<String, Integer> stats; // Partial resources (budget, trust, etc.)
    private String color;
    private String status; // normal, crisis, growth, protest, epidemic
    private String activeIntervention; // Optional: repair, patrol, subsidy

    // ===== CONSTRUCTORS =====

    public RegionDTO() {
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Map<String, Integer> getStats() {
        return stats;
    }

    public void setStats(Map<String, Integer> stats) {
        this.stats = stats;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getActiveIntervention() {
        return activeIntervention;
    }

    public void setActiveIntervention(String activeIntervention) {
        this.activeIntervention = activeIntervention;
    }
}
