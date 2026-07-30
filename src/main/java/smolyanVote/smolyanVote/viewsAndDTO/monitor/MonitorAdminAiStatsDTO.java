package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record MonitorAdminAiStatsDTO(
        long pendingCount,
        long totalDocuments,
        boolean geminiConfigured,
        String geminiModel
) {
}
