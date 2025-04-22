package smolyanVote.smolyanVote.securityAndComponent;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repository.UserRepository;
import smolyanVote.smolyanVote.services.UserService;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Configuration
public class ApplicationSecurityConfiguration {

    private final UserDetailsService customUserDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public ApplicationSecurityConfiguration(UserDetailsService customUserDetailsService,
                                            PasswordEncoder passwordEncoder,
                                            UserService userService,
                                            UserRepository userRepository) {
        this.customUserDetailsService = customUserDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
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
                                "/user/login",
                                "/login",
                                "/confirm",
                                "/mainEvents",
                                "/mainEventPage",
                                "/event/{id}",
                                "/eventDetailView"
                        ).permitAll()
                        .requestMatchers(
                                "/create",
                                "/createEvent",
                                "/createNewEvent",
                                "/mainEventPage",
                                "/user/logout",
                                "/user/profile/**",
                                "/user/dashboard/**")
                        .authenticated()
                        .requestMatchers(
                                "/admin/**")
                        .hasRole("ADMIN")
                        .anyRequest().denyAll()
                )

                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("email") // 👈 Email като потребителско име
                        .passwordParameter("password")
                        .defaultSuccessUrl("/index", true)
                        .failureUrl("/login?error=true")
                        .permitAll()
                )

                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
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
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            String msg = URLEncoder.encode("Съдържанието е достъпно само за Администратори !", StandardCharsets.UTF_8);
                            response.sendRedirect("/login?error=" + msg);
                        })
                        .authenticationEntryPoint((request, response, authException) -> {
                            String msg = URLEncoder.encode("Моля влезте в профила си или се регистрирайте за да продължите !", StandardCharsets.UTF_8);
                            response.sendRedirect("/login?authError=" + msg);
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
