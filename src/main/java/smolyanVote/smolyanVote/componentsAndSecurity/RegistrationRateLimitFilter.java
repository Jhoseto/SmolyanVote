package smolyanVote.smolyanVote.componentsAndSecurity;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RegistrationRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> ipBuckets = new ConcurrentHashMap<>();

    private Bucket createBucket() {
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(3, Duration.ofMinutes(10)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket resolveBucket(String ip) {
        return ipBuckets.computeIfAbsent(ip, k -> createBucket());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getRequestURI().equals("/user/registration") && request.getMethod().equalsIgnoreCase("POST")) {
            String ip = request.getRemoteAddr();
            Bucket bucket = resolveBucket(ip);

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                System.out.println("Rate limit triggered for IP: " + ip);
                System.out.println("Is response committed? " + response.isCommitted());

                if (!response.isCommitted()) {
                    request.getSession().setAttribute("rateLimitError", "Прекалено много опити за регистрация. Опитайте по-късно.");
                    response.sendRedirect("/register");
                } else {
                    System.out.println("Response already committed, cannot redirect.");
                }
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

}

