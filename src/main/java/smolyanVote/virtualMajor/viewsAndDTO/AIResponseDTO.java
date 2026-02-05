package smolyanVote.virtualMajor.viewsAndDTO;

import java.util.List;
import java.util.Map;

/**
 * DTO representing the AI response after processing a game turn.
 * Mirrors the frontend AIResponse interface.
 */
public class AIResponseDTO {

    private String analysis;
    private List<GameEventDTO> cases;
    private String yearlyReport;
    private Map<String, String> regionUpdates; // Map of regionId -> new status

    // ===== CONSTRUCTORS =====

    public AIResponseDTO() {
    }

    public AIResponseDTO(String analysis, List<GameEventDTO> cases) {
        this.analysis = analysis;
        this.cases = cases;
    }

    // ===== GETTERS AND SETTERS =====

    public String getAnalysis() {
        return analysis;
    }

    public void setAnalysis(String analysis) {
        this.analysis = analysis;
    }

    public List<GameEventDTO> getCases() {
        return cases;
    }

    public void setCases(List<GameEventDTO> cases) {
        this.cases = cases;
    }

    public String getYearlyReport() {
        return yearlyReport;
    }

    public void setYearlyReport(String yearlyReport) {
        this.yearlyReport = yearlyReport;
    }

    public Map<String, String> getRegionUpdates() {
        return regionUpdates;
    }

    public void setRegionUpdates(Map<String, String> regionUpdates) {
        this.regionUpdates = regionUpdates;
    }
}
