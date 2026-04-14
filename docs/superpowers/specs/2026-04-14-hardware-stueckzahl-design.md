# Hardware-Stückzahl über HardwareUnit

**Datum:** 2026-04-14
**Projekt:** EmployeeManagement
**Status:** Approved

## Ziel

Hardware soll mehrfach vorhanden sein können (z.B. 10 gleiche Laptops). Pro Modell wird eine Stückzahl geführt; bei Ausleihe wird die verfügbare Menge dekrementiert — analog zum bestehenden Software-Lizenzmodell. Jedes einzelne Gerät behält seine Seriennummer, und jede Ausleihe muss einer konkreten Einheit zugeordnet werden (damit nachvollziehbar ist, wer welches Gerät inkl. Seriennummer hat).

## Datenmodell

### Hardware (Modell-Ebene)

Bleibt als Entity erhalten, verliert aber gerätespezifische Felder.

| Feld | Typ | Anmerkung |
|------|-----|-----------|
| id | Long | PK |
| name | String(200) | NotBlank |
| category | String(100) | |
| manufacturer | String(100) | |
| model | String(100) | |
| notes | TEXT | |
| createdAt / updatedAt | LocalDateTime | |
| units | `List<HardwareUnit>` | @OneToMany, mappedBy="hardware" |

**Berechnete Felder (nur im DTO, nicht persistiert):**
- `totalQuantity` = `units.size()`
- `availableQuantity` = Anzahl Units mit Status = AVAILABLE

### HardwareUnit (neu, Gerät-Ebene)

| Feld | Typ | Anmerkung |
|------|-----|-----------|
| id | Long | PK |
| hardware_id | Long | FK → hardware |
| assetTag | String(50) | unique |
| serialNumber | String(100) | unique |
| purchaseDate | LocalDate | |
| purchasePrice | BigDecimal(10,2) | |
| warrantyUntil | LocalDate | |
| status | Enum | AVAILABLE / LOANED / MAINTENANCE / RETIRED, Default AVAILABLE |
| notes | TEXT | |
| createdAt / updatedAt | LocalDateTime | |
| loans | `List<Loan>` | @OneToMany, mappedBy="hardwareUnit" |

### Loan (Änderung)

- `hardware_id` → `hardware_unit_id` (FK auf `hardware_unit`)
- Feld `hardwareUnit` statt `hardware`

## Backend

### Neue Komponenten
- `model/HardwareUnit.java` + Enum `HardwareUnitStatus`
- `repository/HardwareUnitRepository.java`
- `dto/HardwareUnitDTO.java`
- `mapper/HardwareUnitMapper.java`

### HardwareDTO
Ergänzt um `totalQuantity` und `availableQuantity` (beide int, read-only).

### Endpunkte
Bestehende Hardware-Endpunkte bleiben. Neu:
- `GET /api/hardware/{id}/units` — alle Units eines Modells
- `POST /api/hardware/{id}/units` — neue Unit anlegen
- `PUT /api/hardware/units/{unitId}` — Unit aktualisieren
- `DELETE /api/hardware/units/{unitId}` — Unit löschen (nur wenn keine aktiven Loans)
- `GET /api/hardware/{id}/units/available` — freie Units fürs Loan-Dropdown

### LoanService
- Bei Ausleihe: Prüfen ob gewählte Unit `status = AVAILABLE`, sonst Fehler. Setzt Unit auf `LOANED`.
- Bei Rückgabe: Unit zurück auf `AVAILABLE`.
- `hardware_id` im Loan-Request wird ersetzt durch `hardware_unit_id`.

### Flyway-Migration
Ein neues Skript `V{n}__hardware_units.sql`:

1. Tabelle `hardware_unit` anlegen (alle oben genannten Felder inkl. Unique-Indizes auf `asset_tag`, `serial_number`).
2. Für jede bestehende Zeile in `hardware` genau einen Eintrag in `hardware_unit` erzeugen — mit den Werten aus `asset_tag`, `serial_number`, `purchase_date`, `purchase_price`, `warranty_until`, `status`, `notes`.
3. Spalte `hardware_unit_id BIGINT` in `loan` anlegen, Werte aus `loan.hardware_id` über die 1:1-Mapping-Tabelle aus Schritt 2 umhängen, dann `NOT NULL` + FK setzen.
4. `loan.hardware_id` droppen.
5. Aus `hardware` die Spalten `asset_tag`, `serial_number`, `purchase_date`, `purchase_price`, `warranty_until`, `status` droppen.

## Frontend

### Hardware-Liste
Tabelle zeigt pro Modell zusätzliche Spalte `Verfügbar / Gesamt` (z.B. `7 / 10`), analog zur Software-Lizenzspalte.

### Hardware-Detail
Neuer Abschnitt/Tab **„Geräte"**:
- Liste aller Units mit Seriennummer, Asset-Tag, Status, Kaufdatum, Garantie
- Button „Gerät hinzufügen" → Dialog für neue Unit
- Inline-Bearbeiten/Löschen pro Zeile

### Loan-Dialog (Hardware ausleihen)
1. Hardware-Modell wählen (Dropdown mit Modellen, die verfügbare Units haben)
2. Konkrete Unit wählen (Dropdown der AVAILABLE Units des Modells mit Seriennummer + Asset-Tag)
3. Ausleihdauer etc. wie bisher

### Rückgabe
Setzt Unit automatisch zurück auf AVAILABLE.

## Tests

### Backend
- `HardwareUnitServiceTest`: CRUD, Unique-Constraints
- `LoanServiceTest`:
  - Ausleihe belegt Unit (Status-Wechsel AVAILABLE → LOANED)
  - Rückgabe gibt Unit frei (LOANED → AVAILABLE)
  - Keine Ausleihe möglich, wenn Unit nicht AVAILABLE
  - `availableQuantity` stimmt mit tatsächlichem Bestand überein
- Migrationstest mit Sample-Daten (bestehende Hardware + Loans werden korrekt überführt)

### Frontend
- Hardware-Liste zeigt Verfügbarkeit
- Loan-Dialog lädt nur verfügbare Units
- Unit-Verwaltung im Hardware-Detail funktioniert

## Offene Punkte / Annahmen
- Die aktuelle `HardwareStatus`-Enum wird zu `HardwareUnitStatus` (inhaltlich identisch).
- Bei Löschen eines Hardware-Modells werden alle Units mitgelöscht (Cascade), sofern keine aktiven Loans existieren.
- Sample-Daten (`sample-data/`) werden nach der Migration an das neue Schema angepasst.
