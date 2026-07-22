package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.http.HttpServletRequest;

/** Helpers for distinguishing browser HTML navigations from API clients. */
public final class BrowserRequestUtils {

    private BrowserRequestUtils() {
    }

    public static boolean isBrowserDocumentRequest(HttpServletRequest request) {
        String dest = request.getHeader("Sec-Fetch-Dest");
        if ("document".equalsIgnoreCase(dest) || "iframe".equalsIgnoreCase(dest)) {
            return true;
        }
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
        if (uri.isEmpty()) {
            return "/";
        }
        if (uri.length() > 1 && uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }
        return uri;
    }

    public static boolean isApiPath(HttpServletRequest request) {
        String path = normalizedPath(request);
        return path.startsWith("/api/")
                || path.startsWith("/admin/api/")
                || path.startsWith("/admin/users/")
                || path.startsWith("/admin/manage-reports/");
    }
}
