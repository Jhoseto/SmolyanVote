package smolyanVote.smolyanVote.config.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

/**
 * Handshake за SockJS {@code /ws/admin/activity}.
 * Session Principal (V1) или JWT {@code ?access_token=} (Next.js) — само ADMIN.
 */
@Component
@Slf4j
public class AdminActivityHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    public AdminActivityHandshakeHandler(JwtTokenService jwtTokenService, UserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        Principal sessionPrincipal = super.determineUser(request, wsHandler, attributes);
        if (sessionPrincipal != null) {
            return sessionPrincipal;
        }

        String token = extractAccessToken(request);
        if (token == null) {
            return null;
        }

        try {
            if (!jwtTokenService.validateToken(token) || !jwtTokenService.isAccessToken(token)) {
                return null;
            }

            String email = jwtTokenService.extractEmail(token);
            Long userId = jwtTokenService.extractUserId(token);
            if (email == null || userId == null) {
                return null;
            }

            Optional<UserEntity> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty() || !userOptional.get().getId().equals(userId)) {
                log.warn("Admin activity WS: JWT user mismatch for email {}", email);
                return null;
            }

            UserEntity user = userOptional.get();
            if (user.getRole() != UserRole.ADMIN) {
                log.warn("Admin activity WS: rejected non-ADMIN user {}", user.getUsername());
                return null;
            }

            String username = user.getUsername();
            return () -> username;
        } catch (Exception e) {
            log.error("Admin activity WS handshake failed: {}", e.getMessage());
            return null;
        }
    }

    private String extractAccessToken(ServerHttpRequest request) {
        String query = request.getURI().getQuery();
        if (query == null) return null;

        for (String param : query.split("&")) {
            if (param.startsWith("access_token=")) {
                return param.substring("access_token=".length());
            }
        }
        return null;
    }
}
