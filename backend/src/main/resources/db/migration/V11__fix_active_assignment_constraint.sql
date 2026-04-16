-- Das bisherige Constraint uq_active_assignment UNIQUE (employee_id, software_id, revoked_date)
-- hatte zwei Probleme:
--   1. Es verhinderte NICHT, dass dieselbe Software mehrfach AKTIV an denselben
--      Mitarbeiter zugewiesen wird (PostgreSQL behandelt NULLs in UNIQUE als distinct).
--   2. Es blockierte, dieselbe Software am selben Tag zweimal zu widerrufen
--      (was zwangsläufig passiert, wenn man Assign→Revoke→Assign→Revoke am selben Tag macht).
--
-- Der korrekte Mechanismus ist ein partieller Unique-Index, der nur aktive
-- Zuweisungen (revoked_date IS NULL) betrachtet.

ALTER TABLE software_assignments DROP CONSTRAINT IF EXISTS uq_active_assignment;

-- Defensive-Cleanup: Falls es durch das fehlerhafte alte Constraint
-- doppelte aktive Zeilen gibt (mehrere revoked_date=NULL für dasselbe
-- (employee_id, software_id)), behalten wir nur den neuesten Datensatz.
DELETE FROM software_assignments
WHERE revoked_date IS NULL
  AND id NOT IN (
      SELECT MAX(id)
      FROM software_assignments
      WHERE revoked_date IS NULL
      GROUP BY employee_id, software_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_assignment
    ON software_assignments (employee_id, software_id)
    WHERE revoked_date IS NULL;
