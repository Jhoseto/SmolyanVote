package smolyanVote.smolyanVote.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ClientIpResolverTest {

    private ClientIpResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new ClientIpResolver();
    }

    @Test
    void resolve_prefersCloudflareHeader() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("CF-Connecting-IP")).thenReturn("203.0.113.10");
        when(request.getHeader("X-Forwarded-For")).thenReturn("198.51.100.1");

        assertEquals("203.0.113.10", resolver.resolve(request));
    }

    @Test
    void resolve_usesFirstHopFromXForwardedFor() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("CF-Connecting-IP")).thenReturn(null);
        when(request.getHeader("True-Client-IP")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn("198.51.100.5, 10.0.0.1");

        assertEquals("198.51.100.5", resolver.resolve(request));
    }

    @Test
    void resolve_normalizesIpv4MappedIpv6() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("CF-Connecting-IP")).thenReturn("::ffff:192.168.1.42");

        assertEquals("192.168.1.42", resolver.resolve(request));
    }

    @Test
    void resolve_fallsBackToRemoteAddr() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("CF-Connecting-IP")).thenReturn(null);
        when(request.getHeader("True-Client-IP")).thenReturn(null);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getHeader("X-Real-IP")).thenReturn(null);
        when(request.getHeader("Proxy-Client-IP")).thenReturn(null);
        when(request.getHeader("WL-Proxy-Client-IP")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        assertEquals("127.0.0.1", resolver.resolve(request));
    }

    @Test
    void resolve_returnsNullForInvalidRemoteAddr() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRemoteAddr()).thenReturn("not-an-ip!!!");

        assertNull(resolver.resolve(request));
    }

    @Test
    void isValid_rejectsBlank() {
        assertFalse(resolver.isValid(null));
        assertFalse(resolver.isValid(""));
        assertFalse(resolver.isValid("   "));
    }

    @Test
    void isValid_acceptsIpv4AndIpv6() {
        assertTrue(resolver.isValid("192.0.2.1"));
        assertTrue(resolver.isValid("2001:db8::1"));
    }
}
