package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record MonitorCompanyUpdateRequest(
        String name,
        boolean consortium,
        String legalForm,
        String registeredAddress,
        String managersSummary
) {
}
