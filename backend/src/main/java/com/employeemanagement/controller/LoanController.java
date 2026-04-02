package com.employeemanagement.controller;

import com.employeemanagement.dto.LoanDTO;
import com.employeemanagement.dto.LoanRequestDTO;
import com.employeemanagement.service.LoanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
@Tag(name = "Ausleihe", description = "Hardware-Ausleihe und Rückgabe")
public class LoanController {

    private final LoanService loanService;

    @PostMapping("/hardware/{hardwareId}/loan")
    @Operation(summary = "Hardware ausleihen")
    public ResponseEntity<LoanDTO> loanHardware(
            @PathVariable Long hardwareId,
            @Valid @RequestBody LoanRequestDTO request) {
        return ResponseEntity.ok(
                loanService.loanHardware(
                        request.getEmployeeId(), hardwareId,
                        request.getReturnDate(), request.getNotes()));
    }

    @PostMapping("/hardware/{hardwareId}/return")
    @Operation(summary = "Hardware zurückgeben")
    public ResponseEntity<LoanDTO> returnHardware(
            @PathVariable Long hardwareId,
            @RequestParam(required = false) String notes) {
        return ResponseEntity.ok(loanService.returnHardware(hardwareId, notes));
    }

    @GetMapping("/employees/{employeeId}/active")
    @Operation(summary = "Aktive Ausleihen eines Mitarbeiters")
    public ResponseEntity<List<LoanDTO>> getActiveLoans(@PathVariable Long employeeId) {
        return ResponseEntity.ok(loanService.getActiveLoansForEmployee(employeeId));
    }

    @GetMapping("/employees/{employeeId}/history")
    @Operation(summary = "Ausleihhistorie eines Mitarbeiters")
    public ResponseEntity<List<LoanDTO>> getLoanHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(loanService.getLoanHistoryForEmployee(employeeId));
    }
}
