package com.employeemanagement.controller;

import com.employeemanagement.model.AppUser;
import com.employeemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notify")
@RequiredArgsConstructor
@Slf4j
public class DeploymentNotificationController {

    private final UserRepository userRepo;
    private final JavaMailSender mailSender;

    @Value("${app.deploy-notify.secret:}")
    private String expectedSecret;

    @Value("${spring.mail.username:noreply@employeemanagement.de}")
    private String fromAddress;

    @PostMapping("/deployment-pending")
    public ResponseEntity<Map<String, Object>> notifyDeployment(
            @RequestHeader(value = "X-Deploy-Secret", required = false) String secret,
            @RequestBody DeployInfo info) {

        if (expectedSecret == null || expectedSecret.isBlank()) {
            log.warn("Deploy-notify aufgerufen, aber kein Secret konfiguriert — Request abgelehnt");
            return ResponseEntity.status(503).body(Map.of("error", "notification not configured"));
        }
        if (!expectedSecret.equals(secret)) {
            log.warn("Deploy-notify mit falschem Secret abgelehnt");
            return ResponseEntity.status(401).body(Map.of("error", "invalid secret"));
        }

        List<AppUser> admins = userRepo.findByRoleAndEnabledTrue(AppUser.Role.ADMIN);
        if (admins.isEmpty()) {
            log.warn("Kein aktiver Admin gefunden — keine Benachrichtigung verschickt");
            return ResponseEntity.ok(Map.of("sent", 0, "admins", 0));
        }

        String subject = "[EmployeeManagement] Deployment erforderlich: " + shortSha(info);
        String body    = buildBody(info);

        int sent = 0;
        for (AppUser admin : admins) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromAddress);
                msg.setTo(admin.getEmail());
                msg.setSubject(subject);
                msg.setText(body);
                mailSender.send(msg);
                sent++;
                log.info("Deploy-Benachrichtigung an {} gesendet", admin.getEmail());
            } catch (Exception e) {
                log.error("Fehler beim Senden an {}: {}", admin.getEmail(), e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
                "sent", sent,
                "admins", admins.size(),
                "commit", info.commit() == null ? "" : info.commit()
        ));
    }

    private String shortSha(DeployInfo info) {
        String sha = info.commit();
        if (sha == null || sha.isBlank()) return "neue Änderungen";
        return sha.length() > 7 ? sha.substring(0, 7) : sha;
    }

    private String buildBody(DeployInfo info) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hallo Admin,\n\n");
        sb.append("es wurden neue Änderungen auf den main-Branch gepusht, die auf ")
          .append("den Produktions-Server (em.cavdar.de / VPS 94.130.228.157) deployt werden sollten.\n\n");

        sb.append("── Letzter Commit ──────────────────────────────────\n");
        if (info.commit() != null)  sb.append("  SHA:     ").append(info.commit()).append("\n");
        if (info.author() != null)  sb.append("  Autor:   ").append(info.author()).append("\n");
        if (info.message() != null) sb.append("  Message: ").append(info.message()).append("\n");
        if (info.url() != null)     sb.append("  URL:     ").append(info.url()).append("\n");
        sb.append("\n");

        sb.append("── Deployment-Anleitung ────────────────────────────\n\n");
        sb.append("1) Auf den Server verbinden:\n");
        sb.append("     ssh vps\n\n");
        sb.append("2) Ins Projektverzeichnis wechseln:\n");
        sb.append("     cd /opt/employeemanagement\n\n");
        sb.append("3) Datenbank-Backup erstellen:\n");
        sb.append("     docker exec employeemanagement-postgres \\\n");
        sb.append("       pg_dump -U employeemanagement employeemanagement \\\n");
        sb.append("       > /opt/backups/employeemanagement/db_$(date +%Y%m%d_%H%M%S).sql\n\n");
        sb.append("4) Code holen:\n");
        sb.append("     git pull\n\n");
        sb.append("5) Container bauen (je nach Änderung):\n");
        sb.append("     docker compose build --no-cache backend frontend\n\n");
        sb.append("6) Container starten:\n");
        sb.append("     docker compose up -d\n\n");
        sb.append("7) Status prüfen — alle 3 müssen (healthy) zeigen:\n");
        sb.append("     docker compose ps\n\n");
        sb.append("Vollständige Anleitung: siehe DEPLOYMENT_VPS.md im Repo.\n\n");
        sb.append("— EmployeeManagement Deploy-Bot\n");
        return sb.toString();
    }

    public record DeployInfo(String commit, String author, String message, String url) {}
}
