package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record MonitorDocumentDetailDTO(
        Long id,
        String documentType,
        String title,
        String shortSummary,
        String aiCategory,
        Integer impactScore,
        BigDecimal amount,
        String amountCurrency,
        BigDecimal amountEur,
        String companyName,
        LocalDate deadlineDate,
        Instant publishedAt,
        String sourceUrl,
        String aiAnalysis,
        String insightWhy) {
}
