package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Payload from Playwright sidecar — admin ingest only. */
public record MonitorScrapedDocumentDTO(
        String sourceId,
        String sourceUrl,
        String documentType,
        String title,
        String rawContent,
        Instant publishedAt,
        List<String> pdfUrls,
        BigDecimal amount,
        Instant deadlineDate,
        String companyName
) {
    public MonitorScrapedDocumentDTO(
            String sourceId,
            String sourceUrl,
            String documentType,
            String title,
            String rawContent,
            Instant publishedAt) {
        this(sourceId, sourceUrl, documentType, title, rawContent, publishedAt, null, null, null, null);
    }
}
