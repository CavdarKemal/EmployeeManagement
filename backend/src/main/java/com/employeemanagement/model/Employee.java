package com.employeemanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_number", unique = true, nullable = false, length = 20)
    @NotBlank(message = "Mitarbeiternummer ist pflicht")
    private String employeeNumber;

    @Column(name = "first_name", nullable = false, length = 100)
    @NotBlank(message = "Vorname ist pflicht")
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    @NotBlank(message = "Nachname ist pflicht")
    private String lastName;

    @Column(unique = true, nullable = false, length = 255)
    @Email(message = "Ungültige E-Mail-Adresse")
    @NotBlank
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(length = 100)
    private String position;

    @Column(length = 100)
    private String department;

    @Column(name = "hire_date", nullable = false)
    @NotNull(message = "Einstellungsdatum ist pflicht")
    private LocalDate hireDate;

    @Column(precision = 12, scale = 2)
    @DecimalMin(value = "0.0", message = "Gehalt darf nicht negativ sein")
    private BigDecimal salary;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(length = 200)
    private String street;

    @Column(length = 100)
    private String city;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Column(length = 100)
    @Builder.Default
    private String country = "Deutschland";

    @Builder.Default
    private boolean active = true;

    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Loan> loans = new ArrayList<>();

    @OneToMany(mappedBy = "employee", fetch = FetchType.LAZY)
    @Builder.Default
    private List<SoftwareAssignment> softwareAssignments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
