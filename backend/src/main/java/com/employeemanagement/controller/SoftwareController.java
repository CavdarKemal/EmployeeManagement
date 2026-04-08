package com.employeemanagement.controller;

import com.employeemanagement.dto.SoftwareDTO;
import com.employeemanagement.service.SoftwareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/software")
@RequiredArgsConstructor
@Tag(name = "Software", description = "Software-Lizenzverwaltung")
public class SoftwareController {

    private final SoftwareService service;

    @GetMapping
    @Operation(summary = "Alle Software abrufen (paginiert)")
    public ResponseEntity<Page<SoftwareDTO>> getAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @PostMapping
    @Operation(summary = "Neue Software anlegen")
    public ResponseEntity<SoftwareDTO> create(@Valid @RequestBody SoftwareDTO dto) {
        SoftwareDTO created = service.create(dto);
        return ResponseEntity
                .created(URI.create("/api/v1/software/" + created.getId()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Software aktualisieren")
    public ResponseEntity<SoftwareDTO> update(@PathVariable Long id, @Valid @RequestBody SoftwareDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Software löschen")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

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
