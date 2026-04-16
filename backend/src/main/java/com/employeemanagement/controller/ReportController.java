package com.employeemanagement.controller;

import com.employeemanagement.service.PdfReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "PDF-Berichte")
public class ReportController {

    private final PdfReportService pdfService;

    @GetMapping("/employees")
    @Operation(summary = "Mitarbeiter-Bericht als PDF")
    public ResponseEntity<byte[]> employeeReport() {
        return pdfResponse(pdfService.generateEmployeeReport(), "Mitarbeiter-Bericht.pdf");
    }

    @GetMapping("/hardware")
    @Operation(summary = "Hardware-Inventar als PDF")
    public ResponseEntity<byte[]> hardwareReport() {
        return pdfResponse(pdfService.generateHardwareReport(), "Hardware-Inventar.pdf");
    }

    @GetMapping("/licenses")
    @Operation(summary = "Lizenz-Audit-Bericht als PDF")
    public ResponseEntity<byte[]> licenseReport() {
        return pdfResponse(pdfService.generateLicenseReport(), "Lizenz-Audit.pdf");
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
