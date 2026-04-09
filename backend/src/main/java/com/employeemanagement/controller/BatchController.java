package com.employeemanagement.controller;

import com.employeemanagement.model.Hardware;
import com.employeemanagement.repository.EmployeeRepository;
import com.employeemanagement.repository.HardwareRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/batch")
@RequiredArgsConstructor
@Tag(name = "Batch", description = "Bulk-Operationen")
@PreAuthorize("hasAnyRole('ADMIN','HR')")
@Slf4j
public class BatchController {

    private final EmployeeRepository empRepo;
    private final HardwareRepository hwRepo;

    @PostMapping("/employees/deactivate")
    @Operation(summary = "Mehrere Mitarbeiter deaktivieren")
    public ResponseEntity<Map<String, Integer>> deactivateEmployees(@RequestBody List<Long> ids) {
        int count = 0;
        for (Long id : ids) {
            empRepo.findById(id).ifPresent(emp -> { emp.setActive(false); empRepo.save(emp); });
            count++;
        }
        log.info("Batch: {} Mitarbeiter deaktiviert", count);
        return ResponseEntity.ok(Map.of("deactivated", count));
    }

    @PostMapping("/employees/department")
    @Operation(summary = "Abteilung für mehrere Mitarbeiter ändern")
    public ResponseEntity<Map<String, Integer>> changeDepartment(
            @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) request.get("ids");
        String department = (String) request.get("department");
        int count = 0;
        for (Integer id : ids) {
            empRepo.findById(id.longValue()).ifPresent(emp -> { emp.setDepartment(department); empRepo.save(emp); });
            count++;
        }
        log.info("Batch: {} Mitarbeiter → Abteilung {}", count, department);
        return ResponseEntity.ok(Map.of("updated", count));
    }

    @PostMapping("/hardware/status")
    @Operation(summary = "Status für mehrere Hardware-Assets ändern")
    @PreAuthorize("hasAnyRole('ADMIN','IT')")
    public ResponseEntity<Map<String, Integer>> changeHardwareStatus(
            @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) request.get("ids");
        String status = (String) request.get("status");
        Hardware.HardwareStatus hwStatus = Hardware.HardwareStatus.valueOf(status);
        int count = 0;
        for (Integer id : ids) {
            hwRepo.findById(id.longValue()).ifPresent(hw -> { hw.setStatus(hwStatus); hwRepo.save(hw); });
            count++;
        }
        log.info("Batch: {} Hardware → Status {}", count, status);
        return ResponseEntity.ok(Map.of("updated", count));
    }

    @PostMapping("/hardware/delete")
    @Operation(summary = "Mehrere Hardware-Assets löschen")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Integer>> deleteHardware(@RequestBody List<Long> ids) {
        int count = 0;
        for (Long id : ids) {
            hwRepo.findById(id).ifPresent(hw -> {
                if (hw.getStatus() != Hardware.HardwareStatus.LOANED) { hwRepo.delete(hw); }
            });
            count++;
        }
        log.info("Batch: {} Hardware gelöscht", count);
        return ResponseEntity.ok(Map.of("deleted", count));
    }
}
