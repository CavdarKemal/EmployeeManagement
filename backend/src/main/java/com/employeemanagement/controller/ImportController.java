package com.employeemanagement.controller;

import com.employeemanagement.dto.ImportResultDTO;
import com.employeemanagement.service.CsvImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/import")
@RequiredArgsConstructor
@Tag(name = "Import", description = "CSV-Import für Mitarbeiter, Hardware, Software")
@PreAuthorize("hasRole('ADMIN')")
public class ImportController {

    private final CsvImportService importService;

    @PostMapping("/employees")
    @Operation(summary = "Mitarbeiter aus CSV importieren")
    public ResponseEntity<ImportResultDTO> importEmployees(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importEmployees(file));
    }

    @PostMapping("/hardware")
    @Operation(summary = "Hardware aus CSV importieren")
    public ResponseEntity<ImportResultDTO> importHardware(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importHardware(file));
    }

    @PostMapping("/software")
    @Operation(summary = "Software aus CSV importieren")
    public ResponseEntity<ImportResultDTO> importSoftware(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(importService.importSoftware(file));
    }
}
