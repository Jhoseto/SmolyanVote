package smolyanVote.smolyanVote.componentsAndSecurity;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * Session cookie serializer.
 * <p>
 * {@code __Secure-*} + {@code Secure} require HTTPS. On local {@code http://localhost}
 * those cookies are rejected by the browser, which breaks OAuth2 (authorization
 * request lives in the session). Dev/local → plain {@code JSESSIONID}; prod → secure.
 */
@Configuration
public class SecureCookieConfig {

    @Bean
    public DefaultCookieSerializer cookieSerializer(
            @Value("${spring.profiles.active:dev}") String activeProfile) {
        boolean secure = isProductionProfile(activeProfile);

        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName(secure ? "__Secure-JSESSIONID" : "JSESSIONID");
        serializer.setUseSecureCookie(secure);
        serializer.setUseHttpOnlyCookie(true);
        serializer.setSameSite("Lax");
        serializer.setCookiePath("/");
        return serializer;
    }

    static boolean isProductionProfile(String activeProfile) {
        if (activeProfile == null || activeProfile.isBlank()) return false;
        String p = activeProfile.toLowerCase();
        return p.contains("prod") || p.contains("production");
    }
}
