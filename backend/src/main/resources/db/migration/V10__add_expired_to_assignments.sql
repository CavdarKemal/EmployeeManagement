-- Deaktiviert-Flag für abgelaufene Lizenzzuweisungen
ALTER TABLE software_assignments ADD COLUMN IF NOT EXISTS expired BOOLEAN NOT NULL DEFAULT FALSE;
