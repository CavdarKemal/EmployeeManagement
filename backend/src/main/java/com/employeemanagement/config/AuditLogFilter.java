package com.employeemanagement.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Protokolliert alle schreibenden API-Aufrufe (POST, PUT, DELETE)
 * mit Benutzer, Methode, Pfad und HTTP-Status.
 */
@Component
@Order(1)
@Slf4j
public class AuditLogFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        chain.doFilter(request, response);

        String method = req.getMethod();
        if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method)) {
            String user = req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "anonymous";
            String path = req.getRequestURI();
            int status = res.getStatus();
            String ip = getClientIp(req);

            log.info("AUDIT | {} | {} {} | Status: {} | IP: {}", user, method, path, status, ip);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
