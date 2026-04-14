package com.employeemanagement.controller;

import com.employeemanagement.dto.HardwareDTO;
import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.service.HardwareService;
import com.employeemanagement.service.HardwareUnitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hardware")
@RequiredArgsConstructor
@Tag(name = "Hardware", description = "Hardware-Verwaltung")
public class HardwareController {

    private final HardwareService service;
    private final HardwareUnitService unitService;

    @GetMapping
    @Operation(summary = "Alle Hardware-Modelle abrufen (paginiert, filterbar)")
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
    @Operation(summary = "Neue Hardware (Modell + Units) anlegen")
    public ResponseEntity<HardwareDTO> create(@Valid @RequestBody HardwareDTO dto) {
        HardwareDTO created = service.create(dto);
        return ResponseEntity
                .created(URI.create("/api/v1/hardware/" + created.getId()))
                .body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Hardware-Modell aktualisieren")
    public ResponseEntity<HardwareDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody HardwareDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Hardware-Modell löschen (inkl. aller Units)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ── HardwareUnit ──────────────────────────────────────────

    @GetMapping("/{id}/units")
    @Operation(summary = "Alle Geräte eines Modells")
    public List<HardwareUnitDTO> listUnits(@PathVariable Long id) {
        return unitService.findByHardwareId(id);
    }

    @GetMapping("/{id}/units/available")
    @Operation(summary = "Verfügbare Geräte eines Modells")
    public List<HardwareUnitDTO> listAvailableUnits(@PathVariable Long id) {
        return unitService.findAvailable(id);
    }

    @PostMapping("/{id}/units")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gerät zu Hardware-Modell hinzufügen")
    public HardwareUnitDTO addUnit(@PathVariable Long id, @Valid @RequestBody HardwareUnitDTO dto) {
        return unitService.create(id, dto);
    }

    @PutMapping("/units/{unitId}")
    @Operation(summary = "Gerät aktualisieren")
    public HardwareUnitDTO updateUnit(@PathVariable Long unitId, @Valid @RequestBody HardwareUnitDTO dto) {
        return unitService.update(unitId, dto);
    }

    @DeleteMapping("/units/{unitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Gerät löschen")
    public void deleteUnit(@PathVariable Long unitId) {
        unitService.delete(unitId);
    }
}
