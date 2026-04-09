package com.employeemanagement.config;

import com.employeemanagement.model.AuditLogEntry;
import com.employeemanagement.repository.AuditLogRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Protokolliert alle schreibenden API-Aufrufe (POST, PUT, DELETE)
 * in die Datenbank und ins Log.
 */
@Component
@Order(1)
@Slf4j
@RequiredArgsConstructor
public class AuditLogFilter implements Filter {

    private final AuditLogRepository auditRepo;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        chain.doFilter(request, response);

        String method = req.getMethod();
        if ("POST".equals(method) || "PUT".equals(method) || "DELETE".equals(method) || "PATCH".equals(method)) {
            String user = req.getUserPrincipal() != null ? req.getUserPrincipal().getName() : "anonymous";
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

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
