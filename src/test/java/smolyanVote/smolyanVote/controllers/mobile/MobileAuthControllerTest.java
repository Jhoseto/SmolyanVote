package smolyanVote.smolyanVote.controllers.mobile;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;
import smolyanVote.smolyanVote.services.mobile.MobileOAuthService;
import smolyanVote.smolyanVote.viewsAndDTO.mobile.MobileLoginRequest;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MobileAuthControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtTokenService jwtTokenService;

    @Mock
    private MobileOAuthService mobileOAuthService;

    @InjectMocks
    private MobileAuthController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
        testUser = new UserEntity();
        testUser.setId(1L);
        testUser.setEmail("test@smolyanvote.com");
        testUser.setUsername("testuser");
        testUser.setRole(UserRole.USER);
        testUser.setStatus(UserStatusEnum.ACTIVE);
        testUser.setOnlineStatus(1);
        testUser.setLastOnline(Instant.now());
    }

    @Test
    void testLoginSuccess() throws Exception {
        MobileLoginRequest request = new MobileLoginRequest();
        request.setEmail("test@smolyanvote.com");
        request.setPassword("password123");

        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(userService.findUserByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(jwtTokenService.generateAccessToken(any(UserEntity.class))).thenReturn("access-token");
        when(jwtTokenService.generateRefreshToken(any(UserEntity.class))).thenReturn("refresh-token");
        when(userRepository.save(any(UserEntity.class))).thenReturn(testUser);

        mockMvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user").exists());
    }

    @Test
    void testLoginInvalidCredentials() throws Exception {
        MobileLoginRequest request = new MobileLoginRequest();
        request.setEmail("test@smolyanvote.com");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));
        when(userService.findUserByEmail(anyString())).thenReturn(Optional.of(testUser));

        mockMvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testLoginUserNotFound() throws Exception {
        MobileLoginRequest request = new MobileLoginRequest();
        request.setEmail("nonexistent@smolyanvote.com");
        request.setPassword("password123");

        when(userService.findUserByEmail(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void testLoginPendingActivation() throws Exception {
        testUser.setStatus(UserStatusEnum.PENDING_ACTIVATION);
        MobileLoginRequest request = new MobileLoginRequest();
        request.setEmail("test@smolyanvote.com");
        request.setPassword("password123");

        when(userService.findUserByEmail(anyString())).thenReturn(Optional.of(testUser));

        mockMvc.perform(post("/api/mobile/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }
}
