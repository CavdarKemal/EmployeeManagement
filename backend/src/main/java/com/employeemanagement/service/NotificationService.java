package com.employeemanagement.service;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.Loan;
import com.employeemanagement.model.Software;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.LoanRepository;
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
    private final LoanRepository loanRepo;

    @Value("${app.notification.recipient}")
    private String recipient;

    @Value("${app.notification.warranty-days:30}")
    private int warrantyDays;

    @Value("${app.notification.renewal-days:30}")
    private int renewalDays;

    @Value("${app.notification.return-days:7}")
    private int returnDays;

    @Value("${spring.mail.username:noreply@employeemanagement.de}")
    private String fromAddress;

    /**
     * Tägliche Prüfung um 08:00 Uhr: Garantie-Ablauf und Lizenz-Erneuerung.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void checkExpirations() {
        log.info("Prüfe Garantie-Abläufe, Lizenz-Erneuerungen und Rückgabe-Termine...");
        checkWarrantyExpiration();
        checkLicenseRenewal();
        checkHardwareReturns();
    }

    public void checkWarrantyExpiration() {
        LocalDate threshold = LocalDate.now().plusDays(warrantyDays);
        List<Hardware> models = hardwareRepo.findWithWarrantyExpiredBefore(threshold);
        if (models.isEmpty()) return;

        StringBuilder sb = new StringBuilder();
        int unitCount = 0;
        for (Hardware hw : models) {
            for (var u : hw.getUnits()) {
                if (u.getWarrantyUntil() != null && u.getWarrantyUntil().isBefore(threshold)
                        && u.getStatus() != com.employeemanagement.model.HardwareUnit.HardwareUnitStatus.RETIRED) {
                    sb.append(String.format("  - %s (%s) — Garantie bis %s%n",
                            hw.getName(), u.getAssetTag(), u.getWarrantyUntil()));
                    unitCount++;
                }
            }
        }
        if (unitCount == 0) return;

        sendMail(
                "Garantie-Warnung: " + unitCount + " Geräte",
                "Folgende Geräte haben eine ablaufende oder abgelaufene Garantie:\n\n" + sb.toString()
        );
        log.info("Garantie-Warnung gesendet: {} Geräte", unitCount);
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

    public void checkHardwareReturns() {
        LocalDate threshold = LocalDate.now().plusDays(returnDays);
        List<Loan> due = loanRepo.findDueReturns(threshold);
        if (due.isEmpty()) return;

        // A) Sammel-Mail an Admin
        String summary = due.stream()
                .map(l -> String.format("  - %s (%s) — Mitarbeiter: %s %s — Rückgabe bis %s",
                        l.getHardwareUnit().getHardware().getName(),
                        l.getHardwareUnit().getAssetTag(),
                        l.getEmployee().getFirstName(),
                        l.getEmployee().getLastName(),
                        l.getReturnDate()))
                .collect(Collectors.joining("\n"));

        sendMail(
                recipient,
                "Hardware-Rückgabe: " + due.size() + " offene Ausleihen",
                "Folgende Ausleihen sind in den nächsten " + returnDays + " Tagen fällig (oder bereits überfällig):\n\n" + summary
        );
        log.info("Rückgabe-Sammel-Mail an Admin gesendet: {} Ausleihen", due.size());

        // B) Direkt-Mail an jeden betroffenen Mitarbeiter
        int sent = 0;
        for (Loan loan : due) {
            String empMail = loan.getEmployee().getEmail();
            if (empMail == null || empMail.isBlank()) continue;

            LocalDate returnBy = loan.getReturnDate();
            boolean overdue = returnBy.isBefore(LocalDate.now());
            String subject = overdue
                    ? "Überfällige Hardware-Rückgabe: " + loan.getHardwareUnit().getHardware().getName()
                    : "Erinnerung: Hardware-Rückgabe am " + returnBy;

            String body = String.format(
                    "Hallo %s,%n%n" +
                    "dies ist eine %s bezüglich deiner ausgeliehenen Hardware:%n%n" +
                    "  Gerät:       %s%n" +
                    "  Asset-Tag:   %s%n" +
                    "  Ausgeliehen: %s%n" +
                    "  Rückgabe %s: %s%n%n" +
                    "Bitte gib das Gerät rechtzeitig bei der IT zurück.",
                    loan.getEmployee().getFirstName(),
                    overdue ? "Mahnung" : "Erinnerung",
                    loan.getHardwareUnit().getHardware().getName(),
                    loan.getHardwareUnit().getAssetTag(),
                    loan.getLoanDate(),
                    overdue ? "war fällig am" : "bis",
                    returnBy
            );

            if (sendMail(empMail, subject, body)) sent++;
        }
        log.info("Rückgabe-Erinnerungen an Mitarbeiter verschickt: {}/{}", sent, due.size());
    }

    private void sendMail(String subject, String text) {
        sendMail(recipient, subject, text);
    }

    private boolean sendMail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject("[EmployeeManagement] " + subject);
            message.setText(text + "\n\n— EmployeeManagement System");
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.error("E-Mail an {} konnte nicht gesendet werden: {}", to, e.getMessage());
            return false;
        }
    }
}
