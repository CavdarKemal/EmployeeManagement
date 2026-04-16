package com.employeemanagement.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDTO {

    private Long id;

    @NotBlank(message = "Mitarbeiternummer ist pflicht")
    private String employeeNumber;

    @NotBlank(message = "Vorname ist pflicht")
    private String firstName;

    @NotBlank(message = "Nachname ist pflicht")
    private String lastName;

    @Email(message = "Ungültige E-Mail-Adresse")
    @NotBlank
    private String email;

    private String phone;
    private String position;
    private String department;

    @NotNull(message = "Einstellungsdatum ist pflicht")
    private LocalDate hireDate;

    @DecimalMin(value = "0.0", message = "Gehalt darf nicht negativ sein")
    private BigDecimal salary;

    private String photoUrl;
    private String street;
    private String city;
    private String zipCode;
    private String country;
    @Builder.Default
    private Boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
