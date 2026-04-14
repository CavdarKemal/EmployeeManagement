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

    @PostMapping("/hardware-unit/{unitId}/loan")
    @Operation(summary = "Gerät (HardwareUnit) ausleihen")
    public ResponseEntity<LoanDTO> loanHardwareUnit(
            @PathVariable Long unitId,
            @Valid @RequestBody LoanRequestDTO request) {
        return ResponseEntity.ok(
                loanService.loanHardwareUnit(
                        request.getEmployeeId(), unitId,
                        request.getReturnDate(), request.getNotes()));
    }

    @PostMapping("/hardware-unit/{unitId}/return")
    @Operation(summary = "Gerät zurückgeben")
    public ResponseEntity<LoanDTO> returnHardwareUnit(
            @PathVariable Long unitId,
            @RequestBody(required = false) ReturnRequest body) {
        String notes = body != null ? body.notes() : null;
        return ResponseEntity.ok(loanService.returnHardwareUnit(unitId, notes));
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

    public record ReturnRequest(String notes) {}
}
