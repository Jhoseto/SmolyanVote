package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.Filter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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
import smolyanVote.smolyanVote.config.FrontendProperties;
import smolyanVote.smolyanVote.services.KeyGenerator;
import smolyanVote.smolyanVote.services.serviceImpl.CustomOAuth2UserService;

import java.util.Collection;
import java.util.List;

@Configuration
@EnableMethodSecurity
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
        private final UserBanEnforcementFilter userBanEnforcementFilter;
        private final FrontendProperties frontendProperties;

        public ApplicationSecurityConfiguration(UserDetailsService customUserDetailsService,
                        PasswordEncoder passwordEncoder,
                        CustomLogoutSuccessHandler customLogoutSuccessHandler,
                        CustomOAuth2UserService customOAuth2UserService,
                        OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
                        OAuth2AuthenticationFailureHandler oAuth2AuthenticationFailureHandler,
                        JwtAuthenticationFilter jwtAuthenticationFilter,
                        UserBanEnforcementFilter userBanEnforcementFilter,
                        FrontendProperties frontendProperties) {
                this.customUserDetailsService = customUserDetailsService;
                this.passwordEncoder = passwordEncoder;
                this.customLogoutSuccessHandler = customLogoutSuccessHandler;
                this.oAuth2UserService = customOAuth2UserService;
                this.frontendProperties = frontendProperties;
                this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
                this.oAuth2AuthenticationFailureHandler = oAuth2AuthenticationFailureHandler;
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.userBanEnforcementFilter = userBanEnforcementFilter;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                CookieCsrfTokenRepository csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
                csrfTokenRepository.setCookiePath("/");
                // CSRF cookie трябва да е достъпен от JavaScript за да може web версията да го
                // прочете
                // SameSite=Lax за да работи с cross-site заявки, но все още да е защитен

                http
                                .headers(headers -> headers
                                                .httpStrictTransportSecurity(hsts -> hsts
                                                                .maxAgeInSeconds(31536000) // 1 година
                                                                .includeSubDomains(true))
                                                .frameOptions(frame -> frame.sameOrigin())
                                                .contentTypeOptions(contentType -> {
                                                })
                                                .xssProtection(xss -> {
                                                }))
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                .authorizeHttpRequests(authz -> authz
                                                // Allow CORS preflight OPTIONS for messenger API so browser can POST
                                                // without
                                                // 405
                                                .requestMatchers(HttpMethod.OPTIONS, "/api/svmessenger/**",
                                                                "/api/mobile/**", "/api/v1/**")
                                                .permitAll()
                                                // Mobile Auth endpoints - permitAll (JWT validation в filter)
                                                .requestMatchers("/api/mobile/auth/login", "/api/mobile/auth/refresh",
                                                                "/api/mobile/auth/logout")
                                                .permitAll()
                                                // start-oauth: браузърът отваря този URL без JWT; задава cookie и
                                                // редирект към OAuth
                                                .requestMatchers("/api/mobile/auth/start-oauth").permitAll()
                                                // Mobile Device endpoints - изискват authentication
                                                .requestMatchers("/api/mobile/device/**").authenticated()
                                                // Статични ресурси и podcast window - трябва да са преди другите
                                                // правила
                                                .requestMatchers("/podcast/**",
                                                                "/images/**", "/fonts/**",
                                                                "/static/**", "/svmessenger.apk",
                                                                "/svmessenger/sounds/**", "/svmessenger/img/**")
                                                .permitAll()
                                                .requestMatchers("/api/podcast/**").permitAll()
                                                // Public /api/v1 read endpoints for the new Next.js frontend
                                                .requestMatchers(HttpMethod.GET, "/api/v1/stats/**",
                                                                "/api/v1/events/**", "/api/v1/publications/**",
                                                                "/api/v1/signals/**", "/api/v1/monitor/**")
                                                .permitAll()
                                                // Коментари — публично четене за гости (сигнали/публикации са public)
                                                .requestMatchers(HttpMethod.GET, "/api/comments/**")
                                                .permitAll()
                                                // View counting — public (once per session from frontend)
                                                .requestMatchers(HttpMethod.POST, "/api/v1/signals/*/view")
                                                .permitAll()
                                                // Публичен профил (Фаза 7) - GET е публичен (viewing без логин, като
                                                // legacy /user/{username}); /api/v1/users/me и PUT /me остават
                                                // authenticated чрез generic-ия matcher по-долу
                                                .requestMatchers(HttpMethod.GET, "/api/v1/users/*",
                                                                "/api/v1/users/*/events", "/api/v1/users/*/signals",
                                                                "/api/v1/users/*/followers", "/api/v1/users/*/following")
                                                .permitAll()
                                                // Записване на share не изисква логин, както в legacy
                                                // `PublicationsController#sharePublication`
                                                .requestMatchers(HttpMethod.POST, "/api/v1/publications/*/share")
                                                .permitAll()
                                                // WebSocket handshake endpoints - permitAll (authentication се
                                                // проверява от JWT
                                                // interceptor при STOMP CONNECT / handshake handler)
                                                .requestMatchers("/ws-svmessenger/**", "/ws/notifications/**",
                                                                "/ws/admin/activity/**")
                                                .permitAll()
                                                // Нов JSON /api/v1/contact endpoint (тънък контролер) - публична
                                                // форма за контакт, без authentication (v1 паритет с /contact)
                                                .requestMatchers(HttpMethod.POST, "/api/v1/contact").permitAll()
                                                // Нови JSON /api/v1/auth/** endpoints (тънки контролери) за Next.js
                                                // frontend - публични auth действия без session/CSRF (v1 паритет
                                                // с /register, /forgotten_password, /reset-password, /confirm)
                                                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register",
                                                                "/api/v1/auth/forgot-password",
                                                                "/api/v1/auth/reset-password")
                                                .permitAll()
                                                .requestMatchers(HttpMethod.GET, "/api/v1/auth/confirm",
                                                                "/api/v1/auth/oauth/start")
                                                .permitAll()
                                                .requestMatchers(
                                                                "/oauth2/**", "/login/oauth2/**",
                                                                "/heartbeat", "/favicon.ico",
                                                                "/actuator/**")
                                                .permitAll()
                                                .requestMatchers("/admin/**", "/sockjs-node/**", "/stomp/**")
                                                .hasRole("ADMIN")
                                                // Signal moderation — admin only (before generic /api/v1/signals/** auth)
                                                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                                                "/api/v1/signals/*/moderate")
                                                .hasRole("ADMIN")
                                                // Podcast admin API — JWT + ROLE_ADMIN (list/update/delete/upload)
                                                .requestMatchers("/api/v1/podcast/**")
                                                .hasRole("ADMIN")
                                                // Гласуване и създаване изискват authentication
                                                .requestMatchers(
                                                                "/comments/**", "/api/comments/**",
                                                                "/user/logout",
                                                                "/api/v1/subscriptions", "/api/v1/subscriptions/**",
                                                                "/api/v1/users/**", "/api/v1/votes/**",
                                                                "/api/v1/events/**", "/api/v1/publications/**",
                                                                "/api/v1/signals/**",
                                                                "/api/reports/**",
                                                                "/api/follow/**",
                                                                "/api/notifications/**",
                                                                "/api/svmessenger/**",
                                                                "/api/mobile/**")
                                                .authenticated()
                                                .anyRequest().denyAll())
                                .logout(logout -> logout
                                                .logoutUrl("/logout")
                                                .logoutSuccessHandler(customLogoutSuccessHandler)
                                                .logoutSuccessUrl("/")
                                                .invalidateHttpSession(true)
                                                .clearAuthentication(true)
                                                .deleteCookies("JSESSIONID", "__Secure-JSESSIONID", "remember-me",
                                                                "XSRF-TOKEN")
                                                .permitAll())
                                .rememberMe(rememberMe -> rememberMe
                                                .key(rememberMeKey())
                                                .rememberMeParameter("remember-me")
                                                .userDetailsService(customUserDetailsService)
                                                // Secure cookies break remember-me on local HTTP
                                                .useSecureCookie(SecureCookieConfig.isProductionProfile(activeProfile)))
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
                                                        if (wantsBrowserHtml(request) && !isApiPath(request)) {
                                                                response.sendRedirect(
                                                                                frontendProperties.origin() + "/");
                                                                return;
                                                        }
                                                        if (isApiPath(request) || wantsJson(request)) {
                                                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                                                response.setContentType("application/json;charset=UTF-8");
                                                                response.getWriter().write(
                                                                                "{\"message\":\"Forbidden\"}");
                                                                return;
                                                        }
                                                        response.sendRedirect(frontendProperties.origin() + "/");
                                                })
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        if (wantsBrowserHtml(request) && !isApiPath(request)) {
                                                                response.sendRedirect(
                                                                                frontendProperties.origin()
                                                                                                + "/login");
                                                                return;
                                                        }
                                                        if (isApiPath(request) || wantsJson(request)) {
                                                                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                                response.setContentType("application/json;charset=UTF-8");
                                                                response.getWriter().write(
                                                                                "{\"message\":\"Unauthorized\"}");
                                                                return;
                                                        }
                                                        response.sendRedirect(
                                                                        frontendProperties.origin() + "/login");
                                                }))
                                .csrf(csrf -> csrf
                                                // ✅ CSRF PROTECTION - Правилна имплементация за web и mobile
                                                // Mobile API endpoints са exempt (използват JWT tokens в Authorization
                                                // header)
                                                // Web messenger API endpoints ИЗПОЛЗВАТ CSRF protection (session
                                                // cookies +
                                                // X-XSRF-TOKEN header)
                                                .ignoringRequestMatchers(
                                                                // Static resources
                                                                "/images/**", "/fonts/**",
                                                                "/podcast/**", "/api/podcast/**",
                                                                "/heartbeat",
                                                                // WebSocket endpoints
                                                                "/ws-svmessenger/**", "/ws/notifications/**",
                                                                "/ws/admin/activity/**",
                                                                // Other public endpoints
                                                                "/robots.txt", "/sitemap.xml",
                                                                // Mobile API endpoints (JWT authentication)
                                                                "/api/mobile/**",
                                                                // Public JSON contact form (new Next.js frontend,
                                                                // anonymous - honeypot + timestamp anti-spam instead)
                                                                "/api/v1/contact",
                                                                // Public JSON auth endpoints (new Next.js frontend,
                                                                // anonymous - no session/CSRF token available yet)
                                                                "/api/v1/auth/register", "/api/v1/auth/forgot-password",
                                                                "/api/v1/auth/reset-password",
                                                                // Next.js JWT vote writes (Idempotency-Key + Bearer;
                                                                // Bearer matcher below also covers this — explicit for clarity)
                                                                "/api/v1/votes/**",
                                                                // Public view/share counters (anonymous session)
                                                                "/api/v1/signals/*/view",
                                                                "/api/v1/publications/*/share",
                                                                // LiveKit call token endpoint (used by mobile app with
                                                                // JWT)
                                                                "/api/svmessenger/call/token")
                                                // Custom matcher: exempt само Bearer JWT tokens (mobile app)
                                                // Web заявките изискват CSRF token в X-XSRF-TOKEN header
                                                // Това предотвратява CSRF bypass чрез фалшиви Authorization headers
                                                .ignoringRequestMatchers(request -> {
                                                        String authHeader = request.getHeader("Authorization");
                                                        // Exempt само Bearer JWT tokens от mobile app
                                                        // Други Authorization schemes (Basic, Digest, etc.) все още
                                                        // изискват CSRF
                                                        return authHeader != null &&
                                                                        authHeader.startsWith("Bearer ") &&
                                                                        authHeader.length() > 100; // JWT tokens са
                                                                                                   // достатъчно дълги
                                                })
                                                .csrfTokenRepository(csrfTokenRepository))
                                // Добавяне на JWT filter преди UsernamePasswordAuthenticationFilter
                                .addFilterBefore(jwtAuthenticationFilter,
                                                org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(userBanEnforcementFilter, JwtAuthenticationFilter.class);

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

        /**
         * Cookie attribute normalization for session / CSRF cookies.
         */
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // Development: allow specific localhost ports and Android emulator, Production:
                // only production domains
                if ("dev".equals(activeProfile) || "development".equals(activeProfile)) {
                        configuration.setAllowedOriginPatterns(List.of(
                                        "https://smolyanvote.com",
                                        "https://www.smolyanvote.com",
                                        "http://localhost:3000", // React dev server
                                        "http://localhost:8081", // Metro bundler
                                        "http://127.0.0.1:3000",
                                        "http://127.0.0.1:8081",
                                        "http://10.0.2.2:8081", // Android Emulator Metro
                                        "ws://localhost:3000", // WebSocket for React
                                        "ws://127.0.0.1:3000",
                                        "ws://10.0.2.2:8081")); // WebSocket for Android
                } else {
                        configuration.setAllowedOriginPatterns(List.of(
                                        "https://smolyanvote.com",
                                        "https://www.smolyanvote.com",
                                        "wss://smolyanvote.com", // WebSocket for production
                                        "wss://www.smolyanvote.com"));
                }

                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                configuration.setAllowedHeaders(
                                List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "X-Requested-With"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L); // Cache preflight requests за 1 час

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        private static boolean isApiPath(jakarta.servlet.http.HttpServletRequest request) {
                return BrowserRequestUtils.isApiPath(request);
        }

        private static boolean wantsJson(jakarta.servlet.http.HttpServletRequest request) {
                String accept = request.getHeader("Accept");
                return accept != null && accept.contains("application/json");
        }

        private static boolean wantsBrowserHtml(jakarta.servlet.http.HttpServletRequest request) {
                return BrowserRequestUtils.isBrowserDocumentRequest(request);
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

                                                // CSRF token cookie (XSRF-TOKEN) не трябва да има HttpOnly за да може
                                                // JavaScript да го прочете
                                                // CookieCsrfTokenRepository вече го конфигурира правилно, но нека се
                                                // уверим че
                                                // не го променяме
                                                if (!header.toLowerCase().contains("httponly")
                                                                && !header.startsWith("XSRF-TOKEN")) {
                                                        updatedHeader += "; HttpOnly";
                                                }

                                                // SameSite=Lax за всички cookies (включително CSRF token)
                                                // Това работи правилно за same-origin заявки
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
