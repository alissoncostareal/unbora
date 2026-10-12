package com.unbora.api.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiRateLimitFilterTest {

    private AiRateLimitFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new AiRateLimitFilter();
        filterChain = mock(FilterChain.class);
    }

    @Test
    void shouldAllowUnderLimit() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/recommend");
        request.setRemoteAddr("200.100.50.1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertEquals(200, response.getStatus());
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void shouldBlockWhenExceedingLimit() throws ServletException, IOException {
        String ip = "200.100.50.2";

        // Realiza 10 requisições permitidas
        for (int i = 0; i < AiRateLimitFilter.MAX_REQUESTS_PER_MINUTE; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/recommend");
            req.setRemoteAddr(ip);
            MockHttpServletResponse res = new MockHttpServletResponse();
            filter.doFilterInternal(req, res, filterChain);
            assertEquals(200, res.getStatus());
        }

        // A 11ª requisição deve ser bloqueada com HTTP 429
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/recommend");
        blockedReq.setRemoteAddr(ip);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();

        filter.doFilterInternal(blockedReq, blockedRes, filterChain);

        assertEquals(429, blockedRes.getStatus());
        assertTrue(blockedRes.getContentAsString().contains("Too Many Requests"));
        assertEquals("60", blockedRes.getHeader("Retry-After"));
    }

    @Test
    void shouldIgnoreNonAiRoutes() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/snapshot/abc");
        request.setRemoteAddr("200.100.50.3");
        MockHttpServletResponse response = new MockHttpServletResponse();

        for (int i = 0; i < 20; i++) {
            filter.doFilterInternal(request, response, filterChain);
        }

        assertEquals(200, response.getStatus());
        verify(filterChain, times(20)).doFilter(request, response);
    }
}
