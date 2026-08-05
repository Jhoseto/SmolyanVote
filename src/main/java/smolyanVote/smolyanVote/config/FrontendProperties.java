package smolyanVote.smolyanVote.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/** Next.js frontend origin — OAuth redirects, email links, logout. */
@Component
@ConfigurationProperties(prefix = "smolyanvote.frontend")
public class FrontendProperties {

    private static final Set<String> LOCAL_DEV_HOSTS = Set.of(
            "localhost",
            "127.0.0.1",
            "[::1]");

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
     * OAuth post-login redirect target.
     * <ul>
     *   <li><b>Local dev</b> — always {@link #origin()} ({@code http://localhost:3000}) because
     *       the OAuth callback hits Spring on {@code :2662}, not Next on {@code :3000}.</li>
     *   <li><b>Production</b> — when the browser used {@code smolyanvote.com} but
     *       {@code SMOLYANVOTE_FRONTEND_URL} still points at the Droplet IP, trust the public
     *       host from Caddy ({@code X-Forwarded-*}) so users land back on the domain.</li>
     * </ul>
     */
    public String originForOAuth(HttpServletRequest request) {
        String configured = origin();
        if (request == null) {
            return configured;
        }

        String publicHost = resolvePublicHost(request);
        if (publicHost == null) {
            return configured;
        }

        if (LOCAL_DEV_HOSTS.contains(publicHost.toLowerCase(Locale.ROOT))) {
            return configured;
        }

        if (originHostMatches(publicHost, configured)) {
            return configured;
        }

        String fromRequest = publicOriginFromHost(request, publicHost);
        return fromRequest != null ? fromRequest : configured;
    }

    static String resolvePublicHost(HttpServletRequest request) {
        String host = firstHeaderValue(request, "X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getServerName();
        } else {
            host = host.split(",")[0].trim();
        }
        return stripPort(host);
    }

    static boolean originHostMatches(String publicHost, String configuredOrigin) {
        if (publicHost == null || publicHost.isBlank() || configuredOrigin == null) {
            return false;
        }
        try {
            URI uri = URI.create(configuredOrigin);
            String configuredHost = uri.getHost();
            if (configuredHost == null) {
                return false;
            }
            String pub = publicHost.toLowerCase(Locale.ROOT);
            String cfg = configuredHost.toLowerCase(Locale.ROOT);
            if (pub.equals(cfg)) {
                return true;
            }
            // www.smolyanvote.com and smolyanvote.com are the same site
            return (pub.equals("www.smolyanvote.com") && cfg.equals("smolyanvote.com"))
                    || (pub.equals("smolyanvote.com") && cfg.equals("www.smolyanvote.com"));
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    static String publicOriginFromHost(HttpServletRequest request, String host) {
        if (host == null || host.isBlank()) {
            return null;
        }

        String hostLower = host.toLowerCase(Locale.ROOT);
        if ("www.smolyanvote.com".equals(hostLower)) {
            host = "smolyanvote.com";
            hostLower = "smolyanvote.com";
        }

        if ("smolyanvote.com".equals(hostLower)) {
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

        // Raw IP or other emergency host — mirror scheme from the incoming request
        if (hostLower.chars().allMatch(ch -> Character.isDigit(ch) || ch == '.')) {
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
