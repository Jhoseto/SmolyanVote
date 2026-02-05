package smolyanVote.virtualMajor.viewsAndDTO;

import java.util.List;

public class StrategicAnalysisDTO {
    private String narrative;
    private List<String> achievements;
    private List<String> warnings;
    private List<ResourcePointDTO> history;

    public StrategicAnalysisDTO() {
    }

    public StrategicAnalysisDTO(String narrative, List<String> achievements, List<String> warnings,
            List<ResourcePointDTO> history) {
        this.narrative = narrative;
        this.achievements = achievements;
        this.warnings = warnings;
        this.history = history;
    }

    // Getters and Setters
    public String getNarrative() {
        return narrative;
    }

    public void setNarrative(String narrative) {
        this.narrative = narrative;
    }

    public List<String> getAchievements() {
        return achievements;
    }

    public void setAchievements(List<String> achievements) {
        this.achievements = achievements;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<ResourcePointDTO> getHistory() {
        return history;
    }

    public void setHistory(List<ResourcePointDTO> history) {
        this.history = history;
    }

    public static class ResourcePointDTO {
        private String label; // "01/2030"
        private Integer budget;
        private Integer trust;
        private Integer population;

        public ResourcePointDTO(String label, Integer budget, Integer trust, Integer population) {
            this.label = label;
            this.budget = budget;
            this.trust = trust;
            this.population = population;
        }

        // Getters
        public String getLabel() {
            return label;
        }

        public Integer getBudget() {
            return budget;
        }

        public Integer getTrust() {
            return trust;
        }

        public Integer getPopulation() {
            return population;
        }
    }
}
