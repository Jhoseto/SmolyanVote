package smolyanVote.smolyanVote.componentsAndSecurity;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RegistrationRateLimitFilter extends OncePerRequestFilter {

    // Отделни bucket-и за IP адреси (глобален и регистрация)
    private final Map<String, Bucket> registrationBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> globalPostBuckets = new ConcurrentHashMap<>();

    // Лимит за регистрация: 5 опита на 10 минути
    private Bucket createRegistrationBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(3, Duration.ofMinutes(10)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    // Глобален лимит за всички POST: 20 заявки на минута
    private Bucket createGlobalPostBucket() {
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(100, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket resolveRegistrationBucket(String ip) {
        return registrationBuckets.computeIfAbsent(ip, k -> createRegistrationBucket());
    }

    private Bucket resolveGlobalPostBucket(String ip) {
        return globalPostBuckets.computeIfAbsent(ip, k -> createGlobalPostBucket());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    @NotNull HttpServletResponse response,
                                    @NotNull FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();
        
        // Изключваме конкретни API endpoints от rate limiting
        if (requestURI != null && (
                requestURI.startsWith("/api/notifications") ||
                requestURI.startsWith("/ws/") ||
                requestURI.startsWith("/heartbeat")
        )) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = request.getRemoteAddr();

        if ("POST".equalsIgnoreCase(request.getMethod())) {

            // Първо проверяваме глобалния лимит
            Bucket globalBucket = resolveGlobalPostBucket(ip);
            if (!globalBucket.tryConsume(1)) {
                if (!response.isCommitted()) {
                    request.getSession().setAttribute("rateLimitError", "Прекалено много POST заявки. Опитайте по-късно.");
                    response.sendRedirect(request.getRequestURI());
                }
                return;
            }

            // Ако е POST към /user/registration, проверяваме и специалния лимит
            if ("/user/registration".equals(requestURI)) {
                Bucket regBucket = resolveRegistrationBucket(ip);
                if (!regBucket.tryConsume(1)) {
                    if (!response.isCommitted()) {
                        request.getSession().setAttribute("rateLimitError", "Прекалено много опити за регистрация. Опитайте по-късно.");
                        response.sendRedirect("/register");
                    }
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
