package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * JSON body for {@code POST /api/v1/podcast/episodes} when the admin supplies an
 * external audio URL (Internet Archive) — no multipart / file upload.
 */
public record CreatePodcastEpisodeRequest(
        String title,
        String description,
        String audioUrl,
        Integer durationSeconds,
        Boolean isPublished
) {
}
