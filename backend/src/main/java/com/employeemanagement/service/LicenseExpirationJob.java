package com.employeemanagement.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Täglicher Job: Deaktiviert Lizenzzuweisungen für abgelaufene Software.
 * Läuft unabhängig von der E-Mail-Benachrichtigung (immer aktiv).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class LicenseExpirationJob {

    private final SoftwareService softwareService;

    @Scheduled(cron = "0 5 0 * * *") // täglich um 00:05
    public void run() {
        int count = softwareService.deactivateExpiredAssignments();
        if (count > 0) {
            log.info("LicenseExpirationJob: {} Zuweisungen deaktiviert", count);
        }
    }
}
