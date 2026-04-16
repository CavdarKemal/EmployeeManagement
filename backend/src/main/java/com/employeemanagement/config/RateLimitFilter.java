package com.employeemanagement.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Einfaches Rate-Limiting für den Login-Endpoint.
 * Erlaubt max. 10 Login-Versuche pro IP-Adresse innerhalb von 60 Sekunden.
 */
@Component
public class RateLimitFilter implements Filter {

    private static final int MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS = 60_000;

    private final Map<String, RateEntry> attempts = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;

        if ("POST".equalsIgnoreCase(req.getMethod())
                && req.getRequestURI().contains("/auth/login")) {

            String ip = getClientIp(req);
            RateEntry entry = attempts.compute(ip, (k, v) -> {
                long now = System.currentTimeMillis();
                if (v == null || now - v.windowStart > WINDOW_MS) {
                    return new RateEntry(now, new AtomicInteger(1));
                }
                v.count.incrementAndGet();
                return v;
            });

            if (entry.count.get() > MAX_ATTEMPTS) {
                HttpServletResponse res = (HttpServletResponse) response;
                res.setStatus(429);
                res.setContentType("application/json");
                res.getWriter().write("{\"status\":429,\"message\":\"Zu viele Login-Versuche. Bitte warten.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record RateEntry(long windowStart, AtomicInteger count) {}
}
