package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import smolyanVote.smolyanVote.services.KeyGenerator;

import java.util.Collection;
import java.util.List;

@Configuration
public class ApplicationSecurityConfiguration {

    private final UserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final CustomLogoutSuccessHandler customLogoutSuccessHandler;

    @Autowired
    public ApplicationSecurityConfiguration(UserDetailsService customUserDetailsService,
                                            PasswordEncoder passwordEncoder,
                                            CustomLogoutSuccessHandler customLogoutSuccessHandler) {
        this.customUserDetailsService = customUserDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.customLogoutSuccessHandler = customLogoutSuccessHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");

        http
                .headers(headers -> headers
                        .httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable)
                )
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .authorizeHttpRequests(authz -> authz
                        .requestMatchers(
                                "/css/**", "/js/**", "/templates/**", "/images/**", "/fonts/**","/static/**",
                                "/", "//", "/forgotten_password", "/user/registration", "/registration",
                                "/register", "/about", "/login", "/viewLogin", "/logout", "/user/login",
                                "/user/logout", "/confirm/**", "/mainEvents/**", "/mainEventPage", "/event",
                                "/eventDetailView", "/posts","/podcast", "/error/**", "/favicon.ico", "/robots.txt",
                                "/heartbeat","/search","/contacts","/contact"
                        ).permitAll()
                        .requestMatchers(
                                "/multipoll", "/multipoll/**", "/referendumVote", "/referendum/**", "/referendum",
                                "/user/**", "/profile/update", "/profile", "/userProfile",
                                "/comments/**", "/api/comments/**", "/simpleVote", "/create", "/event/**",
                                "/createEvent", "/createNewEvent", "/user/logout", "/user/profile/**",
                                "/user/dashboard/**"
                        ).authenticated()
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .anyRequest().denyAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(customLogoutSuccessHandler)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "remember-me", "XSRF-TOKEN")
                        .permitAll()
                )
                .rememberMe(rememberMe -> rememberMe
                        .key(rememberMeKey())
                        .rememberMeParameter("remember-me")
                        .userDetailsService(customUserDetailsService)
                        .useSecureCookie(true)
                )
                .sessionManagement(session -> session
                        .sessionFixation().migrateSession()
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)

                )

                .exceptionHandling(ex -> ex
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            request.setAttribute("errorMessage", "❌ Нямате достъп до това съдържание! Само администратори.");
                            request.getRequestDispatcher("/error/general").forward(request, response);
                        })
                        .authenticationEntryPoint((request, response, authException) -> {
                            request.setAttribute("errorMessage", "🔒 Моля, влезте в профила си, за да продължите.");
                            request.getRequestDispatcher("/error/general").forward(request, response);
                        })
                )
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/images/**", "/css/**", "/js/**", "/fonts/**", "/heartbeat")
                       // .ignoringRequestMatchers("/heartbeat") // Игнорираме CSRF за heartbeat
                       // .ignoringRequestMatchers("/js/**")
                        .csrfTokenRepository(csrfTokenRepository)
                );


        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(customUserDetailsService).passwordEncoder(passwordEncoder);
        return builder.build();
    }

    @Bean
    public String rememberMeKey() {
        return KeyGenerator.generateKey();
    }

    @Bean
    public TokenBasedRememberMeServices tokenBasedRememberMeServices() {
        return new TokenBasedRememberMeServices(rememberMeKey(), customUserDetailsService);
    }

    @Bean
    public FilterRegistrationBean<Filter> cookieAttributeFilterRegistration() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();
        registration.setFilter(cookieAttributeFilter());
        registration.addUrlPatterns("/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("https://smolyanvote.com"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public Filter cookieAttributeFilter() {
        return (request, response, chain) -> {
            chain.doFilter(request, response);

            if (response instanceof HttpServletResponse resp) {
                Collection<String> headers = resp.getHeaders("Set-Cookie");
                if (!headers.isEmpty()) {
                    resp.setHeader("Set-Cookie", null); // премахваме старите

                    for (String header : headers) {
                        String updatedHeader = header;

                        boolean isSecureRequest = request.isSecure() || request.getServerName().contains("smolyanvote.com");

                        if (isSecureRequest && !header.toLowerCase().contains("secure")) {
                            updatedHeader += "; Secure";
                        }

                        if (!header.toLowerCase().contains("httponly") && !header.startsWith("XSRF-TOKEN")) {
                            updatedHeader += "; HttpOnly";
                        }

                        if (!header.toLowerCase().contains("samesite")) {
                            updatedHeader += "; SameSite=Lax";
                        }

                        resp.addHeader("Set-Cookie", updatedHeader);
                    }
                }
            }
        };
    }
}
