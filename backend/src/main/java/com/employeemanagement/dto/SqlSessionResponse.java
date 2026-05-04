package com.employeemanagement.dto;

import java.time.LocalDateTime;

public record SqlSessionResponse(
        String sessionId,
        LocalDateTime openedAt,
        int idleTimeoutSeconds
) {}
