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
            try {
                // Използваме YouTube oEmbed API за реални данни
                String oembedUrl = "https://www.youtube.com/oembed?url=" + url + "&format=json";

                String response = restTemplate.getForObject(oembedUrl, String.class);

                if (response != null) {
                    // Parse JSON response
                    com.fasterxml.jackson.databind.JsonNode jsonNode = objectMapper.readTree(response);

                    String title = jsonNode.has("title") ? jsonNode.get("title").asText() : "YouTube Video";
                    String authorName = jsonNode.has("author_name") ? jsonNode.get("author_name").asText() : "";
                    String description = authorName.isEmpty() ?
                            "Натиснете за възпроизвеждане" :
                            "От " + authorName + " - Натиснете за възпроизвеждане";

                    // ====== ИЗПОЛЗВАМЕ ОФИЦИАЛНИЯ EMBED URL ОТ OEMBED ======
                    String embedUrl = "https://www.youtube.com/embed/" + videoId + "?feature=oembed";

                    // Ако oEmbed върна HTML, извличаме src от iframe-а
                    if (jsonNode.has("html")) {
                        String htmlContent = jsonNode.get("html").asText();
                        // Извличаме src от iframe-а в HTML-а
                        Pattern srcPattern = Pattern.compile("src=\"([^\"]+)\"");
                        Matcher matcher = srcPattern.matcher(htmlContent);
                        if (matcher.find()) {
                            embedUrl = matcher.group(1);
                        }
                    }

                    metadata.put("type", "youtube");
                    metadata.put("url", url);
                    metadata.put("videoId", videoId);
                    metadata.put("title", title);
                    metadata.put("description", description);
                    metadata.put("authorName", authorName);
                    metadata.put("thumbnail", "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg");
                    metadata.put("embedUrl", embedUrl);

                    return metadata;
                }

            } catch (Exception e) {
                // Fallback при грешка
                System.err.println("Грешка при извличане на YouTube данни: " + e.getMessage());
            }

            // Fallback - основен embed URL без допълнителни параметри
            metadata.put("type", "youtube");
            metadata.put("url", url);
            metadata.put("videoId", videoId);
            metadata.put("title", "YouTube Video");
            metadata.put("description", "Натиснете за възпроизвеждане");
            metadata.put("thumbnail", "https://img.youtube.com/vi/" + videoId + "/maxresdefault.jpg");
            metadata.put("embedUrl", "https://www.youtube.com/embed/" + videoId + "?feature=oembed");
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

            // Започваме с basic данни
            metadata.put("type", "website");
            metadata.put("url", url);
            metadata.put("domain", domain.toUpperCase());

            try {
                // Опитваме се да извлечем Open Graph metadata
                String htmlContent = restTemplate.getForObject(url, String.class);

                if (htmlContent != null) {
                    // Извличаме title
                    String title = extractFromHtml(htmlContent,
                            "<meta property=\"og:title\" content=\"([^\"]+)\"",
                            "<title>([^<]+)</title>");

                    // Извличаме description
                    String description = extractFromHtml(htmlContent,
                            "<meta property=\"og:description\" content=\"([^\"]+)\"",
                            "<meta name=\"description\" content=\"([^\"]+)\"");

                    // Извличаме image
                    String image = extractFromHtml(htmlContent,
                            "<meta property=\"og:image\" content=\"([^\"]+)\"");

                    // Задаваме извлечените данни
                    metadata.put("title", title != null ? title : domain);
                    metadata.put("description", description != null ? description : "Посетете уебсайта за повече информация");

                    if (image != null && !image.isEmpty()) {
                        // Ако image URL е relative, правим го absolute
                        if (image.startsWith("/")) {
                            image = urlObj.getProtocol() + "://" + urlObj.getHost() + image;
                        } else if (!image.startsWith("http")) {
                            image = url + "/" + image;
                        }
                        metadata.put("image", image);
                    }

                } else {
                    // Fallback ако не можем да извлечем HTML
                    metadata.put("title", domain);
                    metadata.put("description", "Кликнете за отваряне на уебсайта");
                }

            } catch (Exception scrapingException) {
                // Ако scraping-ът се провали, използваме fallback данни
                metadata.put("title", domain);
                metadata.put("description", "Кликнете за отваряне на уебсайта");
            }

            // Добавяме favicon
            metadata.put("favicon", "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32");

        } catch (Exception e) {
            // Fallback при грешка в URL parsing
            metadata.put("type", "website");
            metadata.put("url", url);
            metadata.put("title", "Уебсайт");
            metadata.put("description", "Външен линк");
            metadata.put("domain", "УЕБСАЙТ");
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

    private String extractFromHtml(String html, String... patterns) {
        for (String patternStr : patterns) {
            try {
                Pattern pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                Matcher matcher = pattern.matcher(html);
                if (matcher.find()) {
                    String result = matcher.group(1).trim();
                    // Decode HTML entities
                    result = result.replace("&amp;", "&")
                            .replace("&lt;", "<")
                            .replace("&gt;", ">")
                            .replace("&quot;", "\"")
                            .replace("&#39;", "'");
                    if (!result.isEmpty()) {
                        return result;
                    }
                }
            } catch (Exception e) {
                // Ignore regex errors and try next pattern
            }
        }
        return null;
    }
}
