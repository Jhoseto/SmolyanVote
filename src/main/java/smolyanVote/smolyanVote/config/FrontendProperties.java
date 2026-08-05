package smolyanVote.smolyanVote.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

/** Next.js frontend origin — OAuth redirects, email links, logout. */
@Component
@ConfigurationProperties(prefix = "smolyanvote.frontend")
public class FrontendProperties {

    private static final Set<String> CANONICAL_HOSTS = Set.of(
            "smolyanvote.com",
            "www.smolyanvote.com");

    /** e.g. http://localhost:3000 or https://smolyanvote.com */
    private String url = "http://localhost:3000";

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String origin() {
        if (url == null || url.isBlank()) return "http://localhost:3000";
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    /**
     * OAuth post-login redirect target. Prefers the public host the user used to
     * start login (via Caddy {@code X-Forwarded-*} headers) so a stale
     * {@code SMOLYANVOTE_FRONTEND_URL=http://161.35.69.206} does not send users
     * to the raw IP after Google/Facebook auth on smolyanvote.com.
     */
    public String originForOAuth(HttpServletRequest request) {
        String fromRequest = publicOriginFromRequest(request);
        if (fromRequest != null) {
            return fromRequest;
        }
        return origin();
    }

    static String publicOriginFromRequest(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String host = firstHeaderValue(request, "X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getServerName();
        } else {
            host = host.split(",")[0].trim();
        }
        host = stripPort(host);
        if (host == null || host.isBlank()) {
            return null;
        }

        String hostLower = host.toLowerCase(Locale.ROOT);
        if (CANONICAL_HOSTS.contains(hostLower)) {
            return "https://smolyanvote.com";
        }

        if (hostLower.endsWith(".sslip.io")) {
            String proto = firstHeaderValue(request, "X-Forwarded-Proto");
            if (proto == null || proto.isBlank()) {
                proto = request.getScheme();
            } else {
                proto = proto.split(",")[0].trim();
            }
            return proto.toLowerCase(Locale.ROOT) + "://" + host;
        }

        return null;
    }

    private static String firstHeaderValue(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value == null || value.isBlank() ? null : value;
    }

    private static String stripPort(String host) {
        if (host == null) {
            return null;
        }
        int bracketEnd = host.indexOf(']');
        if (host.startsWith("[") && bracketEnd > 0) {
            return host.substring(0, bracketEnd + 1);
        }
        int colon = host.lastIndexOf(':');
        if (colon > 0 && host.indexOf(':') == colon) {
            return host.substring(0, colon);
        }
        return host;
    }
}
