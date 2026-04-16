package com.employeemanagement.config;

import com.employeemanagement.repository.AuditLogRepository;
import com.employeemanagement.service.JwtService;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registriert den AuditLogFilter explizit VOR Spring Security.
 *
 * Spring Security läuft per Default bei Order -100. Wenn der AuditLogFilter
 * danach läuft, bricht Security bei 401/403 die Filter-Kette ab und der
 * Audit-Filter sieht die abgelehnten Requests nie.
 *
 * Mit Order -101 wrappt AuditLog Spring Security von außen: chain.doFilter
 * delegiert in Security hinein, Security schreibt die 403-Response und
 * kehrt zurück, dann kann AuditLog den Status lesen und loggen.
 */
@Configuration
public class FilterConfig {

    private static final int SPRING_SECURITY_FILTER_ORDER = -100;

    @Bean
    public FilterRegistrationBean<AuditLogFilter> auditLogFilterRegistration(AuditLogRepository auditRepo, JwtService jwtService) {
        FilterRegistrationBean<AuditLogFilter> reg = new FilterRegistrationBean<>();
        reg.setFilter(new AuditLogFilter(auditRepo, jwtService));
        reg.addUrlPatterns("/api/*");
        reg.setOrder(SPRING_SECURITY_FILTER_ORDER - 1);
        reg.setName("auditLogFilter");
        return reg;
    }
}
