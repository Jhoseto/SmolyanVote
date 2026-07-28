package smolyanVote.smolyanVote.services.serviceImpl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.ImageCloudinaryService;
import smolyanVote.smolyanVote.services.support.OAuthAvatarSync;
import smolyanVote.smolyanVote.services.support.OAuthAvatarUrls;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Imports Google/Facebook avatars into Cloudinary.
 *
 * <p>Facebook is special: {@code picture.data.url} CDN links expire quickly and
 * Cloudinary's remote fetch is often blocked by fbcdn hotlink rules. We resolve
 * the picture with the user access token ({@code /me/picture?redirect=false}),
 * download the bytes ourselves while the signed URL is fresh, then upload bytes.
 * Localhost vs production does not matter — the token does.
 */
@Service
@Slf4j
public class OAuthAvatarSyncService {

    private static final int AVATAR_PX = 512;

    private final ImageCloudinaryService imageCloudinaryService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public OAuthAvatarSyncService(ImageCloudinaryService imageCloudinaryService, ObjectMapper objectMapper) {
        this.imageCloudinaryService = imageCloudinaryService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(12))
                .build();
    }

    public void applyProviderAvatar(UserEntity user, String providerImageUrl) {
        applyProviderAvatar(user, providerImageUrl, null);
    }

    public void applyProviderAvatar(UserEntity user, String providerImageUrl, String accessToken) {
        boolean hasToken = accessToken != null && !accessToken.isBlank();
        boolean hasUrl = providerImageUrl != null && !providerImageUrl.isBlank();
        if (!hasToken && !hasUrl) {
            log.warn("OAuth provider returned no picture/token for user {}", user.getUsername());
            return;
        }

        // Sentinel so blank Facebook picture + valid token still triggers sync.
        String syncHint = hasUrl ? providerImageUrl : "facebook-access-token";
        if (!OAuthAvatarSync.shouldSyncFromProvider(user.getImageUrl(), syncHint)) {
            return;
        }

        try {
            byte[] bytes = downloadAvatarBytes(providerImageUrl, accessToken);
            if (bytes != null && bytes.length >= 100) {
                user.setImageUrl(imageCloudinaryService.saveUserImageFromBytes(bytes, user.getUsername()));
                log.info("OAuth avatar stored (bytes) for user {} ({} KB)",
                        user.getUsername(), bytes.length / 1024);
                return;
            }
        } catch (Exception ex) {
            log.warn("OAuth avatar byte import failed for {}: {}", user.getUsername(), ex.getMessage());
        }

        // Google-only fallback — Cloudinary can usually fetch googleusercontent.com.
        String upgraded = OAuthAvatarUrls.upgrade(providerImageUrl);
        if (upgraded != null && upgraded.toLowerCase().contains("googleusercontent.com")) {
            try {
                user.setImageUrl(imageCloudinaryService.saveUserImageFromUrl(upgraded, user.getUsername()));
                log.info("OAuth avatar stored (Google URL) for user {}", user.getUsername());
                return;
            } catch (Exception ex) {
                log.warn("OAuth avatar Google URL import failed for {}: {}", user.getUsername(), ex.getMessage());
            }
        }

        log.warn("Could not store OAuth avatar for user {}", user.getUsername());
    }

    private byte[] downloadAvatarBytes(String providerImageUrl, String accessToken) throws IOException, InterruptedException {
        if (accessToken != null && !accessToken.isBlank()) {
            FacebookPicture resolved = resolveFacebookPicture(accessToken);
            if (resolved.silhouette()) {
                return null;
            }
            if (resolved.url() != null) {
                return httpGetBytes(resolved.url());
            }
        }

        String url = OAuthAvatarUrls.upgrade(providerImageUrl);
        if (url == null || url.isBlank()) {
            return null;
        }

        if (accessToken != null && !accessToken.isBlank()
                && url.contains("graph.facebook.com")
                && url.contains("/picture")
                && !url.contains("access_token=")) {
            String sep = url.contains("?") ? "&" : "?";
            url = url + sep + "access_token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
        }

        return httpGetBytes(url);
    }

    private record FacebookPicture(String url, boolean silhouette) {
        static FacebookPicture none() {
            return new FacebookPicture(null, false);
        }

        static FacebookPicture asSilhouette() {
            return new FacebookPicture(null, true);
        }

        static FacebookPicture of(String url) {
            return new FacebookPicture(url, false);
        }
    }

    /**
     * {@code GET /me/picture?redirect=false} returns JSON with a short-lived CDN URL.
     * Skipping silhouettes (users with no real photo).
     */
    private FacebookPicture resolveFacebookPicture(String accessToken) {
        try {
            String endpoint = "https://graph.facebook.com/v18.0/me/picture"
                    + "?redirect=false"
                    + "&width=" + AVATAR_PX
                    + "&height=" + AVATAR_PX
                    + "&access_token=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8);

            byte[] body = httpGetBytes(endpoint);
            JsonNode root = objectMapper.readTree(body);
            JsonNode data = root.path("data");
            if (data.path("is_silhouette").asBoolean(false)) {
                log.info("Facebook returned silhouette avatar — skipping");
                return FacebookPicture.asSilhouette();
            }
            String url = data.path("url").asText(null);
            if (url == null || url.isBlank()) {
                return FacebookPicture.none();
            }
            return FacebookPicture.of(url);
        } catch (Exception ex) {
            log.warn("Facebook /me/picture resolve failed: {}", ex.getMessage());
            return FacebookPicture.none();
        }
    }

    private byte[] httpGetBytes(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(25))
                .header("User-Agent", "Mozilla/5.0 (compatible; SmolyanVote/1.0; +https://smolyanvote.com)")
                .header("Accept", "image/avif,image/webp,image/apng,image/*,application/json,*/*;q=0.8")
                .GET()
                .build();

        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + " fetching " + redact(url));
        }
        byte[] body = response.body();
        if (body == null || body.length < 100) {
            throw new IOException("Response too small (" + (body == null ? 0 : body.length) + " bytes)");
        }
        return body;
    }

    private static String redact(String url) {
        return url.replaceAll("access_token=[^&]+", "access_token=***");
    }
}
