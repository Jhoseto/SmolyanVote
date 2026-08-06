package smolyanVote.smolyanVote.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Resolves the client IP behind reverse proxies (Caddy, Cloudflare).
 * Used for vote anti-abuse limits ({@code vote_ips}).
 */
@Component
public class ClientIpResolver {

    private static final Pattern IP_LIKE = Pattern.compile(
            "^([0-9a-fA-F:.]+)$");

    private static final String[] HEADER_CANDIDATES = {
            "CF-Connecting-IP",
            "True-Client-IP",
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
    };

    public String resolve(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        for (String header : HEADER_CANDIDATES) {
            String value = request.getHeader(header);
            if (value == null || value.isBlank() || "unknown".equalsIgnoreCase(value.trim())) {
                continue;
            }
            String first = value.split(",")[0].trim();
            if (isPlausibleIp(first)) {
                return normalize(first);
            }
        }
        String remote = request.getRemoteAddr();
        if (remote != null && !remote.isBlank() && isPlausibleIp(remote.trim())) {
            return normalize(remote.trim());
        }
        return null;
    }

    public boolean isValid(String ip) {
        return ip != null && !ip.isBlank() && isPlausibleIp(ip.trim());
    }

    private static String normalize(String ip) {
        if (ip.startsWith("::ffff:")) {
            return ip.substring(7);
        }
        return ip;
    }

    private static boolean isPlausibleIp(String ip) {
        if (ip.length() > 45) {
            return false;
        }
        return IP_LIKE.matcher(ip).matches();
    }
}
