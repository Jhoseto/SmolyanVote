package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorProcurementStatsDTO(
        List<ChartPointDTO> monthlySpend,
        List<YearlySpendDTO> yearlySpend,
        List<SectorSpendDTO> sectorBreakdown,
        List<TopCompanyDTO> topCompanies
) {
    public record ChartPointDTO(int year, int month, BigDecimal amountEur, long count) {
    }

    public record YearlySpendDTO(int year, BigDecimal amountEur, long count) {
    }

    public record SectorSpendDTO(String sectorCode, BigDecimal amountEur, long count) {
    }

    public record TopCompanyDTO(String eik, String name, BigDecimal amountEur, long contractCount) {
    }
}
