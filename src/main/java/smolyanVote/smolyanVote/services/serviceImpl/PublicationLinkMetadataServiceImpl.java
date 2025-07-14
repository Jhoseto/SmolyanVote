package smolyanVote.smolyanVote.services.serviceImpl;

import smolyanVote.smolyanVote.models.enums.PublicationsLinkType;
import smolyanVote.smolyanVote.services.interfaces.PublicationLinkMetadataService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PublicationLinkMetadataServiceImpl implements PublicationLinkMetadataService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public PublicationLinkMetadataServiceImpl() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Извлича metadata от URL
     */
    @Override
    public String extractMetadata(String url) {
        try {
            PublicationsLinkType type = determineLinkType(url);
            Map<String, Object> metadata = new HashMap<>();

            switch (type) {
                case YOUTUBE:
                    metadata = extractYouTubeMetadata(url);
                    break;
                case IMAGE:
                    metadata = extractImageMetadata(url);
                    break;
                case WEBSITE:
                default:
                    metadata = extractWebsiteMetadata(url);
                    break;
            }

            return objectMapper.writeValueAsString(metadata);

        } catch (Exception e) {
            // При грешка връщаме basic metadata
            return createBasicMetadata(url);
        }
    }

    /**
     * Определя типа на линка
     */
    @Override
    public PublicationsLinkType determineLinkType(String url) {
        String urlLower = url.toLowerCase();

        if (urlLower.contains("youtube.com/watch") ||
                urlLower.contains("youtu.be/") ||
                urlLower.contains("youtube.com/embed")) {
            return PublicationsLinkType.YOUTUBE;
        }

        if (urlLower.matches(".*\\.(jpg|jpeg|png|gif|webp|svg)(\\?.*)?$")) {
            return PublicationsLinkType.IMAGE;
        }

        return PublicationsLinkType.WEBSITE;
    }

    /**
     * Извлича YouTube metadata
     */
    @Override
    public Map<String, Object> extractYouTubeMetadata(String url) {
        Map<String, Object> metadata = new HashMap<>();

        String videoId = extractYouTubeVideoId(url);
        if (videoId != null) {
            metadata.put("type", "youtube");
            metadata.put("url", url);
            metadata.put("videoId", videoId);
            metadata.put("title", "YouTube Video");
            metadata.put("description", "Натиснете за възпроизвеждане");
            metadata.put("thumbnail", "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg");
            metadata.put("embedUrl", "https://www.youtube.com/embed/" + videoId);
        }

        return metadata;
    }

    /**
     * Извлича video ID от YouTube URL
     */
    @Override
    public String extractYouTubeVideoId(String url) {
        Pattern[] patterns = {
                Pattern.compile("(?:youtube\\.com/watch\\?v=|youtu\\.be/|youtube\\.com/embed/)([^&\\n?#]+)"),
                Pattern.compile("youtube\\.com/watch\\?.*v=([^&\\n?#]+)")
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(url);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        return null;
    }

    /**
     * Извлича image metadata
     */
    @Override
    public Map<String, Object> extractImageMetadata(String url) {
        Map<String, Object> metadata = new HashMap<>();

        metadata.put("type", "image");
        metadata.put("url", url);
        metadata.put("title", "Изображение");
        metadata.put("imageUrl", url);

        return metadata;
    }

    /**
     * Извлича website metadata
     */
    @Override
    public Map<String, Object> extractWebsiteMetadata(String url) {
        Map<String, Object> metadata = new HashMap<>();

        try {
            URL urlObj = new URL(url);
            String domain = urlObj.getHost().replace("www.", "");

            metadata.put("type", "website");
            metadata.put("url", url);
            metadata.put("title", domain);
            metadata.put("description", "Кликнете за отваряне на уебсайта");
            metadata.put("domain", domain);
            metadata.put("favicon", "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32");

        } catch (Exception e) {
            metadata.put("type", "website");
            metadata.put("url", url);
            metadata.put("title", "Уебсайт");
            metadata.put("description", "Външен линк");
            metadata.put("domain", "website");
        }

        return metadata;
    }

    /**
     * Създава basic metadata при грешка
     */
    @Override
    public String createBasicMetadata(String url) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("type", "website");
            metadata.put("url", url);
            metadata.put("title", "Линк");
            metadata.put("description", "Външен линк");

            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            return "{}";
        }
    }

}
