package com.employeemanagement.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@RequiredArgsConstructor
@Tag(name = "Admin – Benachrichtigungen")
@PreAuthorize("hasRole('ADMIN')")
public class NotificationConfigController {

    private final JavaMailSender mailSender;

    @Value("${app.notification.enabled:false}")
    private boolean enabled;

    @Value("${app.notification.recipient:}")
    private String recipient;

    @Value("${app.notification.warranty-days:30}")
    private int warrantyDays;

    @Value("${app.notification.renewal-days:30}")
    private int renewalDays;

    @Value("${app.notification.return-days:7}")
    private int returnDays;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @GetMapping("/config")
    @Operation(summary = "Benachrichtigungs-Konfiguration abrufen")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(Map.of(
                "enabled", enabled,
                "recipient", recipient,
                "warrantyDays", warrantyDays,
                "renewalDays", renewalDays,
                "returnDays", returnDays,
                "mailHost", mailHost,
                "mailUsername", mailUsername != null ? mailUsername : ""
        ));
    }

    @PostMapping("/test")
    @Operation(summary = "Test-E-Mail senden")
    public ResponseEntity<Map<String, String>> sendTestMail(@RequestParam String to) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject("[EmployeeManagement] Test-Benachrichtigung");
            msg.setText("Dies ist eine Test-E-Mail vom EmployeeManagement-System.\n\nWenn du diese E-Mail siehst, funktioniert die SMTP-Konfiguration korrekt.");
            if (mailUsername != null && !mailUsername.isBlank()) msg.setFrom(mailUsername);
            mailSender.send(msg);
            return ResponseEntity.ok(Map.of("status", "OK", "message", "Test-E-Mail gesendet an " + to));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }
}
