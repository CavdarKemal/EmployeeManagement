package com.employeemanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoftwareDTO {

    private Long id;

    @NotBlank
    private String name;

    private String vendor;
    private String version;
    private String category;
    private String licenseType;
    @Builder.Default
    private int totalLicenses = 1;
    @Builder.Default
    private int usedLicenses = 0;
    private BigDecimal costPerLicense;
    private LocalDate renewalDate;
    private String notes;
    private LocalDateTime createdAt;
}
