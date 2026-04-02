package com.employeemanagement.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "software_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SoftwareAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "software_id", nullable = false)
    private Software software;

    @Column(name = "assigned_date")
    @Builder.Default
    private LocalDate assignedDate = LocalDate.now();

    @Column(name = "revoked_date")
    private LocalDate revokedDate;

    @Column(name = "license_key", length = 255)
    private String licenseKey;

    public boolean isActive() {
        return revokedDate == null;
    }
}
