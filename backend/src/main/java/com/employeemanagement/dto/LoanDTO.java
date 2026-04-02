package com.employeemanagement.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanDTO {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long hardwareId;
    private String hardwareName;
    private String assetTag;
    private LocalDate loanDate;
    private LocalDate returnDate;
    private LocalDateTime returnedAt;
    private String notes;
    private boolean active;
    private LocalDateTime createdAt;
}
