CREATE TABLE employees (
    id              BIGSERIAL PRIMARY KEY,
    employee_number VARCHAR(20)  UNIQUE NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(50),
    position        VARCHAR(100),
    department      VARCHAR(100),
    hire_date       DATE         NOT NULL,
    salary          DECIMAL(12,2),
    photo_url       VARCHAR(500),
    street          VARCHAR(200),
    city            VARCHAR(100),
    zip_code        VARCHAR(20),
    country         VARCHAR(100) DEFAULT 'Deutschland',
    active          BOOLEAN      DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT NOW(),
    updated_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_active     ON employees(active);
