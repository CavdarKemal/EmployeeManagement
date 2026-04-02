CREATE TABLE software (
    id               BIGSERIAL PRIMARY KEY,
    name             VARCHAR(200) NOT NULL,
    vendor           VARCHAR(100),
    version          VARCHAR(50),
    category         VARCHAR(100),
    license_type     VARCHAR(50),
    total_licenses   INT     DEFAULT 1,
    used_licenses    INT     DEFAULT 0,
    cost_per_license DECIMAL(10,2),
    renewal_date     DATE,
    notes            TEXT,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE loans (
    id          BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE RESTRICT,
    hardware_id BIGINT REFERENCES hardware(id)  ON DELETE RESTRICT,
    loan_date   DATE      NOT NULL DEFAULT CURRENT_DATE,
    return_date DATE,
    returned_at TIMESTAMP,
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_active_loan UNIQUE (hardware_id, returned_at)
);

CREATE TABLE software_assignments (
    id            BIGSERIAL PRIMARY KEY,
    employee_id   BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    software_id   BIGINT REFERENCES software(id)  ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    revoked_date  DATE,
    license_key   VARCHAR(255),
    CONSTRAINT uq_active_assignment
        UNIQUE (employee_id, software_id, revoked_date)
);

CREATE INDEX idx_loans_employee   ON loans(employee_id);
CREATE INDEX idx_loans_hardware   ON loans(hardware_id);
CREATE INDEX idx_loans_returned   ON loans(returned_at);
