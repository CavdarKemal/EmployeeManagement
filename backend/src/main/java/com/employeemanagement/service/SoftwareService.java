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
            return java.util.Map.<String, Object>of(
                "id", a.getId(),
                "softwareName", sw.getName(),
                "vendor", sw.getVendor() != null ? sw.getVendor() : "",
                "assignedDate", a.getAssignedDate().toString(),
                "licenseKey", a.getLicenseKey() != null ? a.getLicenseKey() : ""
            );
        }).toList();
    }

    public void assignLicense(Long softwareId, Long employeeId, String licenseKey) {
        Software sw = softwareRepo.findById(softwareId)
                .orElseThrow(() -> new ResourceNotFoundException("Software", softwareId));

        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mitarbeiter", employeeId));

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
