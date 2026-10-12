package com.unbora.api.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Filtro de protecao contra sobreuso e abusos de chamadas a IA (Groq) e Google Places.
 * Limita requisicoes consecutivas por IP em rotas publicas de recomendacao e busca.
 */
@Component
public class AiRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AiRateLimitFilter.class);

    // Maximo de 10 chamadas novas de IA por minuto por IP
    public static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(1);

    private static final class ClientWindow {
        private final AtomicInteger counter = new AtomicInteger(0);
        private volatile Instant windowStart = Instant.now();

        boolean allowRequest(Instant now) {
            if (Duration.between(windowStart, now).compareTo(WINDOW_DURATION) >= 0) {
                synchronized (this) {
                    if (Duration.between(windowStart, now).compareTo(WINDOW_DURATION) >= 0) {
                        windowStart = now;
                        counter.set(1);
                        return true;
                    }
                }
            }
            return counter.incrementAndGet() <= MAX_REQUESTS_PER_MINUTE;
        }

        boolean isExpired(Instant now) {
            return Duration.between(windowStart, now).compareTo(Duration.ofMinutes(5)) >= 0;
        }
    }

    private final ConcurrentHashMap<String, ClientWindow> clientBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (isAiExpensiveRoute(request)) {
            String clientIp = HttpRequestUtil.getClientIp(request);
            Instant now = Instant.now();

            ClientWindow window = clientBuckets.computeIfAbsent(clientIp, k -> new ClientWindow());
            if (!window.allowRequest(now)) {
                log.warn("[AiRateLimit] IP {} excedeu o limite de consultas ({}/min) na rota {}",
                        clientIp, MAX_REQUESTS_PER_MINUTE, request.getRequestURI());

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", "60");
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("""
                        {
                          "status": 429,
                          "error": "Too Many Requests",
                          "message": "Limite de consultas simultaneas atingido. Aguarde um minuto antes de solicitar novas recomendacoes."
                        }
                        """);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAiExpensiveRoute(HttpServletRequest request) {
        String method = request.getMethod();
        if (!"POST".equalsIgnoreCase(method)) {
            return false;
        }

        String uri = request.getRequestURI();
        if (uri == null) return false;

        return uri.startsWith("/api/recommend")
                || uri.startsWith("/api/recomendar")
                || uri.startsWith("/api/search")
                || uri.startsWith("/api/buscar")
                || uri.startsWith("/api/events");
    }

    @Scheduled(fixedRate = 600000) // Limpeza a cada 10 minutos
    public void cleanupStaleBuckets() {
        Instant now = Instant.now();
        clientBuckets.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
    }
}
