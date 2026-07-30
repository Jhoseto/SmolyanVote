package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.time.Instant;

/** Payload from Playwright sidecar — admin ingest only. */
public record MonitorScrapedDocumentDTO(
        String sourceId,
        String sourceUrl,
        String documentType,
        String title,
        String rawContent,
        Instant publishedAt
) {
}
