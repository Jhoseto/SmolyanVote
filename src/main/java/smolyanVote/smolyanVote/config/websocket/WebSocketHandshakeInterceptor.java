package smolyanVote.smolyanVote.config.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * WebSocket Handshake Interceptor
 * Извлича access_token от WebSocket URL query parameters за plain WebSocket connections
 */
@Component
@Slf4j
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {

        log.info("🚨🚨🚨 HANDSHAKE INTERCEPTOR CALLED 🚨🚨🚨");
        log.info("🔌 WebSocket handshake started for: {}", request.getURI());

        // Поставяме URI-то в session attributes за да може JWT interceptor да го получи
        attributes.put("websocket_uri", request.getURI().toString());

        // Извличане на query parameters от WebSocket URL (за plain WebSocket connections)
        String query = request.getURI().getQuery();
        log.info("🔌 Query string: {}", query);

        if (query != null && query.contains("access_token=")) {
            String[] params = query.split("&");
            for (String param : params) {
                if (param.startsWith("access_token=")) {
                    String token = param.substring("access_token=".length());
                    attributes.put("access_token", token);
                    log.info("🔐 Access token extracted from WebSocket URL query parameter (length: {})", token.length());
                    break;
                }
            }
        }

        // За SockJS connections, token вече е в headers от SockJS client
        log.info("🔌 WebSocket handshake attributes: {}", attributes.keySet());
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            log.error("❌ WebSocket handshake failed: {}", exception.getMessage());
        } else {
            log.info("✅ WebSocket handshake completed successfully");
        }
    }
}
