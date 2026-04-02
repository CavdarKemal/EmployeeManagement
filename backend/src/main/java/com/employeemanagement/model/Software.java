package com.employeemanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "software")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Software {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    @NotBlank
    private String name;

    @Column(length = 100)
    private String vendor;

    @Column(length = 50)
    private String version;

    @Column(length = 100)
    private String category;

    @Column(name = "license_type", length = 50)
    private String licenseType;

    @Column(name = "total_licenses")
    @Builder.Default
    private int totalLicenses = 1;

    @Column(name = "used_licenses")
    @Builder.Default
    private int usedLicenses = 0;

    @Column(name = "cost_per_license", precision = 10, scale = 2)
    private BigDecimal costPerLicense;

    @Column(name = "renewal_date")
    private LocalDate renewalDate;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "software", fetch = FetchType.LAZY)
    @Builder.Default
    private List<SoftwareAssignment> assignments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
