package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SecureCookieAttributesFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        chain.doFilter(request, response);

        if (response instanceof HttpServletResponse httpResp) {
            for (String header : httpResp.getHeaders("Set-Cookie")) {
                if (header.contains("JSESSIONID") || header.contains("remember-me")) {
                    String updated = header;

                    // Secure ако липсва
                    if (!updated.toLowerCase().contains("secure")) {
                        updated += "; Secure";
                    }

                    // HttpOnly ако липсва
                    if (!updated.toLowerCase().contains("httponly")) {
                        updated += "; HttpOnly";
                    }

                    //  SameSite=Strict ако липсва
                    if (!updated.toLowerCase().contains("samesite")) {
                        updated += "; SameSite=Strict";
                    }

                    httpResp.setHeader("Set-Cookie", updated);
                }
            }
        }
    }
}
