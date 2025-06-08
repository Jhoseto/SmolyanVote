package smolyanVote.smolyanVote.componentsAndSecurity;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
public class SecureCookieConfig {

    @Bean
    public DefaultCookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("__Secure-JSESSIONID");  // Префикс, изисква Secure + HTTPS
        serializer.setUseSecureCookie(true);              // Secure флаг
        serializer.setUseHttpOnlyCookie(true);            // HttpOnly флаг
        serializer.setSameSite("Strict");                 // SameSite=Strict или "Lax"
        serializer.setCookiePath("/");                    // Нужно за __Secure-
        return serializer;
    }
}
