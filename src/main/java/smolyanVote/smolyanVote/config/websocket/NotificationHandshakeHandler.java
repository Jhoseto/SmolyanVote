package smolyanVote.smolyanVote.config.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

/**
 * Handshake handler за raw SockJS endpoint `/ws/notifications`.
 *
 * V1 разчиташе изцяло на HttpSession Principal (session cookie login), което
 * не работи за новия Next.js frontend — той е JWT-only и няма Spring Session.
 * Тук извличаме JWT от `access_token` query param (SockJS handshake), точно
 * както прави {@link WebSocketHandshakeInterceptor} за `/ws-svmessenger`.
 *
 * Principal.getName() връща {@code UserEntity.getUsername()} — същият ключ,
 * който {@code NotificationServiceImpl#sendToUser} вече ползва при push,
 * за да остане push-механизмът консистентен и за двата флоу (session + JWT).
 */
@Component
@Slf4j
public class NotificationHandshakeHandler extends DefaultHandshakeHandler {

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    public NotificationHandshakeHandler(JwtTokenService jwtTokenService, UserRepository userRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userRepository = userRepository;
    }

    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                       Map<String, Object> attributes) {
        // Session-based потребители (стар V1 браузър флоу) вече имат Principal
        // от HttpSession — пазим го, JWT е само fallback за новия frontend.
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
                log.warn("Notification WS handshake: JWT user mismatch for email {}", email);
                return null;
            }

            String username = userOptional.get().getUsername();
            return () -> username;
        } catch (Exception e) {
            log.error("Notification WS handshake: JWT validation failed: {}", e.getMessage());
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
