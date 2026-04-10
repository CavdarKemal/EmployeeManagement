package com.employeemanagement.config;

import com.employeemanagement.model.AuditLogEntry;
import com.employeemanagement.repository.AuditLogRepository;
import com.employeemanagement.service.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;

/**
 * Protokolliert alle schreibenden API-Aufrufe (POST, PUT, DELETE, PATCH)
 * in die Datenbank und ins Log — auch abgelehnte Requests (403/401),
 * damit wir Authorization-Probleme debuggen können.
 *
 * Registriert via FilterConfig mit einer Order VOR Spring Security,
 * damit bei rejected requests chain.doFilter zurückkehrt und wir den
 * Status lesen können.
 */
@Slf4j
@RequiredArgsConstructor
public class AuditLogFilter implements Filter {

    private final AuditLogRepository auditRepo;
    private final JwtService jwtService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        chain.doFilter(request, response);

        String method = req.getMethod();
        if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method)) {
            String user = extractUsernameFromJwt(req);
            if (user == null && req.getUserPrincipal() != null) user = req.getUserPrincipal().getName();
            if (user == null) user = "anonymous";
            String path = req.getRequestURI();
            int status = res.getStatus();
            String ip = getClientIp(req);

            log.info("AUDIT | {} | {} {} | Status: {} | IP: {}", user, method, path, status, ip);

            try {
                auditRepo.save(AuditLogEntry.builder()
                        .username(user)
                        .action(method)
                        .path(path)
                        .status(status)
                        .ipAddress(ip)
                        .build());
            } catch (Exception e) {
                log.warn("Audit-Log konnte nicht gespeichert werden: {}", e.getMessage());
            }
        }
    }

    private String extractUsernameFromJwt(HttpServletRequest req) {
        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        try {
            return jwtService.isTokenValid(token) ? jwtService.extractSubject(token) : null;
        } catch (Exception e) {
            return null;
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
