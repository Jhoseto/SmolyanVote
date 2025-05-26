package smolyanVote.smolyanVote.componentsAndSecurity;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import smolyanVote.smolyanVote.services.KeyGenerator;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
        http
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers(
                                "/webjars/**",
                                "/css/**",
                                "/js/**",
                                "/images/**",
                                "/fonts/**",
                                "/impl/**",
                                "/video/**",
                                "/",
                                "/index",
                                "/forgotten_password",
                                "/user/registration",
                                "/registration",
                                "/register",
                                "/about",
                                "/login",
                                "/logout",
                                "/user/login",
                                "/user/logout",
                                "/confirm/**",
                                "/mainEvents",
                                "/mainEventPage",
                                "/event",
                                "/eventDetailView",
                                "/news",
                                "/error",
                                "/favicon.ico",
                                "/robots.txt"
                        ).permitAll()
                        .requestMatchers(
                                "/referendumVote",
                                "/referendum/**",
                                "/referendum",
                                "/user/**",
                                "/profile/update",
                                "/profile",
                                "/userProfile",
                                "/comments/**",
                                "/api/comments/**",
                                "/simpleVote",
                                "/create",
                                "/event/**",
                                "/createEvent",
                                "/createNewEvent", "/user/logout",
                                "/user/profile/**",
                                "/user/dashboard/**")

                        .authenticated()

                        .requestMatchers(
                                "/admin/**")
                        .hasRole("ADMIN")
                        .anyRequest().denyAll()
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessHandler(customLogoutSuccessHandler)
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID", "remember-me")
                        .permitAll()
                )


                .rememberMe(rememberMe -> rememberMe
                        .key(rememberMeKey())
                        .rememberMeParameter("remember-me")
                        .userDetailsService(customUserDetailsService)
                )

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
                )

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            String ajaxHeader = request.getHeader("X-Requested-With");
                            if ("XMLHttpRequest".equals(ajaxHeader)) {
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Моля влезте в профила си или се регистрирайте за да продължите !");
                            } else {
                                String msg = URLEncoder.encode("Моля влезте в профила си или се регистрирайте за да продължите !", StandardCharsets.UTF_8);
                                response.sendRedirect("/login?authError=" + msg);
                            }
                        })
                )

                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
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
}
