package smolyanVote.smolyanVote.services.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.UserEntity;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT Token Service за мобилно приложение
 * Генерира и валидира JWT tokens за mobile authentication
 */
@Service
@Slf4j
public class JwtTokenService {

    @Value("${jwt.secret:SmolyanVote-Super-Secret-Key-Change-In-Production-Min-256-Bits}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration:3600000}") // 1 час по подразбиране
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800000}") // 7 дни по подразбиране
    private long refreshTokenExpiration;

    /**
     * Генерира SecretKey от secret string
     */
    private SecretKey getSigningKey() {
        // Ensure secret is at least 256 bits (32 bytes)
        String secret = jwtSecret;
        if (secret.length() < 32) {
            secret = secret.repeat((32 / secret.length()) + 1).substring(0, 32);
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Генерира Access Token за user
     */
    public String generateAccessToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("username", user.getUsername());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole() != null ? user.getRole().name() : "USER");
        claims.put("type", "ACCESS");

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail()) // Subject е email за consistency
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Генерира Refresh Token за user
     */
    public String generateRefreshToken(UserEntity user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("type", "REFRESH");

        return Jwts.builder()
                .claims(claims)
                .subject(user.getEmail())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Извлича всички claims от token
     */
    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.error("Error extracting claims from token: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Извлича конкретен claim
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Извлича email (subject) от token
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Извлича user ID от token
     */
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        Object userIdObj = claims.get("userId");
        if (userIdObj instanceof Integer) {
            return ((Integer) userIdObj).longValue();
        } else if (userIdObj instanceof Long) {
            return (Long) userIdObj;
        }
        return null;
    }

    /**
     * Извлича token type (ACCESS или REFRESH)
     */
    public String extractTokenType(String token) {
        return extractClaim(token, claims -> (String) claims.get("type"));
    }

    /**
     * Проверява дали token е валиден
     */
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Проверява дали token е изтекъл
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = extractClaim(token, Claims::getExpiration);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Проверява дали token е Access Token
     */
    public boolean isAccessToken(String token) {
        try {
            String type = extractTokenType(token);
            return "ACCESS".equals(type);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Проверява дали token е Refresh Token
     */
    public boolean isRefreshToken(String token) {
        try {
            String type = extractTokenType(token);
            return "REFRESH".equals(type);
        } catch (Exception e) {
            return false;
        }
    }
}

