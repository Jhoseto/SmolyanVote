package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.time.Instant;

/** Admin-only document row — includes flags, never exposed on public API. */
public record MonitorAdminDocumentDTO(
        Long id,
        String title,
        String documentType,
        String shortSummary,
        String sourceUrl,
        String contentHash,
        Instant publishedAt,
        Instant fetchedAt,
        boolean aiPending,
        boolean hasRawContent
) {
}
