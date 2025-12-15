package smolyanVote.smolyanVote.services.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit тестове за JwtTokenService
 */
@ExtendWith(MockitoExtension.class)
class JwtTokenServiceTest {

    private JwtTokenService jwtTokenService;
    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        jwtTokenService = new JwtTokenService();
        
        // Set test values using reflection
        ReflectionTestUtils.setField(jwtTokenService, "jwtSecret", 
            "TestSecretKeyForJWTTestingMinimum256BitsRequiredForHS256Algorithm");
        ReflectionTestUtils.setField(jwtTokenService, "accessTokenExpiration", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtTokenService, "refreshTokenExpiration", 604800000L); // 7 days

        // Create test user
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setEmail("test@smolyanvote.com");
        testUser.setUsername("testuser");
        testUser.setRole(UserRole.USER);
    }

    @Test
    void testGenerateAccessToken() {
        // Act
        String token = jwtTokenService.generateAccessToken(testUser);

        // Assert
        assertNotNull(token, "Access token should not be null");
        assertFalse(token.isEmpty(), "Access token should not be empty");
        assertTrue(token.length() > 50, "Access token should be a valid JWT");
    }

    @Test
    void testGenerateRefreshToken() {
        // Act
        String token = jwtTokenService.generateRefreshToken(testUser);

        // Assert
        assertNotNull(token, "Refresh token should not be null");
        assertFalse(token.isEmpty(), "Refresh token should not be empty");
        assertTrue(token.length() > 50, "Refresh token should be a valid JWT");
    }

    @Test
    void testValidateToken() {
        // Arrange
        String token = jwtTokenService.generateAccessToken(testUser);

        // Act
        boolean isValid = jwtTokenService.validateToken(token);

        // Assert
        assertTrue(isValid, "Valid token should pass validation");
    }

    @Test
    void testExtractEmail() {
        // Arrange
        String token = jwtTokenService.generateAccessToken(testUser);

        // Act
        String email = jwtTokenService.extractEmail(token);

        // Assert
        assertEquals(testUser.getEmail(), email, "Extracted email should match user email");
    }

    @Test
    void testExtractUserId() {
        // Arrange
        String token = jwtTokenService.generateAccessToken(testUser);

        // Act
        Long userId = jwtTokenService.extractUserId(token);

        // Assert
        assertEquals(testUser.getId(), userId, "Extracted user ID should match user ID");
    }

    @Test
    void testIsAccessToken() {
        // Arrange
        String accessToken = jwtTokenService.generateAccessToken(testUser);
        String refreshToken = jwtTokenService.generateRefreshToken(testUser);

        // Act & Assert
        assertTrue(jwtTokenService.isAccessToken(accessToken), "Access token should be identified as access token");
        assertFalse(jwtTokenService.isAccessToken(refreshToken), "Refresh token should not be identified as access token");
    }

    @Test
    void testIsRefreshToken() {
        // Arrange
        String accessToken = jwtTokenService.generateAccessToken(testUser);
        String refreshToken = jwtTokenService.generateRefreshToken(testUser);

        // Act & Assert
        assertTrue(jwtTokenService.isRefreshToken(refreshToken), "Refresh token should be identified as refresh token");
        assertFalse(jwtTokenService.isRefreshToken(accessToken), "Access token should not be identified as refresh token");
    }

    @Test
    void testInvalidTokenValidation() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act
        boolean isValid = jwtTokenService.validateToken(invalidToken);

        // Assert
        assertFalse(isValid, "Invalid token should fail validation");
    }

    @Test
    void testTokenTypeExtraction() {
        // Arrange
        String accessToken = jwtTokenService.generateAccessToken(testUser);
        String refreshToken = jwtTokenService.generateRefreshToken(testUser);

        // Act
        String accessTokenType = jwtTokenService.extractTokenType(accessToken);
        String refreshTokenType = jwtTokenService.extractTokenType(refreshToken);

        // Assert
        assertEquals("ACCESS", accessTokenType, "Access token type should be ACCESS");
        assertEquals("REFRESH", refreshTokenType, "Refresh token type should be REFRESH");
    }
}

