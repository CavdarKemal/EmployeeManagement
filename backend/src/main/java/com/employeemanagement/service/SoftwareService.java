package com.employeemanagement.service;

import com.employeemanagement.dto.SoftwareDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.model.*;
import com.employeemanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SoftwareService {

    private final SoftwareRepository softwareRepo;
    private final EmployeeRepository employeeRepo;
    private final SoftwareAssignmentRepository assignmentRepo;

    @Transactional(readOnly = true)
    public Page<SoftwareDTO> findAll(Pageable pageable) {
        return softwareRepo.findAll(pageable).map(this::toDTO);
    }

    public SoftwareDTO create(SoftwareDTO dto) {
        Software entity = Software.builder()
                .name(dto.getName())
                .vendor(dto.getVendor())
                .version(dto.getVersion())
                .category(dto.getCategory())
                .licenseType(dto.getLicenseType())
                .totalLicenses(dto.getTotalLicenses() != null ? dto.getTotalLicenses() : 1)
                .costPerLicense(dto.getCostPerLicense())
                .renewalDate(dto.getRenewalDate())
                .notes(dto.getNotes())
                .build();
        Software saved = softwareRepo.save(entity);
        log.info("Software angelegt: {}", saved.getName());
        return toDTO(saved);
    }

    private SoftwareDTO toDTO(Software s) {
        return SoftwareDTO.builder()
                .id(s.getId())
                .name(s.getName())
                .vendor(s.getVendor())
                .version(s.getVersion())
                .category(s.getCategory())
                .licenseType(s.getLicenseType())
                .totalLicenses(s.getTotalLicenses())
                .usedLicenses(s.getUsedLicenses())
                .costPerLicense(s.getCostPerLicense())
                .renewalDate(s.getRenewalDate())
                .notes(s.getNotes())
                .createdAt(s.getCreatedAt())
                .build();
    }

    public SoftwareDTO update(Long id, SoftwareDTO dto) {
        Software existing = softwareRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Software", id));
        existing.setName(dto.getName());
        existing.setVendor(dto.getVendor());
        existing.setVersion(dto.getVersion());
        existing.setCategory(dto.getCategory());
        existing.setLicenseType(dto.getLicenseType());
        if (dto.getTotalLicenses() != null) existing.setTotalLicenses(dto.getTotalLicenses());
        existing.setCostPerLicense(dto.getCostPerLicense());
        existing.setRenewalDate(dto.getRenewalDate());
        existing.setNotes(dto.getNotes());
        return toDTO(softwareRepo.save(existing));
    }

    public void delete(Long id) {
        Software sw = softwareRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Software", id));
        if (sw.getUsedLicenses() > 0)
            throw new BusinessException("Software hat noch zugewiesene Lizenzen und kann nicht gelöscht werden");
        softwareRepo.delete(sw);
        log.info("Software gelöscht: {}", id);
    }

    @Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, Object>> getActiveAssignmentsForEmployee(Long employeeId) {
        return assignmentRepo.findActiveByEmployee(employeeId).stream().map(a -> {
            var sw = a.getSoftware();
            boolean isExpired = a.isExpired() || (sw.getRenewalDate() != null && sw.getRenewalDate().isBefore(java.time.LocalDate.now()));
            var map = new java.util.HashMap<String, Object>();
            map.put("id", a.getId());
            map.put("softwareId", sw.getId());
            map.put("softwareName", sw.getName());
            map.put("vendor", sw.getVendor() != null ? sw.getVendor() : "");
            map.put("assignedDate", a.getAssignedDate().toString());
            map.put("licenseKey", a.getLicenseKey() != null ? a.getLicenseKey() : "");
            map.put("expired", isExpired);
            map.put("renewalDate", sw.getRenewalDate() != null ? sw.getRenewalDate().toString() : null);
            return (java.util.Map<String, Object>) map;
        }).toList();
    }

    /**
     * Deaktiviert alle aktiven Zuweisungen für abgelaufene Software.
     * Wird vom Scheduled Job aufgerufen.
     */
    public int deactivateExpiredAssignments() {
        var expiredSoftware = softwareRepo.findAll().stream()
                .filter(sw -> sw.getRenewalDate() != null && sw.getRenewalDate().isBefore(java.time.LocalDate.now()))
                .toList();

        int count = 0;
        for (Software sw : expiredSoftware) {
            var assignments = assignmentRepo.findActiveByEmployee(null); // need all active for this software
            // Use direct query instead
        }
        // Simpler approach: query all non-expired active assignments and check
        var all = assignmentRepo.findAll().stream()
                .filter(a -> a.getRevokedDate() == null && !a.isExpired())
                .filter(a -> {
                    var sw = a.getSoftware();
                    return sw.getRenewalDate() != null && sw.getRenewalDate().isBefore(java.time.LocalDate.now());
                })
                .toList();

        for (var a : all) {
            a.setExpired(true);
            assignmentRepo.save(a);
            count++;
        }
        if (count > 0) log.info("Abgelaufene Lizenzen deaktiviert: {}", count);
        return count;
    }

    public void assignLicense(Long softwareId, Long employeeId, String licenseKey) {
        Software sw = softwareRepo.findById(softwareId)
                .orElseThrow(() -> new ResourceNotFoundException("Software", softwareId));

        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", employeeId));

        // Ablauf-Check
        if (sw.getRenewalDate() != null && sw.getRenewalDate().isBefore(java.time.LocalDate.now()))
            throw new BusinessException("Lizenz abgelaufen am " + sw.getRenewalDate() + ". Zuweisung nicht möglich.");

        // Duplikat-Check
        boolean alreadyAssigned = assignmentRepo.existsActiveAssignment(employeeId, softwareId);
        if (alreadyAssigned)
            throw new BusinessException("Lizenz bereits zugewiesen");

        // Kapazitätsprüfung
        if (sw.getUsedLicenses() >= sw.getTotalLicenses())
            throw new BusinessException("Keine freien Lizenzen verfügbar für: " + sw.getName());

        SoftwareAssignment assignment = SoftwareAssignment.builder()
                .employee(emp)
                .software(sw)
                .licenseKey(licenseKey)
                .build();

        assignmentRepo.save(assignment);
        sw.setUsedLicenses(sw.getUsedLicenses() + 1);
        softwareRepo.save(sw);
    }

    public void revokeLicense(Long softwareId, Long employeeId) {
        SoftwareAssignment assignment = assignmentRepo
                .findActiveAssignment(employeeId, softwareId)
                .orElseThrow(() -> new BusinessException("Keine aktive Lizenzzuweisung gefunden"));

        assignment.setRevokedDate(java.time.LocalDate.now());
        assignmentRepo.save(assignment);

        Software sw = assignment.getSoftware();
        sw.setUsedLicenses(Math.max(0, sw.getUsedLicenses() - 1));
        softwareRepo.save(sw);
    }
}
