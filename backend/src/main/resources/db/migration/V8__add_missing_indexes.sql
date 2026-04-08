-- Fehlende Indexes für häufig abgefragte Spalten
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_software_renewal_date ON software(renewal_date);
CREATE INDEX IF NOT EXISTS idx_loans_hardware_returned ON loans(hardware_id, returned_at);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
