package com.employeemanagement.controller;

import com.employeemanagement.model.AuditLogEntry;
import com.employeemanagement.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/audit-log")
@RequiredArgsConstructor
@Tag(name = "Admin – Audit-Log")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogRepository repo;

    @GetMapping
    @Operation(summary = "Audit-Log abrufen (paginiert, durchsuchbar)")
    public Page<AuditLogEntry> getAll(
            @PageableDefault(size = 50, sort = "createdAt") Pageable pageable,
            @RequestParam(required = false) String search) {
        return repo.search(search, pageable);
    }
}
