package smolyanVote.smolyanVote.config.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import smolyanVote.smolyanVote.config.websocket.UserPrincipal;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * WebSocket Interceptor за JWT Authentication
 * Извлича JWT token от STOMP headers и аутентицира user
 */
@Component
@Slf4j
public class JwtWebSocketInterceptor implements ChannelInterceptor {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    public JwtWebSocketInterceptor(JwtTokenService jwtTokenService, UserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Извличане на JWT token от headers
            List<String> authHeaders = accessor.getNativeHeader("Authorization");

            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);

                if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);

                    try {
                        // Валидация на token
                        if (jwtTokenService.validateToken(token) && jwtTokenService.isAccessToken(token)) {
                            // Извличане на user info
                            String email = jwtTokenService.extractEmail(token);
                            Long userId = jwtTokenService.extractUserId(token);

                            if (email != null && userId != null) {
                                Optional<UserEntity> userOptional = userRepository.findByEmail(email);

                                if (userOptional.isPresent()) {
                                    UserEntity user = userOptional.get();

                                    if (user.getId().equals(userId)) {
                                        // Създаване на UserPrincipal за правилно WebSocket routing
                                        // UserPrincipal гарантира че getName() винаги връща lowercase email
                                        UserPrincipal userPrincipal = new UserPrincipal(user);
                                        
                                        // Създаване на authentication с UserPrincipal
                                        String role = user.getRole() != null ? user.getRole().name() : "USER";
                                        UsernamePasswordAuthenticationToken authentication =
                                                new UsernamePasswordAuthenticationToken(
                                                        userPrincipal,
                                                        null,
                                                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                                                );

                                        // Set authentication в accessor
                                        accessor.setUser(authentication);

                                        log.info("WebSocket JWT authentication successful for user: {} (principal name: {})", 
                                                email, userPrincipal.getName());
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error authenticating WebSocket connection with JWT: {}", e.getMessage());
                    }
                }
            }
        }

        return message;
    }
}

