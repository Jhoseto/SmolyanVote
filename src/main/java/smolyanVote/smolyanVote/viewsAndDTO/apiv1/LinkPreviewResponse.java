package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * GET /api/v1/publications/link-preview — {@code metadata} is a JSON string
 * (shape depends on link type: youtube/image/website — see
 * {@code PublicationLinkMetadataServiceImpl}).
 */
public record LinkPreviewResponse(boolean success, String url, String metadata) {
}
