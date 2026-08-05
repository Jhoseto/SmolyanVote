package smolyanVote.smolyanVote.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FrontendPropertiesTest {

    @Test
    void originForOAuth_localDevAlwaysUsesConfiguredFrontendPort() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("http://localhost:3000");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn(null);
        when(request.getServerName()).thenReturn("localhost");

        assertEquals("http://localhost:3000", props.originForOAuth(request));
    }

    @Test
    void originForOAuth_productionUsesConfiguredWhenHostMatches() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("https://smolyanvote.com");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn("smolyanvote.com");

        assertEquals("https://smolyanvote.com", props.originForOAuth(request));
    }

    @Test
    void originForOAuth_productionOverridesStaleIpInEnv() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("http://161.35.69.206");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn("smolyanvote.com");
        when(request.getHeader("X-Forwarded-Proto")).thenReturn("https");

        assertEquals("https://smolyanvote.com", props.originForOAuth(request));
    }

    @Test
    void originForOAuth_canonicalEnvIgnoresIpCallbackHost() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("https://smolyanvote.com");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn("161.35.69.206");
        when(request.getHeader("X-Forwarded-Proto")).thenReturn("http");
        when(request.getServerName()).thenReturn("161.35.69.206");
        when(request.getScheme()).thenReturn("http");

        assertEquals("https://smolyanvote.com", props.originForOAuth(request));
    }

    @Test
    void originForOAuth_emergencyIpLoginStaysOnIp() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("http://161.35.69.206");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn("161.35.69.206");
        when(request.getHeader("X-Forwarded-Proto")).thenReturn("http");
        when(request.getScheme()).thenReturn("http");

        assertEquals("http://161.35.69.206", props.originForOAuth(request));
    }

    @Test
    void originHostMatches_treatsWwwAndApexAsSameSite() {
        assertTrue(FrontendProperties.originHostMatches("www.smolyanvote.com", "https://smolyanvote.com"));
        assertTrue(FrontendProperties.originHostMatches("smolyanvote.com", "https://www.smolyanvote.com"));
        assertFalse(FrontendProperties.originHostMatches("161.35.69.206", "https://smolyanvote.com"));
    }

    @Test
    void publicOriginFromHost_normalizesWwwToApex() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        assertEquals(
                "https://smolyanvote.com",
                FrontendProperties.publicOriginFromHost(request, "www.smolyanvote.com"));
    }

    @Test
    void publicOriginFromHost_returnsNullForUnknownHost() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        assertNull(FrontendProperties.publicOriginFromHost(request, "example.com"));
    }
}
