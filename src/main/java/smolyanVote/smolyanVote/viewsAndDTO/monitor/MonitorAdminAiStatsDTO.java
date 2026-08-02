package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record MonitorAdminAiStatsDTO(
        long pendingDocuments,
        long pendingContracts,
        long totalDocuments,
        long totalContracts,
        boolean geminiConfigured,
        String geminiModel,
        boolean geminiAccessBlocked,
        String geminiAccessMessage
) {
}
