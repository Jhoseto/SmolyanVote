package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.enums.PublicationsLinkType;

import java.util.Map;

public interface PublicationLinkMetadataService {
    String extractMetadata(String url);

    PublicationsLinkType determineLinkType(String url);

    Map<String, Object> extractYouTubeMetadata(String url);

    String extractYouTubeVideoId(String url);

    Map<String, Object> extractImageMetadata(String url);

    Map<String, Object> extractWebsiteMetadata(String url);

    String createBasicMetadata(String url);
}
