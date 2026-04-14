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
public class HardwareUnitDTO {
    private Long id;
    private Long hardwareId;

    @NotBlank
    private String assetTag;

    private String serialNumber;
    private LocalDate purchaseDate;
    private BigDecimal purchasePrice;
    private LocalDate warrantyUntil;
    private String status;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
