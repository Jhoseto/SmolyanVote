package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.web.filter.OncePerRequestFilter;
import smolyanVote.smolyanVote.config.FrontendProperties;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Isolates legacy Thymeleaf UI: browser document navigations to Spring page
 * routes are redirected to the Next.js frontend. API, WebSocket, OAuth and
 * media endpoints stay on this server.
 *
 * <p>Toggle: {@code smolyanvote.frontend.legacy-redirect-enabled=false}
 *
 * <p>Registered via {@code FilterRegistrationBean} (not as a {@code @Component}
 * filter) to control order and avoid double registration.
 */
public class LegacyUiIsolationFilter extends OncePerRequestFilter {

    private static final Map<String, String> PATH_ALIASES = new LinkedHashMap<>();

    static {
        PATH_ALIASES.put("/viewLogin", "/login");
        PATH_ALIASES.put("/user/login", "/login");
        PATH_ALIASES.put("/user/registration", "/register");
        PATH_ALIASES.put("/registration", "/register");
        PATH_ALIASES.put("/mainEvents", "/events");
        PATH_ALIASES.put("/mainEventPage", "/events");
        PATH_ALIASES.put("/admin/dashboard", "/admin");
        PATH_ALIASES.put("/contact", "/contacts");
        PATH_ALIASES.put("/aboutUs", "/about");
        PATH_ALIASES.put("/signals/mainView", "/signals");
        PATH_ALIASES.put("/terms-conditions", "/terms-and-conditions");
        PATH_ALIASES.put("/privacy-policy", "/terms-and-conditions");
        PATH_ALIASES.put("/createNewEvent", "/event/new");
        PATH_ALIASES.put("/createEvent", "/event/new");
        PATH_ALIASES.put("/create", "/events");
        PATH_ALIASES.put("/referendum", "/referendum/new");
        PATH_ALIASES.put("/multipoll/createMultiPoll", "/multipoll/new");
        PATH_ALIASES.put("/multipoll/create", "/multipoll/new");
    }

    private final FrontendProperties frontendProperties;

    public LegacyUiIsolationFilter(FrontendProperties frontendProperties) {
        this.frontendProperties = frontendProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!frontendProperties.isLegacyRedirectEnabled()) {
            return true;
        }
        if (!HttpMethod.GET.matches(request.getMethod()) && !HttpMethod.HEAD.matches(request.getMethod())) {
            return true;
        }

        String path = normalizedPath(request);
        if (isBackendOnlyPath(path)) {
            return true;
        }

        // Only isolate real browser navigations / HTML fetches — leave XHR/fetch alone.
        return !isBrowserDocumentRequest(request);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = normalizedPath(request);
        String mapped = mapPath(path);
        String query = request.getQueryString();
        String target = frontendProperties.origin() + mapped + (query != null && !query.isBlank() ? "?" + query : "");
        response.setHeader("Cache-Control", "no-store");
        response.sendRedirect(target);
    }

    public static boolean isBackendOnlyPath(String path) {
        if (path.startsWith("/api/")
                || path.equals("/api")
                || path.startsWith("/ws-svmessenger")
                || path.startsWith("/ws/")
                || path.startsWith("/oauth2/")
                || path.startsWith("/login/oauth2/")
                || path.equals("/heartbeat")
                || path.startsWith("/actuator")
                || path.startsWith("/api/podcast/")
                // Note: /podcast and /podcast/episode/* are HTML routes → redirect to Next.
                // Episode audio URLs are absolute (Cloudinary/CDN), not classpath /podcast/*.
                || path.startsWith("/svmessenger/")
                || path.startsWith("/images/")
                || path.startsWith("/fonts/")
                || path.equals("/favicon.ico")
                || path.equals("/robots.txt")
                || path.equals("/sitemap.xml")
                || path.startsWith("/error/")) {
            return true;
        }
        return false;
    }

    public static boolean isBrowserDocumentRequest(HttpServletRequest request) {
        String dest = request.getHeader("Sec-Fetch-Dest");
        if ("document".equalsIgnoreCase(dest) || "iframe".equalsIgnoreCase(dest)) {
            return true;
        }
        // fetch / XHR / websocket upgrade — never treat as HTML navigation
        if (dest != null && !dest.isBlank()) {
            return false;
        }
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains("text/html");
    }

    public static String normalizedPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String context = request.getContextPath();
        if (context != null && !context.isEmpty() && uri.startsWith(context)) {
            uri = uri.substring(context.length());
        }
        if (uri.isEmpty()) return "/";
        if (uri.length() > 1 && uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }
        return uri;
    }

    public static String mapPath(String path) {
        String alias = PATH_ALIASES.get(path);
        if (alias != null) return alias;
        // /admin → /admin (Next); keep nested admin HTML off Spring
        if (path.startsWith("/admin")) return "/admin";
        return path.isEmpty() ? "/" : path;
    }
}
