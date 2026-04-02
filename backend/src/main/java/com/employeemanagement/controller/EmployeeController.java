package com.employeemanagement.controller;

import com.employeemanagement.dto.EmployeeDTO;
import com.employeemanagement.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@Tag(name = "Mitarbeiter", description = "Mitarbeiterverwaltung")
public class EmployeeController {

    private final EmployeeService service;

    @GetMapping
    @Operation(summary = "Alle aktiven Mitarbeiter abrufen (paginiert, durchsuchbar)")
    public ResponseEntity<Page<EmployeeDTO>> getAll(
            Pageable pageable,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(service.findAll(pageable, search));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Mitarbeiter per ID abrufen")
    public ResponseEntity<EmployeeDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Neuen Mitarbeiter anlegen")
    public ResponseEntity<EmployeeDTO> create(
            @Valid @RequestPart("employee") EmployeeDTO dto,
            @RequestPart(value = "photo", required = false) MultipartFile photo) {
        EmployeeDTO created = service.create(dto, photo);
        return ResponseEntity
                .created(URI.create("/api/v1/employees/" + created.getId()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mitarbeiter aktualisieren")
    public ResponseEntity<EmployeeDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Mitarbeiter deaktivieren (Soft-Delete)")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
