CREATE TABLE app_users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    display_name        VARCHAR(100) NOT NULL,
    role                VARCHAR(20)  NOT NULL DEFAULT 'VIEWER',
    enabled             BOOLEAN      NOT NULL DEFAULT TRUE,
    account_non_locked  BOOLEAN      NOT NULL DEFAULT TRUE,
    employee_id         BIGINT REFERENCES employees(id) ON DELETE SET NULL,
    last_login_at       TIMESTAMP,
    password_changed_at TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON app_users(email);
CREATE INDEX idx_users_role  ON app_users(role);

-- Standard-Admin anlegen (Passwort: admin123 -> BCrypt-Hash)
INSERT INTO app_users (email, password_hash, display_name, role)
VALUES (
    'admin@firma.de',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'System Administrator',
    'ADMIN'
);
