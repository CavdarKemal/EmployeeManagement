# Hardware-Stückzahl (HardwareUnit) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hardware wird zum Modell; einzelne Geräte werden als `HardwareUnit` mit eigener Seriennummer geführt. Loans sind einer konkreten Unit zugeordnet. Die Stückzahl ergibt sich aus der Anzahl Units; verfügbar = Units mit Status AVAILABLE.

**Architecture:** Neue Entity `HardwareUnit` mit FK auf `Hardware`. `Loan.hardware_id` wird zu `loan.hardware_unit_id`. Flyway-Migration migriert bestehende Zeilen 1:1. Backend bekommt Unit-CRUD-Endpunkte; `POST /api/hardware` akzeptiert `units[]` und legt Modell + Units atomar an. Frontend-Hardware-Maske bekommt dynamische SN-Liste; Hardware-Liste zeigt `verfügbar/gesamt`; Loan-Dialog wählt konkrete Unit per Dropdown.

**Tech Stack:** Spring Boot 3.x (Java 21), JPA, Flyway, PostgreSQL 16, React 18, Vite.

**Referenz-Spec:** `docs/superpowers/specs/2026-04-14-hardware-stueckzahl-design.md`

**Build-Befehle:**
- Backend: `cd backend && ../ci.cmd 25`
- Frontend (lokal Container bauen): `docker compose up -d --build frontend`
- Full Redeploy: `docker compose up -d --build`

---

## Phase 1 — Backend: Datenmodell & Migration

### Task 1: Flyway-Migration `V12__hardware_units.sql`

**Files:**
- Create: `backend/src/main/resources/db/migration/V12__hardware_units.sql`

- [ ] **Step 1: Migration-Skript schreiben**

```sql
-- V12__hardware_units.sql
-- Einführung HardwareUnit (pro Modell n Geräte).

-- 1) Neue Tabelle hardware_unit
CREATE TABLE hardware_unit (
    id               BIGSERIAL PRIMARY KEY,
    hardware_id      BIGINT NOT NULL REFERENCES hardware(id) ON DELETE CASCADE,
    asset_tag        VARCHAR(50)  NOT NULL UNIQUE,
    serial_number    VARCHAR(100) UNIQUE,
    purchase_date    DATE,
    purchase_price   NUMERIC(10,2),
    warranty_until   DATE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'AVAILABLE',
    notes            TEXT,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hardware_unit_hardware_id ON hardware_unit(hardware_id);
CREATE INDEX idx_hardware_unit_status      ON hardware_unit(status);

-- 2) Bestehende Hardware-Zeilen werden zu je 1 HardwareUnit
INSERT INTO hardware_unit (
    hardware_id, asset_tag, serial_number, purchase_date,
    purchase_price, warranty_until, status, notes, created_at, updated_at
)
SELECT
    id, asset_tag, serial_number, purchase_date,
    purchase_price, warranty_until, status, notes,
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM hardware;

-- 3) Loan.hardware_id → loan.hardware_unit_id umhängen
ALTER TABLE loans ADD COLUMN hardware_unit_id BIGINT;

UPDATE loans l
SET hardware_unit_id = hu.id
FROM hardware_unit hu
WHERE hu.hardware_id = l.hardware_id;

ALTER TABLE loans ALTER COLUMN hardware_unit_id SET NOT NULL;
ALTER TABLE loans ADD CONSTRAINT fk_loan_hardware_unit
    FOREIGN KEY (hardware_unit_id) REFERENCES hardware_unit(id);
CREATE INDEX idx_loan_hardware_unit ON loans(hardware_unit_id);

ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_hardware_id_fkey;
ALTER TABLE loans DROP COLUMN hardware_id;

-- 4) Gerätespezifische Spalten aus hardware entfernen
ALTER TABLE hardware DROP COLUMN asset_tag;
ALTER TABLE hardware DROP COLUMN serial_number;
ALTER TABLE hardware DROP COLUMN purchase_date;
ALTER TABLE hardware DROP COLUMN purchase_price;
ALTER TABLE hardware DROP COLUMN warranty_until;
ALTER TABLE hardware DROP COLUMN status;
```

> **Hinweis:** Wenn der tatsächliche FK-Constraint-Name von `loans_hardware_id_fkey` abweicht, vorher mit `\d loans` in psql prüfen oder den `IF EXISTS`-Fallback nutzen.

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/resources/db/migration/V12__hardware_units.sql
git commit -m "feat(db): V12 Migration für HardwareUnit (Stückzahl-Modell)"
git push
```

---

### Task 2: Entity `HardwareUnit`

**Files:**
- Create: `backend/src/main/java/com/employeemanagement/model/HardwareUnit.java`

- [ ] **Step 1: Entity schreiben**

```java
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
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/model/HardwareUnit.java
git commit -m "feat(model): HardwareUnit Entity"
git push
```

---

### Task 3: `Hardware`-Entity entschlacken

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/model/Hardware.java`

- [ ] **Step 1: Gerätespezifische Felder entfernen, Units-Collection hinzufügen**

Ersetze den kompletten Klassenkörper durch:

```java
@Entity
@Table(name = "hardware")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hardware {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    @NotBlank
    private String name;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String manufacturer;

    @Column(length = 100)
    private String model;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "hardware", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<HardwareUnit> units = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

Entferne auch das Enum `HardwareStatus` — das wandert nach `HardwareUnit`.
Imports: `BigDecimal` und `LocalDate` können entfallen.

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/model/Hardware.java
git commit -m "refactor(model): Hardware wird Modell-Ebene, Gerätefelder → HardwareUnit"
git push
```

---

### Task 4: `Loan`-Entity umhängen

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/model/Loan.java`

- [ ] **Step 1: `hardware` durch `hardwareUnit` ersetzen**

Ersetze den Block

```java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hardware_id", nullable = false)
    private Hardware hardware;
```

durch

```java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hardware_unit_id", nullable = false)
    private HardwareUnit hardwareUnit;
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/model/Loan.java
git commit -m "refactor(model): Loan verweist auf HardwareUnit statt Hardware"
git push
```

---

## Phase 2 — Backend: Repository, DTO, Mapper

### Task 5: `HardwareUnitRepository`

**Files:**
- Create: `backend/src/main/java/com/employeemanagement/repository/HardwareUnitRepository.java`

- [ ] **Step 1: Repository schreiben**

```java
package com.employeemanagement.repository;

import com.employeemanagement.model.HardwareUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HardwareUnitRepository extends JpaRepository<HardwareUnit, Long> {
    List<HardwareUnit> findByHardwareId(Long hardwareId);
    List<HardwareUnit> findByHardwareIdAndStatus(Long hardwareId, HardwareUnit.HardwareUnitStatus status);
    boolean existsByAssetTag(String assetTag);
    boolean existsBySerialNumber(String serialNumber);
    long countByHardwareId(Long hardwareId);
    long countByHardwareIdAndStatus(Long hardwareId, HardwareUnit.HardwareUnitStatus status);
}
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/repository/HardwareUnitRepository.java
git commit -m "feat(repo): HardwareUnitRepository"
git push
```

---

### Task 6: `HardwareRepository` anpassen

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/repository/HardwareRepository.java`

- [ ] **Step 1: Methoden, die auf AssetTag/SerialNumber/Status operieren, entfernen**

Entferne `existsByAssetTag`, `existsBySerialNumber` und alle Query-Methoden/Ausdrücke, die auf `assetTag`, `serialNumber` oder `status` auf Hardware-Ebene verweisen. Die `search`-Query muss so umgebaut werden, dass sie nach `name/category/manufacturer/model` sucht (kein `assetTag`, kein Status-Filter mehr auf Hardware-Ebene — der Status lebt jetzt auf Unit-Ebene).

Falls der bestehende `search`-Query Parameter `status` hat: durch einen neuen Filter ersetzen, der Modelle liefert, die mindestens eine Unit im gegebenen Status haben (z.B. via EXISTS-Subquery):

```java
@Query("""
    SELECT h FROM Hardware h
    WHERE (:search IS NULL OR :search = ''
           OR LOWER(h.name) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(h.manufacturer) LIKE LOWER(CONCAT('%', :search, '%'))
           OR LOWER(h.model) LIKE LOWER(CONCAT('%', :search, '%'))
           OR EXISTS (SELECT 1 FROM HardwareUnit u WHERE u.hardware = h
                      AND (LOWER(u.assetTag) LIKE LOWER(CONCAT('%', :search, '%'))
                           OR LOWER(u.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')))))
      AND (:status IS NULL
           OR EXISTS (SELECT 1 FROM HardwareUnit u WHERE u.hardware = h AND u.status = :status))
    """)
Page<Hardware> search(@Param("search") String search,
                      @Param("status") HardwareUnit.HardwareUnitStatus status,
                      Pageable pageable);
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/repository/HardwareRepository.java
git commit -m "refactor(repo): HardwareRepository-Queries auf Modell-Ebene + Unit-Filter"
git push
```

---

### Task 7: `HardwareUnitDTO`

**Files:**
- Create: `backend/src/main/java/com/employeemanagement/dto/HardwareUnitDTO.java`

- [ ] **Step 1: DTO schreiben**

```java
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
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/dto/HardwareUnitDTO.java
git commit -m "feat(dto): HardwareUnitDTO"
git push
```

---

### Task 8: `HardwareDTO` anpassen

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/dto/HardwareDTO.java`

- [ ] **Step 1: Gerätespezifische Felder raus, Stückzahlfelder + Units rein**

Neuer Inhalt komplett:

```java
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

    // Read-only (berechnet im Mapper/Service)
    private Integer totalQuantity;
    private Integer availableQuantity;

    // Beim Anlegen/Bearbeiten: initiale Unit-Liste
    @Valid
    @Builder.Default
    private List<HardwareUnitDTO> units = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/dto/HardwareDTO.java
git commit -m "refactor(dto): HardwareDTO mit totalQuantity/availableQuantity + units[]"
git push
```

---

### Task 9: `HardwareUnitMapper`

**Files:**
- Create: `backend/src/main/java/com/employeemanagement/mapper/HardwareUnitMapper.java`

- [ ] **Step 1: Mapper schreiben**

```java
package com.employeemanagement.mapper;

import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import org.springframework.stereotype.Component;

@Component
public class HardwareUnitMapper {

    public HardwareUnitDTO toDTO(HardwareUnit u) {
        if (u == null) return null;
        return HardwareUnitDTO.builder()
                .id(u.getId())
                .hardwareId(u.getHardware() != null ? u.getHardware().getId() : null)
                .assetTag(u.getAssetTag())
                .serialNumber(u.getSerialNumber())
                .purchaseDate(u.getPurchaseDate())
                .purchasePrice(u.getPurchasePrice())
                .warrantyUntil(u.getWarrantyUntil())
                .status(u.getStatus() != null ? u.getStatus().name() : null)
                .notes(u.getNotes())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    public HardwareUnit toEntity(HardwareUnitDTO dto, Hardware hardware) {
        HardwareUnit u = HardwareUnit.builder()
                .hardware(hardware)
                .assetTag(dto.getAssetTag())
                .serialNumber(emptyToNull(dto.getSerialNumber()))
                .purchaseDate(dto.getPurchaseDate())
                .purchasePrice(dto.getPurchasePrice())
                .warrantyUntil(dto.getWarrantyUntil())
                .notes(dto.getNotes())
                .build();
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            u.setStatus(HardwareUnit.HardwareUnitStatus.valueOf(dto.getStatus().toUpperCase()));
        }
        return u;
    }

    public void updateEntity(HardwareUnitDTO dto, HardwareUnit target) {
        target.setAssetTag(dto.getAssetTag());
        target.setSerialNumber(emptyToNull(dto.getSerialNumber()));
        target.setPurchaseDate(dto.getPurchaseDate());
        target.setPurchasePrice(dto.getPurchasePrice());
        target.setWarrantyUntil(dto.getWarrantyUntil());
        target.setNotes(dto.getNotes());
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            target.setStatus(HardwareUnit.HardwareUnitStatus.valueOf(dto.getStatus().toUpperCase()));
        }
    }

    private String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/mapper/HardwareUnitMapper.java
git commit -m "feat(mapper): HardwareUnitMapper"
git push
```

---

### Task 10: `HardwareMapper` anpassen

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/mapper/HardwareMapper.java`

- [ ] **Step 1: totalQuantity/availableQuantity/units befüllen, alte Felder raus**

Ersetze die `toDTO`-Methode so, dass nur noch Modell-Felder gemappt werden und zusätzlich:

```java
import com.employeemanagement.model.HardwareUnit;
import java.util.List;
import java.util.stream.Collectors;

// ... im Mapper (Feld/Constructor-Injection):
private final HardwareUnitMapper unitMapper;

public HardwareDTO toDTO(Hardware h) {
    if (h == null) return null;
    List<HardwareUnit> units = h.getUnits() != null ? h.getUnits() : List.of();
    long available = units.stream()
            .filter(u -> u.getStatus() == HardwareUnit.HardwareUnitStatus.AVAILABLE)
            .count();
    return HardwareDTO.builder()
            .id(h.getId())
            .name(h.getName())
            .category(h.getCategory())
            .manufacturer(h.getManufacturer())
            .model(h.getModel())
            .notes(h.getNotes())
            .totalQuantity(units.size())
            .availableQuantity((int) available)
            .units(units.stream().map(unitMapper::toDTO).collect(Collectors.toList()))
            .createdAt(h.getCreatedAt())
            .updatedAt(h.getUpdatedAt())
            .build();
}

public Hardware toEntity(HardwareDTO dto) {
    return Hardware.builder()
            .id(dto.getId())
            .name(dto.getName())
            .category(dto.getCategory())
            .manufacturer(dto.getManufacturer())
            .model(dto.getModel())
            .notes(dto.getNotes())
            .build();
}

public void updateEntity(HardwareDTO dto, Hardware target) {
    target.setName(dto.getName());
    target.setCategory(dto.getCategory());
    target.setManufacturer(dto.getManufacturer());
    target.setModel(dto.getModel());
    target.setNotes(dto.getNotes());
}
```

> Stelle sicher, dass der Mapper die Injection-Annotation (`@RequiredArgsConstructor`/Lombok oder manueller Konstruktor) hat, damit `HardwareUnitMapper` injiziert wird.

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/mapper/HardwareMapper.java
git commit -m "refactor(mapper): HardwareMapper mit Quantity-Feldern + Unit-Liste"
git push
```

---

## Phase 3 — Backend: Services & Controller

### Task 11: `HardwareUnitService`

**Files:**
- Create: `backend/src/main/java/com/employeemanagement/service/HardwareUnitService.java`

- [ ] **Step 1: Service schreiben**

```java
package com.employeemanagement.service;

import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.exception.BusinessException;
import com.employeemanagement.exception.ResourceNotFoundException;
import com.employeemanagement.mapper.HardwareUnitMapper;
import com.employeemanagement.model.Hardware;
import com.employeemanagement.model.HardwareUnit;
import com.employeemanagement.repository.HardwareRepository;
import com.employeemanagement.repository.HardwareUnitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HardwareUnitService {

    private final HardwareUnitRepository unitRepo;
    private final HardwareRepository hardwareRepo;
    private final HardwareUnitMapper mapper;

    @Transactional(readOnly = true)
    public List<HardwareUnitDTO> findByHardwareId(Long hardwareId) {
        return unitRepo.findByHardwareId(hardwareId).stream().map(mapper::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<HardwareUnitDTO> findAvailable(Long hardwareId) {
        return unitRepo.findByHardwareIdAndStatus(hardwareId, HardwareUnit.HardwareUnitStatus.AVAILABLE)
                .stream().map(mapper::toDTO).toList();
    }

    public HardwareUnitDTO create(Long hardwareId, HardwareUnitDTO dto) {
        Hardware hw = hardwareRepo.findById(hardwareId)
                .orElseThrow(() -> new ResourceNotFoundException("Hardware", hardwareId));
        assertAssetTagFree(dto.getAssetTag(), null);
        assertSerialFree(dto.getSerialNumber(), null);
        HardwareUnit saved = unitRepo.save(mapper.toEntity(dto, hw));
        log.info("HardwareUnit angelegt: {} (Hardware {})", saved.getAssetTag(), hardwareId);
        return mapper.toDTO(saved);
    }

    public HardwareUnitDTO update(Long unitId, HardwareUnitDTO dto) {
        HardwareUnit existing = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("HardwareUnit", unitId));
        assertAssetTagFree(dto.getAssetTag(), existing);
        assertSerialFree(dto.getSerialNumber(), existing);
        mapper.updateEntity(dto, existing);
        return mapper.toDTO(unitRepo.save(existing));
    }

    public void delete(Long unitId) {
        HardwareUnit u = unitRepo.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("HardwareUnit", unitId));
        if (u.getStatus() == HardwareUnit.HardwareUnitStatus.LOANED)
            throw new BusinessException("Gerät ist aktuell ausgeliehen und kann nicht gelöscht werden");
        unitRepo.delete(u);
        log.info("HardwareUnit gelöscht: {}", unitId);
    }

    private void assertAssetTagFree(String tag, HardwareUnit current) {
        if (tag == null || tag.isBlank()) return;
        if (current != null && tag.equals(current.getAssetTag())) return;
        if (unitRepo.existsByAssetTag(tag))
            throw new BusinessException("Asset-Tag bereits vorhanden: " + tag);
    }

    private void assertSerialFree(String serial, HardwareUnit current) {
        if (serial == null || serial.isBlank()) return;
        if (current != null && serial.equals(current.getSerialNumber())) return;
        if (unitRepo.existsBySerialNumber(serial))
            throw new BusinessException("Seriennummer bereits vorhanden: " + serial);
    }
}
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/service/HardwareUnitService.java
git commit -m "feat(service): HardwareUnitService CRUD"
git push
```

---

### Task 12: `HardwareService` umbauen

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/service/HardwareService.java`

- [ ] **Step 1: `create` legt Modell + Units atomar an, `delete` prüft Units**

Neuer Inhalt der Klasse (Methodenköpfe analog, Logik geändert):

```java
@Transactional(readOnly = true)
public Page<HardwareDTO> findAll(Pageable pageable, String search, String status) {
    HardwareUnit.HardwareUnitStatus statusEnum = null;
    if (status != null && !status.isBlank()) {
        statusEnum = HardwareUnit.HardwareUnitStatus.valueOf(status.toUpperCase());
    }
    return repo.search(search, statusEnum, pageable).map(mapper::toDTO);
}

@Transactional(readOnly = true)
public HardwareDTO findById(Long id) {
    return repo.findById(id)
            .map(mapper::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
}

public HardwareDTO create(HardwareDTO dto) {
    if (dto.getUnits() == null || dto.getUnits().isEmpty())
        throw new BusinessException("Mindestens ein Gerät (Seriennummer/Asset-Tag) ist erforderlich");

    // Duplikate innerhalb der Request-Liste prüfen
    Set<String> tags = new HashSet<>();
    Set<String> serials = new HashSet<>();
    for (HardwareUnitDTO u : dto.getUnits()) {
        if (u.getAssetTag() == null || u.getAssetTag().isBlank())
            throw new BusinessException("Asset-Tag darf nicht leer sein");
        if (!tags.add(u.getAssetTag()))
            throw new BusinessException("Doppelter Asset-Tag in Anfrage: " + u.getAssetTag());
        if (u.getSerialNumber() != null && !u.getSerialNumber().isBlank() && !serials.add(u.getSerialNumber()))
            throw new BusinessException("Doppelte Seriennummer in Anfrage: " + u.getSerialNumber());
        if (unitRepo.existsByAssetTag(u.getAssetTag()))
            throw new BusinessException("Asset-Tag bereits vorhanden: " + u.getAssetTag());
        if (u.getSerialNumber() != null && !u.getSerialNumber().isBlank()
                && unitRepo.existsBySerialNumber(u.getSerialNumber()))
            throw new BusinessException("Seriennummer bereits vorhanden: " + u.getSerialNumber());
    }

    Hardware hw = mapper.toEntity(dto);
    List<HardwareUnit> units = dto.getUnits().stream()
            .map(u -> unitMapper.toEntity(u, hw))
            .toList();
    hw.getUnits().addAll(units);   // Cascade ALL speichert Units mit
    Hardware saved = repo.save(hw);
    log.info("Hardware angelegt: {} mit {} Gerät(en)", saved.getName(), units.size());
    return mapper.toDTO(saved);
}

public HardwareDTO update(Long id, HardwareDTO dto) {
    Hardware existing = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
    mapper.updateEntity(dto, existing);
    return mapper.toDTO(repo.save(existing));
}

public void delete(Long id) {
    Hardware hw = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Hardware", id));
    boolean anyLoaned = hw.getUnits().stream()
            .anyMatch(u -> u.getStatus() == HardwareUnit.HardwareUnitStatus.LOANED);
    if (anyLoaned)
        throw new BusinessException("Mindestens ein Gerät ist ausgeliehen — Löschen nicht möglich");
    repo.delete(hw);
    log.info("Hardware gelöscht: {}", id);
}
```

Ergänze oben:

```java
import com.employeemanagement.model.HardwareUnit;
import com.employeemanagement.dto.HardwareUnitDTO;
import com.employeemanagement.mapper.HardwareUnitMapper;
import com.employeemanagement.repository.HardwareUnitRepository;
import java.util.*;
```

Und die Constructor-Dependencies:

```java
private final HardwareUnitRepository unitRepo;
private final HardwareUnitMapper unitMapper;
```

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/service/HardwareService.java
git commit -m "refactor(service): HardwareService legt Modell + Units atomar an"
git push
```

---

### Task 13: `HardwareController` um Unit-Endpunkte erweitern

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/controller/HardwareController.java`

- [ ] **Step 1: Unit-Endpunkte dazubauen**

Neue Methoden im bestehenden Controller:

```java
private final HardwareUnitService unitService;   // zusätzliche Dep

@GetMapping("/{id}/units")
public List<HardwareUnitDTO> listUnits(@PathVariable Long id) {
    return unitService.findByHardwareId(id);
}

@GetMapping("/{id}/units/available")
public List<HardwareUnitDTO> listAvailableUnits(@PathVariable Long id) {
    return unitService.findAvailable(id);
}

@PostMapping("/{id}/units")
@ResponseStatus(HttpStatus.CREATED)
@PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
public HardwareUnitDTO addUnit(@PathVariable Long id, @Valid @RequestBody HardwareUnitDTO dto) {
    return unitService.create(id, dto);
}

@PutMapping("/units/{unitId}")
@PreAuthorize("hasRole('ADMIN') or hasRole('HR')")
public HardwareUnitDTO updateUnit(@PathVariable Long unitId, @Valid @RequestBody HardwareUnitDTO dto) {
    return unitService.update(unitId, dto);
}

@DeleteMapping("/units/{unitId}")
@ResponseStatus(HttpStatus.NO_CONTENT)
@PreAuthorize("hasRole('ADMIN')")
public void deleteUnit(@PathVariable Long unitId) {
    unitService.delete(unitId);
}
```

> Passe die `@PreAuthorize`-Rollen an die im Projekt etablierten an — siehe bestehende Hardware-Endpunkte.

Imports ergänzen: `HardwareUnitDTO`, `HardwareUnitService`, `HttpStatus`, `List`.

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/controller/HardwareController.java
git commit -m "feat(api): HardwareUnit-Endpunkte"
git push
```

---

### Task 14: `LoanService` auf HardwareUnit umbauen

**Files:**
- Modify: `backend/src/main/java/com/employeemanagement/service/LoanService.java`
- Modify: `backend/src/main/java/com/employeemanagement/controller/LoanController.java`
- Modify: `backend/src/main/java/com/employeemanagement/dto/LoanDTO.java` (falls Feld `hardwareId` existiert → `hardwareUnitId`)

- [ ] **Step 1: Vor Beginn aktuelle LoanService-Implementation lesen**

```bash
# Read the current files to understand what to change
```
Inspiziere die drei Dateien, um die vorhandene API nachzubilden — typische Operationen: `loan(hardwareId, employeeId, ...)`, `returnLoan(hardwareId)`.

- [ ] **Step 2: Methoden auf Unit-ID umstellen**

Logik-Schema:

```java
public LoanDTO loan(Long hardwareUnitId, LoanRequestDTO req) {
    HardwareUnit unit = unitRepo.findById(hardwareUnitId)
            .orElseThrow(() -> new ResourceNotFoundException("HardwareUnit", hardwareUnitId));
    if (unit.getStatus() != HardwareUnit.HardwareUnitStatus.AVAILABLE)
        throw new BusinessException("Gerät ist nicht verfügbar (Status: " + unit.getStatus() + ")");

    Employee emp = employeeRepo.findById(req.getEmployeeId())
            .orElseThrow(() -> new ResourceNotFoundException("Employee", req.getEmployeeId()));

    Loan loan = Loan.builder()
            .hardwareUnit(unit)
            .employee(emp)
            .loanDate(LocalDate.now())
            .returnDate(req.getReturnDate())
            .notes(req.getNotes())
            .build();

    unit.setStatus(HardwareUnit.HardwareUnitStatus.LOANED);
    unitRepo.save(unit);
    return loanMapper.toDTO(loanRepo.save(loan));
}

public LoanDTO returnLoan(Long hardwareUnitId, String notes) {
    Loan active = loanRepo.findFirstByHardwareUnitIdAndReturnedAtIsNull(hardwareUnitId)
            .orElseThrow(() -> new BusinessException("Keine aktive Ausleihe für dieses Gerät"));
    active.setReturnedAt(LocalDateTime.now());
    if (notes != null && !notes.isBlank()) {
        active.setNotes((active.getNotes() == null ? "" : active.getNotes() + "\n") + notes);
    }
    HardwareUnit unit = active.getHardwareUnit();
    unit.setStatus(HardwareUnit.HardwareUnitStatus.AVAILABLE);
    unitRepo.save(unit);
    return loanMapper.toDTO(loanRepo.save(active));
}
```

- [ ] **Step 3: Controller-Endpunkte anpassen**

Die bisherigen `/loans/hardware/{id}/loan` und `/loans/hardware/{id}/return` werden zu `/loans/hardware-unit/{unitId}/loan` und `/loans/hardware-unit/{unitId}/return`.

- [ ] **Step 4: `LoanMapper` & `LoanRepository`-Queries anpassen**

- `LoanRepository.findFirstByHardwareIdAndReturnedAtIsNull` → `findFirstByHardwareUnitIdAndReturnedAtIsNull`
- JPQL-Referenzen auf `loan.hardware` → `loan.hardwareUnit`
- `LoanMapper.toDTO` mappt `hardwareUnitId` (und optional Model-Infos aus `unit.getHardware()`)

- [ ] **Step 5: Committen**

```bash
git add backend/src/main/java/com/employeemanagement/service/LoanService.java \
        backend/src/main/java/com/employeemanagement/controller/LoanController.java \
        backend/src/main/java/com/employeemanagement/dto/LoanDTO.java \
        backend/src/main/java/com/employeemanagement/mapper/LoanMapper.java \
        backend/src/main/java/com/employeemanagement/repository/LoanRepository.java
git commit -m "refactor(loan): Loans referenzieren HardwareUnit"
git push
```

---

### Task 15: Restliche Compile-Fehler beheben

**Files:**
- Modify: alle Dateien, die noch auf entfernte Hardware-Felder/Methoden verweisen (z.B. `AuditLogService`, `ReportController`, `DashboardService`, `ImportService`)

- [ ] **Step 1: Backend bauen und Kompile-Fehler durchgehen**

```bash
cd backend && ../ci.cmd 25 2>&1 | grep -E "ERROR|error:" | head -50
```

- [ ] **Step 2: Fehler systematisch fixen**

Typische Fälle und Fix:
- Zugriff auf `hardware.getAssetTag()` → auf Unit-Ebene umhängen oder entfernen
- Zugriff auf `hardware.getStatus()` → entfernen; alternative: erster Unit-Status oder aggregiert
- `loan.getHardware()` → `loan.getHardwareUnit().getHardware()`
- CSV-Import für Hardware: an neue Struktur anpassen (pro Zeile = 1 Unit für Modell X, Modell per Name matchen oder anlegen)
  - Falls Import-Logik zu groß wird für diesen Plan: **skip** und als Folge-Issue notieren. Unique-Constraints verhindern Datenkorruption.

- [ ] **Step 3: Build muss grün sein**

```bash
cd backend && ../ci.cmd 25 2>&1 | tail -5
# Erwartet: BUILD SUCCESS
```

- [ ] **Step 4: Committen**

```bash
git add -u backend/
git commit -m "fix(backend): Kompile-Fehler nach Hardware/Unit-Split beheben"
git push
```

---

### Task 16: Sample-Daten / V4 Test-Daten anpassen

**Files:**
- Modify: `backend/src/main/resources/db/migration/V4__insert_test_data.sql` (falls Hardware-Inserts enthalten sind)

- [ ] **Step 1: `V4`-Hardware-Inserts auf Modell-Ebene reduzieren, Units-Inserts ergänzen**

Falls V4 Hardware-Zeilen mit Asset-Tag/SN enthält: die Migration V12 kümmert sich um bestehende Produktionsdaten. Für `docker-compose.test.yml`/leere DBs wird V4 neu ausgeführt — hier muss V4 kompatibel sein.

Prüfen:
```bash
grep -n "INSERT INTO hardware" backend/src/main/resources/db/migration/V4__insert_test_data.sql
```

Falls betroffen: INSERTs so teilen, dass Modell und Units getrennt angelegt werden. Spalten `asset_tag`, `serial_number`, ... nur in `hardware_unit`.

- [ ] **Step 2: Committen**

```bash
git add backend/src/main/resources/db/migration/V4__insert_test_data.sql
git commit -m "fix(db): V4 Testdaten an HardwareUnit-Struktur anpassen"
git push
```

> **Wichtig:** V4 NUR ändern, wenn sie noch nicht in Produktion lief (Flyway checksum!). Falls Checksum-Probleme: neue V13 mit Korrekturdaten statt V4-Änderung.

---

## Phase 4 — Frontend

### Task 17: Hardware-Liste zeigt `verfügbar/gesamt`

**Files:**
- Modify: `frontend/src/pages/HardwarePage.jsx`

- [ ] **Step 1: Spalte `Asset-Tag` entfernen, Spalte `Bestand` einfügen**

In der `<thead>`-Zeile `"Asset-Tag"` → `"Bestand"` ersetzen.

Im `<tbody>` die Asset-Tag-Zelle ersetzen durch:

```jsx
<td style={{ padding: "14px 14px" }}>
  <span style={{
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
    color: hw.availableQuantity > 0 ? "#34d399" : "#ef4444",
  }}>
    {hw.availableQuantity ?? 0} / {hw.totalQuantity ?? 0}
  </span>
</td>
```

Status-Spalte:  statt `hw.status` die Anzeige aus aggregierten Units ableiten — simpelste Variante: `hw.availableQuantity > 0 ? "AVAILABLE" : "LOANED"`.

Suchmaske/Filter-Pills: `hw.status` existiert nicht mehr auf Modell-Ebene. Filter "AVAILABLE" → `hw.availableQuantity > 0`. "LOANED" → `hw.availableQuantity === 0 && hw.totalQuantity > 0`. Filter "MAINTENANCE"/"RETIRED" vorerst auf `hw.units?.some(u => u.status === 'MAINTENANCE')` etc.

- [ ] **Step 2: Garantie-Spalte raus oder aggregiert anzeigen**

Garantie lebt jetzt pro Unit — die Modell-Liste hat keine Garantie mehr. Spalte `Garantie` in Tabelle entfernen; stattdessen `Hersteller · Modell`.

- [ ] **Step 3: Committen**

```bash
git add frontend/src/pages/HardwarePage.jsx
git commit -m "feat(ui): Hardware-Liste zeigt verfügbar/gesamt statt Asset-Tag"
git push
```

---

### Task 18: Maske „Neue Hardware" mit dynamischer Unit-Liste

**Files:**
- Modify: `frontend/src/pages/HardwarePage.jsx` (Komponente `HardwareFormModal`)

- [ ] **Step 1: Form-State umstellen**

Ersetze `HardwareFormModal` komplett:

```jsx
function HardwareFormModal({ hardware, onSave, onClose, toast }) {
  const isEdit = Boolean(hardware?.id);

  const initial = hardware ?? {
    name: "", category: "LAPTOP", manufacturer: "", model: "", notes: "",
    units: [{ assetTag: "", serialNumber: "", purchaseDate: "", warrantyUntil: "", purchasePrice: "" }],
  };

  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };

  const setUnit = (idx, k, v) => {
    setForm((f) => ({
      ...f,
      units: f.units.map((u, i) => (i === idx ? { ...u, [k]: v } : u)),
    }));
  };

  const addUnit = () => setForm((f) => ({
    ...f,
    units: [...f.units, { assetTag: "", serialNumber: "", purchaseDate: "", warrantyUntil: "", purchasePrice: "" }],
  }));

  const removeUnit = (idx) => setForm((f) => ({
    ...f,
    units: f.units.length > 1 ? f.units.filter((_, i) => i !== idx) : f.units,
  }));

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Pflichtfeld";
    if (!isEdit) {
      if (!form.units?.length) e.units = "Mindestens ein Gerät erforderlich";
      form.units?.forEach((u, i) => {
        if (!u.assetTag) e[`unit_${i}_assetTag`] = "Asset-Tag erforderlich";
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        manufacturer: form.manufacturer,
        model: form.model,
        notes: form.notes,
      };
      let result;
      if (isEdit) {
        result = await api.put(`/hardware/${form.id}`, payload);
      } else {
        payload.units = form.units.map((u) => ({
          assetTag: u.assetTag,
          serialNumber: u.serialNumber || null,
          purchaseDate: u.purchaseDate || null,
          warrantyUntil: u.warrantyUntil || null,
          purchasePrice: u.purchasePrice ? Number(u.purchasePrice) : null,
          status: "AVAILABLE",
        }));
        result = await api.post("/hardware", payload);
      }
      onSave(result);
    } catch (err) {
      toast?.(err?.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Hardware bearbeiten" : "Neue Hardware"} onClose={onClose} width={720}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Input label="Name" value={form.name} onChange={(e) => set("name", e.target.value)} required error={errors.name} placeholder='MacBook Pro 16"' />
        <Select label="Kategorie" value={form.category} onChange={(e) => set("category", e.target.value)} options={["LAPTOP", "MONITOR", "TABLET", "PHONE", "DESKTOP", "ACCESSORY"]} />
        <Input label="Hersteller" value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Apple" />
        <Input label="Modell" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="MK183D/A" />
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#94a3b8", display: "block", marginBottom: 5 }}>Notizen</label>
          <textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={2}
            style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9", boxSizing: "border-box" }} />
        </div>
      </div>

      {!isEdit && (
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
              Geräte ({form.units.length})
            </span>
            <Btn sm variant="secondary" onClick={addUnit}>+ Seriennummer hinzufügen</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {form.units.map((u, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr auto",
                gap: 8,
                padding: 10,
                background: "#0f172a",
                borderRadius: 8,
                border: "1px solid #334155",
              }}>
                <Input label="Asset-Tag *" value={u.assetTag} onChange={(e) => setUnit(i, "assetTag", e.target.value)}
                       error={errors[`unit_${i}_assetTag`]} placeholder="HW-0001" />
                <Input label="Seriennummer" value={u.serialNumber} onChange={(e) => setUnit(i, "serialNumber", e.target.value)} />
                <Input label="Kaufdatum" type="date" value={u.purchaseDate} onChange={(e) => setUnit(i, "purchaseDate", e.target.value)} />
                <Input label="Garantie bis" type="date" value={u.warrantyUntil} onChange={(e) => setUnit(i, "warrantyUntil", e.target.value)} />
                <button
                  onClick={() => removeUnit(i)}
                  disabled={form.units.length === 1}
                  title={form.units.length === 1 ? "Mindestens 1 Gerät erforderlich" : "Entfernen"}
                  style={{
                    alignSelf: "end",
                    padding: "8px 10px",
                    background: "transparent",
                    border: "1px solid #334155",
                    borderRadius: 6,
                    color: form.units.length === 1 ? "#334155" : "#ef4444",
                    cursor: form.units.length === 1 ? "not-allowed" : "pointer",
                  }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
        <Btn onClick={handleSave} disabled={saving}>{saving ? "Speichern …" : "Speichern"}</Btn>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Committen**

```bash
git add frontend/src/pages/HardwarePage.jsx
git commit -m "feat(ui): Neue Hardware-Maske mit dynamischer Seriennummer-Liste"
git push
```

---

### Task 19: Loan-Dialog mit Unit-Auswahl

**Files:**
- Modify: `frontend/src/pages/HardwarePage.jsx` (`LoanDialog` + `handleLoan`/`handleReturn`)

- [ ] **Step 1: Vor Öffnen verfügbare Units laden**

In `HardwarePage`, neuer State `unitsByHw` und Ladefunktion:

```jsx
const [loanDialogHw, setLoanDialogHw] = useState(null);
const [availableUnits, setAvailableUnits] = useState([]);

const openLoanDialog = async (hw) => {
  try {
    const units = await api.get(`/hardware/${hw.id}/units`);
    setAvailableUnits(units || []);
    setLoanDialogHw(hw);
  } catch {
    toast("Geräte konnten nicht geladen werden");
  }
};
```

Button `Ausleihen` ruft `openLoanDialog(hw)` statt `setLoanDialog(hw)`.

- [ ] **Step 2: `LoanDialog`-Komponente umbauen**

Dialog erhält zusätzlich `units` (alle Units für dieses Modell). User wählt:
1. Wenn mind. eine Unit LOANED → Modus "Rückgabe": Dropdown mit ausgeliehenen Units, Rückgabe auf gewählter Unit
2. Sonst Modus "Ausleihe": Dropdown mit AVAILABLE Units + Mitarbeiterauswahl

Skizze:

```jsx
function LoanDialog({ hardware, units, employees, onLoan, onReturn, onClose }) {
  const loanedUnits    = units.filter((u) => u.status === "LOANED");
  const availableUnits = units.filter((u) => u.status === "AVAILABLE");

  const hasLoaned    = loanedUnits.length > 0;
  const hasAvailable = availableUnits.length > 0;

  const [mode, setMode] = useState(hasAvailable ? "loan" : "return");
  const [unitId, setUnitId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAction = async () => {
    if (!unitId) return;
    setSaving(true);
    try {
      if (mode === "loan") await onLoan(Number(unitId), Number(employeeId), returnDate, notes);
      else                 await onReturn(Number(unitId), notes);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Modal title={`${HW_EMOJI[hardware.category] || "🖥️"} ${hardware.name}`} onClose={onClose}>
      {/* Bestandsanzeige */}
      <div style={{ marginBottom: 14, fontSize: 13, color: "#94a3b8" }}>
        Verfügbar: <strong style={{ color: "#34d399" }}>{availableUnits.length}</strong>
        {" · "}Ausgeliehen: <strong style={{ color: "#f59e0b" }}>{loanedUnits.length}</strong>
        {" · "}Gesamt: <strong style={{ color: "#f1f5f9" }}>{units.length}</strong>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {hasAvailable && (
          <Btn variant={mode === "loan" ? "primary" : "secondary"} onClick={() => setMode("loan")}>📤 Ausleihen</Btn>
        )}
        {hasLoaned && (
          <Btn variant={mode === "return" ? "primary" : "secondary"} onClick={() => setMode("return")}>📥 Zurückgeben</Btn>
        )}
      </div>

      {mode === "loan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select
            label="Gerät *"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            options={availableUnits.map((u) => ({
              value: u.id,
              label: `${u.assetTag}${u.serialNumber ? " · SN " + u.serialNumber : ""}`,
            }))}
          />
          <Select
            label="Mitarbeiter *"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={employees.filter((e) => e.active).map((e) => ({
              value: e.id,
              label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
            }))}
          />
          <Input label="Geplantes Rückgabedatum" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          <Input label="Notizen" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      {mode === "return" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select
            label="Zurückzugebendes Gerät *"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            options={loanedUnits.map((u) => ({
              value: u.id,
              label: `${u.assetTag}${u.serialNumber ? " · SN " + u.serialNumber : ""}`,
            }))}
          />
          <Input label="Zustandsnotiz" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      )}

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Abbrechen</Btn>
        <Btn onClick={handleAction} disabled={saving || !unitId || (mode === "loan" && !employeeId)}>
          {saving ? "…" : mode === "loan" ? "📤 Ausleihen" : "📥 Zurückgeben"}
        </Btn>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: `handleLoan`/`handleReturn` auf Unit-Basis**

```jsx
const handleLoan = async (unitId, empId, returnDate, notes) => {
  try {
    await api.post(`/loans/hardware-unit/${unitId}/loan`, {
      employeeId: empId,
      returnDate: returnDate || null,
      notes: notes || null,
    });
    // Hardware-Liste neu laden (einfachste Lösung für Bestandszähler)
    const data = await api.get("/hardware?size=200");
    if (data?.content) setHardware(data.content);
    toast("Gerät erfolgreich ausgeliehen");
  } catch (err) {
    toast(err?.message || "Ausleihe fehlgeschlagen");
  }
};

const handleReturn = async (unitId, notes) => {
  try {
    await api.post(`/loans/hardware-unit/${unitId}/return`, { notes: notes || null });
    const data = await api.get("/hardware?size=200");
    if (data?.content) setHardware(data.content);
    toast("Gerät zurückgenommen");
  } catch (err) {
    toast(err?.message || "Rückgabe fehlgeschlagen");
  }
};
```

JSX-Einsprungspunkt: `{loanDialogHw && <LoanDialog hardware={loanDialogHw} units={availableUnits} … />}`.

- [ ] **Step 4: Committen**

```bash
git add frontend/src/pages/HardwarePage.jsx
git commit -m "feat(ui): Loan-Dialog mit Unit-Auswahl (Ausleihe pro Seriennummer)"
git push
```

---

### Task 20: Hardware-Detail: Units-Management (inline)

**Files:**
- Modify: `frontend/src/pages/HardwarePage.jsx`

- [ ] **Step 1: Neue Modal-Komponente `UnitManagementModal`**

Wird geöffnet über einen zusätzlichen Button `Geräte` in der Aktionsspalte (neben Bearbeiten/Löschen). Zeigt Liste aller Units mit Inline-Edit + Löschen + `+ Gerät hinzufügen`:

```jsx
function UnitManagementModal({ hardware, onClose, toast }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ assetTag: "", serialNumber: "", purchaseDate: "", warrantyUntil: "", purchasePrice: "" });

  const reload = () => {
    setLoading(true);
    api.get(`/hardware/${hardware.id}/units`)
      .then((d) => setUnits(d || []))
      .finally(() => setLoading(false));
  };

  useEffect(reload, [hardware.id]);

  const addUnit = async () => {
    if (!newUnit.assetTag) { toast("Asset-Tag erforderlich"); return; }
    try {
      await api.post(`/hardware/${hardware.id}/units`, {
        ...newUnit,
        purchasePrice: newUnit.purchasePrice ? Number(newUnit.purchasePrice) : null,
      });
      setAdding(false);
      setNewUnit({ assetTag: "", serialNumber: "", purchaseDate: "", warrantyUntil: "", purchasePrice: "" });
      reload();
    } catch (err) { toast(err?.message || "Anlegen fehlgeschlagen"); }
  };

  const deleteUnit = async (id) => {
    if (!confirm("Gerät wirklich löschen?")) return;
    try { await api.delete(`/hardware/units/${id}`); reload(); }
    catch (err) { toast(err?.message || "Löschen fehlgeschlagen"); }
  };

  return (
    <Modal title={`Geräte: ${hardware.name}`} onClose={onClose} width={780}>
      {loading ? <Spinner /> : (
        <>
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr><th align="left">Asset-Tag</th><th align="left">SN</th><th align="left">Status</th><th align="left">Garantie</th><th></th></tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                  <td><code style={{ color: "#a5b4fc" }}>{u.assetTag}</code></td>
                  <td>{u.serialNumber || "—"}</td>
                  <td>{u.status}</td>
                  <td>{u.warrantyUntil || "—"}</td>
                  <td>
                    <Btn sm variant="danger" disabled={u.status === "LOANED"} onClick={() => deleteUnit(u.id)}>Löschen</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!adding && <Btn variant="secondary" onClick={() => setAdding(true)} style={{ marginTop: 14 }}>+ Gerät hinzufügen</Btn>}
          {adding && (
            <div style={{ marginTop: 14, padding: 12, background: "#0f172a", borderRadius: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <Input label="Asset-Tag *" value={newUnit.assetTag} onChange={(e) => setNewUnit({ ...newUnit, assetTag: e.target.value })} />
                <Input label="Seriennummer" value={newUnit.serialNumber} onChange={(e) => setNewUnit({ ...newUnit, serialNumber: e.target.value })} />
                <Input label="Kaufdatum" type="date" value={newUnit.purchaseDate} onChange={(e) => setNewUnit({ ...newUnit, purchaseDate: e.target.value })} />
                <Input label="Garantie bis" type="date" value={newUnit.warrantyUntil} onChange={(e) => setNewUnit({ ...newUnit, warrantyUntil: e.target.value })} />
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Btn variant="ghost" onClick={() => setAdding(false)}>Abbrechen</Btn>
                <Btn onClick={addUnit}>Anlegen</Btn>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: Button `Geräte` in Aktionsspalte + State anbinden**

```jsx
const [unitsDialog, setUnitsDialog] = useState(null);
// …
{mayWrite && <Btn sm variant="secondary" onClick={() => setUnitsDialog(hw)}>Geräte</Btn>}
// …
{unitsDialog && <UnitManagementModal hardware={unitsDialog} toast={toast} onClose={() => { setUnitsDialog(null); api.get("/hardware?size=200").then((d) => d?.content && setHardware(d.content)); }} />}
```

- [ ] **Step 3: Committen**

```bash
git add frontend/src/pages/HardwarePage.jsx
git commit -m "feat(ui): Hardware-Geräte-Verwaltung (Units hinzufügen/löschen)"
git push
```

---

## Phase 5 — Deploy & Verifikation

### Task 21: Lokal deployen

- [ ] **Step 1: Backend-JAR bauen**

```bash
cd E:/Projekte/ClaudeCode/EmployeeManagement/backend && ../ci.cmd 25
# Erwartet: BUILD SUCCESS
```

- [ ] **Step 2: Container neu bauen & starten**

```bash
cd E:/Projekte/ClaudeCode/EmployeeManagement
docker compose up -d --build
```

- [ ] **Step 3: Health-Checks**

```bash
docker ps --filter "name=employeemanagement" --format "table {{.Names}}\t{{.Status}}"
# backend + frontend müssen healthy sein
```

- [ ] **Step 4: Migration verifizieren**

```bash
docker exec -it employeemanagement-postgres psql -U employeemanagement -c "\d hardware_unit"
docker exec -it employeemanagement-postgres psql -U employeemanagement -c "SELECT COUNT(*) FROM hardware_unit;"
docker exec -it employeemanagement-postgres psql -U employeemanagement -c "SELECT COUNT(*) FROM loans WHERE hardware_unit_id IS NULL;"
# Letztes Ergebnis muss 0 sein
```

---

### Task 22: Smoke-Test im Browser

- [ ] **Step 1: Frontend aufrufen**

http://localhost:3000 → Login → Hardware

- [ ] **Step 2: Szenarien durchspielen**

1. Bestehende Hardware zeigt `1/1` (bzw. `0/1` wenn ausgeliehen) in Bestand-Spalte ✓
2. Neue Hardware anlegen:
   - 3 Seriennummern per Button "+ Seriennummer hinzufügen"
   - Speichern → Liste zeigt `3/3`
3. Ausleihen: Hardware klicken → Gerät (SN) wählen → Mitarbeiter wählen → Ausleihen → `2/3`
4. Rückgabe: gleiche Hardware → Rückgabemodus → Gerät wählen → Zurückgeben → `3/3`
5. Gerät löschen (ausgeliehen): Erwartet Fehler
6. Hardware löschen mit aktiver Ausleihe: Erwartet Fehler

- [ ] **Step 3: Falls ein Szenario fehlschlägt**

→ Back zum zugehörigen Task, fix, commit, push, redeploy.

---

## Self-Review-Notiz

Nach vollständiger Implementierung prüfen:
- [ ] Spec-Requirement "jede Ausleihe mit konkreter Seriennummer" → erfüllt durch `hardware_unit_id NOT NULL` in `loans` + Unit-Pflichtauswahl im Dialog
- [ ] "Anzahl Zeilen = initiale Stückzahl" → erfüllt durch `POST /api/hardware` mit `units[]`
- [ ] "Verfügbar = Units mit Status AVAILABLE" → `HardwareMapper.toDTO` berechnet `availableQuantity`
- [ ] Migration erhält Loans (Count vor/nach gleich, keine NULL-FKs)
- [ ] Build grün, Container healthy, UI-Szenarien durchlaufen ohne Fehler

---

## Bekannte Einschränkungen / Nicht-Ziele

- **CSV-Import** für Hardware ist nicht Teil dieses Plans. Bestehender Import-Code (`ImportService`) wird in Task 15 nur kompile-fähig gehalten (ggf. Funktion vorübergehend deaktivieren). Folge-Issue für Import-Anpassung.
- **Audit-Log**-Einträge verweisen ggf. noch auf alte Hardware-IDs — keine Korrektur nötig, nur Darstellung konsistent halten.
- **Dashboard-Widgets** (falls vorhanden) mit Hardware-Status: in Task 15 minimal anpassen (Summen über Units).
