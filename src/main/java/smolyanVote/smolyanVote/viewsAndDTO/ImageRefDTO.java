package smolyanVote.smolyanVote.viewsAndDTO;

/**
 * Stable {id, url} pair for a single event image. The legacy URL-only lists
 * ({@code images}/{@code imageUrls}) stay untouched (Thymeleaf views iterate
 * them as plain strings) — this is an additive field so the new admin
 * inline-edit UI can target a specific image for deletion by its DB id.
 */
public record ImageRefDTO(Long id, String url) {
}
