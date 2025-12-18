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

        // Логване на всички STOMP команди за debugging
        if (accessor != null) {
            StompCommand command = accessor.getCommand();
            if (command != null) {
                log.info("🔍 STOMP command received: {} - Session ID: {}", command, accessor.getSessionId());
                log.info("🔍 STOMP message type: {}", message.getClass().getSimpleName());
                log.info("🔍 STOMP channel: {}", channel.getClass().getSimpleName());
                
                // Логване на всички headers за debugging
                if (command == StompCommand.CONNECT) {
                    log.info("🔍 CONNECT command - All headers: {}", accessor.toMap());
                    log.info("🔍 CONNECT command - Native headers: {}", accessor.toNativeHeaderMap());
                }
            } else {
                log.debug("🔍 Message received but no STOMP command - Message type: {}", message.getClass().getSimpleName());
            }
        } else {
            log.debug("🔍 Message received but no StompHeaderAccessor - Message type: {}", message.getClass().getSimpleName());
        }

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("🔐 WebSocket CONNECT command received - Session ID: {}", accessor.getSessionId());
            
            // Извличане на JWT token от headers
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            
            log.info("🔐 Authorization headers: {}", authHeaders != null ? authHeaders.size() : "NULL");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                log.info("🔐 First auth header: {}", authHeaders.get(0).substring(0, Math.min(30, authHeaders.get(0).length())));
            } else {
                log.warn("⚠️ No Authorization header found in WebSocket CONNECT - JWT authentication will fail");
                log.warn("⚠️ All native headers: {}", accessor.toNativeHeaderMap());
                return message; // Return early if no auth header
            }

            if (authHeaders != null && !authHeaders.isEmpty()) {
                String authHeader = authHeaders.get(0);

                if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    log.info("🔐 JWT token extracted (length: {})", token.length());

                    try {
                        // Валидация на token
                        boolean isValid = jwtTokenService.validateToken(token);
                        boolean isAccessToken = jwtTokenService.isAccessToken(token);
                        log.info("🔐 Token validation: isValid={}, isAccessToken={}", isValid, isAccessToken);
                        
                        if (isValid && isAccessToken) {
                            // Извличане на user info
                            String email = jwtTokenService.extractEmail(token);
                            Long userId = jwtTokenService.extractUserId(token);
                            log.info("🔐 Extracted user info: email={}, userId={}", email, userId);

                            if (email != null && userId != null) {
                                Optional<UserEntity> userOptional = userRepository.findByEmail(email);

                                if (userOptional.isPresent()) {
                                    UserEntity user = userOptional.get();
                                    log.info("🔐 UserEntity found: ID={}, Email={}", user.getId(), user.getEmail());

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

                                        log.info("✅ WebSocket JWT authentication successful for user: {} (principal name: {})", 
                                                email, userPrincipal.getName());
                                    } else {
                                        log.warn("⚠️ User ID mismatch: token userId={}, db userId={}", userId, user.getId());
                                    }
                                } else {
                                    log.warn("⚠️ User not found in database for email: {}", email);
                                }
                            } else {
                                log.warn("⚠️ Failed to extract user info from token: email={}, userId={}", email, userId);
                            }
                        } else {
                            log.warn("⚠️ Token validation failed: isValid={}, isAccessToken={}", isValid, isAccessToken);
                        }
                    } catch (Exception e) {
                        log.error("❌ Error authenticating WebSocket connection with JWT: {}", e.getMessage(), e);
                    }
                } else {
                    log.warn("⚠️ Authorization header doesn't start with 'Bearer ' or is empty: {}", 
                            authHeader != null ? authHeader.substring(0, Math.min(30, authHeader.length())) : "NULL");
                }
            }
        }

        return message;
    }
}

