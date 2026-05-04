package com.employeemanagement.dto;

import java.time.LocalDateTime;

public record SqlHistoryEntry(
        Long id,
        LocalDateTime executedAt,
        String queryType,
        String queryText,
        Integer rowsAffected,
        int execTimeMs,
        String errorMessage,
        String sessionId
) {}
