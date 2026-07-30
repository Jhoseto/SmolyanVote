package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record RiskBadgeDTO(String code, String label, String tooltip) {
    public RiskBadgeDTO(String code, String label) {
        this(code, label, null);
    }
}
