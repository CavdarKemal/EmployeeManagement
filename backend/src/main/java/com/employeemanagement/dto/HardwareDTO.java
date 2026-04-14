package com.employeemanagement.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HardwareDTO {

    private Long id;

    @NotBlank
    private String name;

    private String category;
    private String manufacturer;
    private String model;
    private String notes;

    private Integer totalQuantity;
    private Integer availableQuantity;

    @Valid
    @Builder.Default
    private List<HardwareUnitDTO> units = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
