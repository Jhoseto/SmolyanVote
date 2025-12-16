package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import smolyanVote.smolyanVote.services.KeyGenerator;
import smolyanVote.smolyanVote.services.serviceImpl.CustomOAuth2UserService;

import java.util.Collection;
import java.util.List;

@Configuration
public class ApplicationSecurityConfiguration {

    @Value("${spring.profiles.active:prod}")
    private String activeProfile;

    private final UserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final CustomLogoutSuccessHandler customLogoutSuccessHandler;
    private final OAuth2UserService<org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest, OAuth2User> oAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public ApplicationSecurityConfiguration(UserDetailsService customUserDetailsService,
            PasswordEncoder passwordEncoder,
            CustomLogoutSuccessHandler customLogoutSuccessHandler,
            CustomOAuth2UserService customOAuth2UserService,
            OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
            OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler,
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.customUserDetailsService = customUserDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.customLogoutSuccessHandler = customLogoutSuccessHandler;
        this.oAuth2UserService = customOAuth2UserService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
        this.oAuth2AuthenticationFailureHandler = oAuth2AuthenticationFailureHandler;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");

        http
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .maxAgeInSeconds(31536000) // 1 година
                                .includeSubDomains(true))
                        .frameOptions(frame -> frame.deny())
                        .contentTypeOptions(contentType -> {})
                        .xssProtection(xss -> {}))
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .authorizeHttpRequests(authz -> authz
                        // Allow CORS preflight OPTIONS for messenger API so browser can POST without
                        // 405
                        .requestMatchers(HttpMethod.OPTIONS, "/api/svmessenger/**", "/api/mobile/**").permitAll()
                        // Mobile Auth endpoints - permitAll (JWT validation в filter)
                        .requestMatchers("/api/mobile/auth/login", "/api/mobile/auth/refresh", "/api/mobile/auth/logout").permitAll()
                        // Mobile Device endpoints - изискват authentication
                        .requestMatchers("/api/mobile/device/**").authenticated()
                        // Статични ресурси и podcast window - трябва да са преди другите правила
                        .requestMatchers("/podcast/**", "/css/**", "/js/**", "/templates/**", "/images/**", "/fonts/**", "/static/**").permitAll()
                        .requestMatchers("/api/podcast/**").permitAll()
                        .requestMatchers("/api/event/*/exists", "/api/referendum/*/exists", "/api/multipoll/*/exists").permitAll()
                        // WebSocket handshake endpoints - permitAll (authentication се проверява от JWT interceptor при STOMP CONNECT)
                        .requestMatchers("/ws-svmessenger/**", "/ws-svmessenger-ws/**").permitAll()
                        .requestMatchers(
                                "/svmessenger/**",
                                "/", "//", "/forgotten_password", "/reset-password", "/user/registration",
                                "/registration",
                                "/register", "/about", "/login", "/viewLogin", "/logout", "/user/login",
                                "/user/logout", "/confirm/**", "/mainEvents/**", "/mainEventPage", "/event",
                                "/eventDetailView", "/posts", "/podcast", "/error/**", "/favicon.ico", "/robots.txt", "/sitemap.xml",
                                "/heartbeat", "/search", "/contacts", "/contact", "/publications/**", "/api/links/**",
                                "/terms-and-conditions", "/faq", "/signals/**",
                                "/oauth2/**", "/login/oauth2/**")
                        .permitAll()
                        // Публичен достъп до detail views (GET заявки) - за Facebook sharing и
                        // нелогнати потребители
                        .requestMatchers(HttpMethod.GET, "/event/**", "/referendum/**", "/multipoll/**").permitAll()
                        // Endpoints за редактиране - само за администратори (GET и POST)
                        .requestMatchers("/event/*/edit", "/referendum/*/edit", "/multipoll/*/edit").hasRole("ADMIN")
                        .requestMatchers("/admin/**", "/ws/admin/**", "/sockjs-node/**", "/stomp/**").hasRole("ADMIN")
                        // Гласуване и създаване изискват authentication
                        .requestMatchers(
                                "/simpleVote", "/referendumVote", "/multipoll/vote",
                                "/create", "/createEvent", "/createNewEvent", "/referendum/create", "/multipoll/create",
                                "/multipoll", "/referendum",
                                "/user/**", "/profile/update", "/userProfile",
                                "/comments/**", "/api/comments/**",
                                "/user/logout",
                                "/user/dashboard/**", "/subscription/**", "/api/reports/**", "/api/user/**",
                                "/profile/**", "/api/follow/**", "/api/notifications/**",
                                "/ws/notifications/**", "/api/svmessenger/**",
                                "/api/mobile/**") // Mobile API endpoints изискват authentication (JWT или session)
                        .authenticated()
                        .anyRequest().denyAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(customLogoutSuccessHandler)
                        .logoutSuccessUrl("/")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID", "remember-me", "XSRF-TOKEN")
                        .permitAll())
                .rememberMe(rememberMe -> rememberMe
                        .key(rememberMeKey())
                        .rememberMeParameter("remember-me")
                        .userDetailsService(customUserDetailsService)
                        .useSecureCookie(true))
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(oAuth2UserService))
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                        .failureHandler(oAuth2AuthenticationFailureHandler))
                .sessionManagement(session -> session
                        .sessionFixation().migrateSession()
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)

                )

                .exceptionHandling(ex -> ex
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            request.setAttribute("errorMessage",
                                    "❌ Нямате достъп до това съдържание! Само администратори.");
                            request.getRequestDispatcher("/error/general").forward(request, response);
                        })
                        .authenticationEntryPoint((request, response, authException) -> {
                            request.setAttribute("errorMessage", "🔒 Моля, влезте в профила си, за да продължите.");
                            request.getRequestDispatcher("/error/general").forward(request, response);
                        }))
                .csrf(csrf -> csrf
                        // ✅ CSRF PROTECTION RESTORED - ALL API ENDPOINTS NOW PROTECTED
                        // WebSocket handshakes remain exempt (safe by design - require valid session +
                        // Same-Origin Policy)
                        // Mobile API endpoints са exempt от CSRF (използват JWT tokens)
                        .ignoringRequestMatchers("/images/**", "/css/**", "/js/**", "/fonts/**", "/podcast/**", "/api/podcast/**", "/heartbeat",
                                "/ws-svmessenger/**", "/ws-svmessenger-ws/**", "/ws/notifications/**", "/ws/admin/activity/**", "/robots.txt", "/sitemap.xml",
                                "/api/mobile/**") // Mobile API използва JWT, не се нуждае от CSRF
                        .csrfTokenRepository(csrfTokenRepository))
                // Добавяне на JWT filter преди UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthenticationFilter, org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);

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

        // TODO След завършване на месенджър трябва да се премахне локала
        // Development: allow localhost, Production: only production domains
        if ("dev".equals(activeProfile) || "development".equals(activeProfile)) {
            configuration.setAllowedOriginPatterns(List.of(
                    "https://smolyanvote.com",
                    "https://www.smolyanvote.com",
                    "http://localhost:*",
                    "http://127.0.0.1:*"));
        } else {
            configuration.setAllowedOriginPatterns(List.of(
                    "https://smolyanvote.com",
                    "https://www.smolyanvote.com"));
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // Cache preflight requests за 1 час

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

                        boolean isSecureRequest = request.isSecure()
                                || request.getServerName().contains("smolyanvote.com");

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
