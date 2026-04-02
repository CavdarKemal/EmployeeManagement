CREATE TYPE hardware_status AS ENUM (
    'AVAILABLE', 'LOANED', 'MAINTENANCE', 'RETIRED'
);

CREATE TABLE hardware (
    id              BIGSERIAL PRIMARY KEY,
    asset_tag       VARCHAR(50)  UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(100),
    manufacturer    VARCHAR(100),
    model           VARCHAR(100),
    serial_number   VARCHAR(100) UNIQUE,
    purchase_date   DATE,
    purchase_price  DECIMAL(10,2),
    warranty_until  DATE,
    status          hardware_status DEFAULT 'AVAILABLE',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hardware_status   ON hardware(status);
CREATE INDEX idx_hardware_category ON hardware(category);
