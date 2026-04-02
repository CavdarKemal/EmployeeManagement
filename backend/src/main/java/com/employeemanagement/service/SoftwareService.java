package com.employeemanagement.service;

import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.model.*;
import com.employeemanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SoftwareService {

    private final SoftwareRepository softwareRepo;
    private final EmployeeRepository employeeRepo;
    private final SoftwareAssignmentRepository assignmentRepo;

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
