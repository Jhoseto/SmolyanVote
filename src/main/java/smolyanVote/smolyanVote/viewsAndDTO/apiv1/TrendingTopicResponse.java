package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** One row of GET /api/v1/publications/sidebar/trending (hashtags from the last 7 days). */
public record TrendingTopicResponse(String topic, long count) {
}
