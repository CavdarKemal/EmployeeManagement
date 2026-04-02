package com.employeemanagement.controller;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.service.HardwareService;
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
@RequestMapping("/api/v1/hardware")
@RequiredArgsConstructor
@Tag(name = "Hardware", description = "Hardware-Verwaltung")
public class HardwareController {

    private final HardwareService service;

    @GetMapping
    @Operation(summary = "Alle Hardware-Assets abrufen (paginiert, filterbar)")
    public ResponseEntity<Page<HardwareDTO>> getAll(
            Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.findAll(pageable, search, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Hardware per ID abrufen")
    public ResponseEntity<HardwareDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    @Operation(summary = "Neue Hardware anlegen")
    public ResponseEntity<HardwareDTO> create(@Valid @RequestBody HardwareDTO dto) {
        HardwareDTO created = service.create(dto);
        return ResponseEntity
                .created(URI.create("/api/v1/hardware/" + created.getId()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Hardware aktualisieren")
    public ResponseEntity<HardwareDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody HardwareDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hardware löschen")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
