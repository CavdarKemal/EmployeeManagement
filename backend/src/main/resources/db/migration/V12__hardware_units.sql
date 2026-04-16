-- V12__hardware_units.sql
-- Hardware wird Modell-Ebene; einzelne Geräte als HardwareUnit.

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
    purchase_price, warranty_until, COALESCE(status, 'AVAILABLE'), notes,
    COALESCE(created_at, CURRENT_TIMESTAMP),
    COALESCE(updated_at, CURRENT_TIMESTAMP)
FROM hardware;

-- 3) Loan.hardware_id → loans.hardware_unit_id umhängen
-- Alte Constraints/Indizes auf loans entfernen
ALTER TABLE loans DROP CONSTRAINT IF EXISTS uq_active_loan;
DROP INDEX IF EXISTS idx_loans_hardware;
DROP INDEX IF EXISTS idx_loans_hardware_returned;

ALTER TABLE loans ADD COLUMN hardware_unit_id BIGINT;

UPDATE loans l
SET hardware_unit_id = hu.id
FROM hardware_unit hu
WHERE hu.hardware_id = l.hardware_id;

ALTER TABLE loans ALTER COLUMN hardware_unit_id SET NOT NULL;
ALTER TABLE loans ADD CONSTRAINT fk_loan_hardware_unit
    FOREIGN KEY (hardware_unit_id) REFERENCES hardware_unit(id) ON DELETE RESTRICT;

CREATE INDEX idx_loans_hardware_unit ON loans(hardware_unit_id);
CREATE INDEX idx_loans_hardware_unit_returned ON loans(hardware_unit_id, returned_at);
CREATE UNIQUE INDEX uq_active_loan_unit ON loans(hardware_unit_id) WHERE returned_at IS NULL;

ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_hardware_id_fkey;
ALTER TABLE loans DROP COLUMN hardware_id;

-- 4) Gerätespezifische Spalten aus hardware entfernen
ALTER TABLE hardware DROP COLUMN asset_tag;
ALTER TABLE hardware DROP COLUMN serial_number;
ALTER TABLE hardware DROP COLUMN purchase_date;
ALTER TABLE hardware DROP COLUMN purchase_price;
ALTER TABLE hardware DROP COLUMN warranty_until;
ALTER TABLE hardware DROP COLUMN status;
