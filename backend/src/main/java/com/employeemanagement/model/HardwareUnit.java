package com.employeemanagement.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "hardware_unit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"hardware", "loans"})
@EqualsAndHashCode(of = "id")
public class HardwareUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hardware_id", nullable = false)
    private Hardware hardware;

    @Column(name = "asset_tag", unique = true, nullable = false, length = 50)
    @NotBlank
    private String assetTag;

    @Column(name = "serial_number", unique = true, length = 100)
    private String serialNumber;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 10, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "warranty_until")
    private LocalDate warrantyUntil;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private HardwareUnitStatus status = HardwareUnitStatus.AVAILABLE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "hardwareUnit", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Loan> loans = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum HardwareUnitStatus {
        AVAILABLE, LOANED, MAINTENANCE, RETIRED
    }
}
