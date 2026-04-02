package com.employeemanagement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanRequestDTO {

    @NotNull(message = "Mitarbeiter-ID ist pflicht")
    private Long employeeId;

    private LocalDate returnDate;
    private String notes;
}
