package smolyanVote.smolyanVote.config;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FrontendPropertiesTest {

    @Test
    void originForOAuth_prefersCanonicalHostFromForwardedHeaders() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("http://161.35.69.206");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn("smolyanvote.com");
        when(request.getHeader("X-Forwarded-Proto")).thenReturn("https");

        assertEquals("https://smolyanvote.com", props.originForOAuth(request));
    }

    @Test
    void originForOAuth_fallsBackToConfiguredUrlForRawIp() {
        FrontendProperties props = new FrontendProperties();
        props.setUrl("http://161.35.69.206");

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn(null);
        when(request.getServerName()).thenReturn("161.35.69.206");

        assertEquals("http://161.35.69.206", props.originForOAuth(request));
    }

    @Test
    void publicOriginFromRequest_normalizesWwwToApex() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn("www.smolyanvote.com, smolyanvote.com");

        assertEquals("https://smolyanvote.com", FrontendProperties.publicOriginFromRequest(request));
    }

    @Test
    void publicOriginFromRequest_returnsNullForUnknownHost() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-Host")).thenReturn(null);
        when(request.getServerName()).thenReturn("example.com");

        assertNull(FrontendProperties.publicOriginFromRequest(request));
    }
}
