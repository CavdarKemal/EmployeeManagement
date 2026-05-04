package com.employeemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SqlExecuteRequest(
        @NotBlank
        @Size(max = 100_000)
        String query
) {}
