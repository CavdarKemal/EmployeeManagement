package com.employeemanagement.controller;

import com.employeemanagement.dto.*;
import com.employeemanagement.service.SqlExecutionService;
import com.employeemanagement.service.SqlSessionManager;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/sql")
@RequiredArgsConstructor
@Tag(name = "Admin – SQL Editor")
@PreAuthorize("hasRole('ADMIN')")
public class SqlController {

    private final SqlExecutionService service;
    private final SqlSessionManager sessions;

    @PostMapping("/execute")
    @Operation(summary = "Single-Shot SQL ausführen (Auto-Commit, nur SELECT-artig)")
    public ResponseEntity<SqlExecuteResponse> execute(@Valid @RequestBody SqlExecuteRequest req) {
        return ResponseEntity.ok(service.executeReadOnly(req.query(), currentUser()));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Neue Transaktions-Session öffnen (BEGIN)")
    public ResponseEntity<SqlSessionResponse> openSession() {
        SqlSessionManager.PinnedSession s = sessions.open(currentUser());
        return ResponseEntity.ok(new SqlSessionResponse(s.id, s.openedAt, sessions.getIdleTimeoutSeconds()));
    }

    @PostMapping("/sessions/{sessionId}/execute")
    @Operation(summary = "Query in laufender Transaktions-Session ausführen")
    public ResponseEntity<SqlExecuteResponse> executeInSession(
            @PathVariable String sessionId,
            @Valid @RequestBody SqlExecuteRequest req) {
        SqlSessionManager.PinnedSession s = sessions.get(sessionId, currentUser());
        return ResponseEntity.ok(service.executeInSession(s, req.query()));
    }

    @PostMapping("/sessions/{sessionId}/commit")
    @Operation(summary = "Transaktions-Session committen + schließen")
    public ResponseEntity<Void> commit(@PathVariable String sessionId) {
        sessions.commit(sessionId, currentUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/{sessionId}/rollback")
    @Operation(summary = "Transaktions-Session zurückrollen + schließen")
    public ResponseEntity<Void> rollback(@PathVariable String sessionId) {
        sessions.rollback(sessionId, currentUser());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/schema")
    @Operation(summary = "Tabellen + Spalten aus information_schema (public-Schema)")
    public ResponseEntity<SqlSchemaResponse> schema() {
        return ResponseEntity.ok(service.loadSchema());
    }

    @GetMapping("/history")
    @Operation(summary = "Eigene Query-History (letzte N)")
    public ResponseEntity<List<SqlHistoryEntry>> history(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(service.loadHistory(currentUser(), limit));
    }

    private static String currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? "unknown" : auth.getName();
    }
}
