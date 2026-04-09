package com.employeemanagement.service;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.SoftwareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.notification.enabled", havingValue = "true")
public class NotificationService {

    private final JavaMailSender mailSender;
    private final HardwareRepository hardwareRepo;
    private final SoftwareRepository softwareRepo;

    @Value("${app.notification.recipient}")
    private String recipient;

    @Value("${app.notification.warranty-days:30}")
    private int warrantyDays;

    @Value("${app.notification.renewal-days:30}")
    private int renewalDays;

    @Value("${spring.mail.username:noreply@employeemanagement.de}")
    private String fromAddress;

    /**
     * Tägliche Prüfung um 08:00 Uhr: Garantie-Ablauf und Lizenz-Erneuerung.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkExpirations() {
        log.info("Prüfe Garantie-Abläufe und Lizenz-Erneuerungen...");
        checkWarrantyExpiration();
        checkLicenseRenewal();
    }

    public void checkWarrantyExpiration() {
        LocalDate threshold = LocalDate.now().plusDays(warrantyDays);
        List<Hardware> expiring = hardwareRepo.findWarrantyExpiredBefore(threshold);

        if (expiring.isEmpty()) return;

        String body = expiring.stream()
                .map(hw -> String.format("  - %s (%s) — Garantie bis %s", hw.getName(), hw.getAssetTag(), hw.getWarrantyUntil()))
                .collect(Collectors.joining("\n"));

        sendMail(
                "Garantie-Warnung: " + expiring.size() + " Geräte",
                "Folgende Geräte haben eine ablaufende oder abgelaufene Garantie:\n\n" + body
        );
        log.info("Garantie-Warnung gesendet: {} Geräte", expiring.size());
    }

    public void checkLicenseRenewal() {
        LocalDate threshold = LocalDate.now().plusDays(renewalDays);
        List<Software> expiring = softwareRepo.findAll().stream()
                .filter(sw -> sw.getRenewalDate() != null && sw.getRenewalDate().isBefore(threshold))
                .toList();

        if (expiring.isEmpty()) return;

        String body = expiring.stream()
                .map(sw -> String.format("  - %s (%s) — Erneuerung am %s", sw.getName(), sw.getVendor(), sw.getRenewalDate()))
                .collect(Collectors.joining("\n"));

        sendMail(
                "Lizenz-Erneuerung: " + expiring.size() + " Software-Titel",
                "Folgende Lizenzen müssen in den nächsten " + renewalDays + " Tagen erneuert werden:\n\n" + body
        );
        log.info("Lizenz-Erneuerung gesendet: {} Titel", expiring.size());
    }

    private void sendMail(String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient);
            message.setSubject("[EmployeeManagement] " + subject);
            message.setText(text + "\n\n— EmployeeManagement System");
            mailSender.send(message);
        } catch (Exception e) {
            log.error("E-Mail konnte nicht gesendet werden: {}", e.getMessage());
        }
    }
}
