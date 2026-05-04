package com.employeemanagement.dto;

import java.util.List;

public record SqlExecuteResponse(
        String queryType,
        List<String> columns,
        List<List<Object>> rows,
        Integer rowsAffected,
        boolean truncated,
        int execTimeMs,
        String message
) {}
