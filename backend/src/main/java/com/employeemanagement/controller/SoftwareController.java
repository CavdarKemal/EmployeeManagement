package com.employeemanagement.controller;

import com.employeemanagement.service.SoftwareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/software")
@RequiredArgsConstructor
@Tag(name = "Software", description = "Software-Lizenzverwaltung")
public class SoftwareController {

    private final SoftwareService service;

    @PostMapping("/{softwareId}/assign/{employeeId}")
    @Operation(summary = "Softwarelizenz einem Mitarbeiter zuweisen")
    public ResponseEntity<Void> assignLicense(
            @PathVariable Long softwareId,
            @PathVariable Long employeeId,
            @RequestParam(required = false) String licenseKey) {
        service.assignLicense(softwareId, employeeId, licenseKey);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{softwareId}/revoke/{employeeId}")
    @Operation(summary = "Softwarelizenz von einem Mitarbeiter entziehen")
    public ResponseEntity<Void> revokeLicense(
            @PathVariable Long softwareId,
            @PathVariable Long employeeId) {
        service.revokeLicense(softwareId, employeeId);
        return ResponseEntity.noContent().build();
    }
}
